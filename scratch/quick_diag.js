const http = require('http');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const PORT = 8094;
const server = http.createServer((req, res) => {
    const cleanUrl = req.url.split('?')[0].replace(/^\/+/, '');
    let filePath = path.join(__dirname, '..', cleanUrl);
    if (!cleanUrl || filePath.endsWith(path.sep)) filePath = path.join(__dirname, '..', 'index.html');
    
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end("Not found"); return; }
        let ext = path.extname(filePath);
        let ct = 'text/html';
        if (ext === '.js') ct = 'application/javascript';
        if (ext === '.css') ct = 'text/css';
        res.writeHead(200, { 'Content-Type': ct });
        res.end(data);
    });
});

server.listen(PORT, async () => {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const profileDir = 'C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_inspect_' + Date.now();
    const proc = cp.spawn(chromePath, [
        '--headless=new',
        '--remote-debugging-port=9229',
        `--user-data-dir=${profileDir}`,
        'about:blank'
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 200));
        try {
            const res = await fetch('http://127.0.0.1:9229/json/list');
            const data = await res.json();
            if (data && data.length > 0 && data[0].webSocketDebuggerUrl) {
                wsUrl = data[0].webSocketDebuggerUrl;
                break;
            }
        } catch (e) {}
    }

    if (!wsUrl) { proc.kill(); server.close(); return; }

    const ws = new WebSocket(wsUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
            console.log('[BROWSER LOG]:', msg.params.args.map(a => a.value !== undefined ? a.value : a.description).join(' '));
        } else if (msg.method === 'Runtime.exceptionThrown') {
            console.error('[BROWSER ERR]:', msg.params.exceptionDetails?.text, msg.params.exceptionDetails?.exception?.description);
        } else if (msg.id && callbacks.has(msg.id)) {
            const cb = callbacks.get(msg.id);
            callbacks.delete(msg.id);
            cb(msg.result || msg);
        }
    };

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const reqId = id++;
            const timer = setTimeout(() => {
                callbacks.delete(reqId);
                reject(new Error(`Timeout on ${method}`));
            }, 6000);

            callbacks.set(reqId, (res) => {
                clearTimeout(timer);
                resolve(res);
            });
            ws.send(JSON.stringify({ id: reqId, method, params }));
        });
    }

    await new Promise(r => ws.onopen = r);
    await send('Runtime.enable');
    await send('Page.enable');

    console.log('Navigating...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });

    // Wait for scripts to initialize
    for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 400));
        const checkFn = await send('Runtime.evaluate', {
            expression: 'typeof window.renderMindMap'
        });
        if (checkFn && checkFn.result && checkFn.result.value === 'function') {
            console.log('Scripts initialized!');
            break;
        }
    }

    console.log('Logging in as Osvaldo Avilés...');
    await send('Runtime.evaluate', {
        expression: `
            if (typeof window.switchUser === 'function') {
                window.switchUser('Osvaldo Avilés');
            }
        `
    });
    await new Promise(r => setTimeout(r, 1500));

    const res = await send('Runtime.evaluate', {
        expression: `
            (() => {
                return {
                    hasAppData: typeof window.appData !== 'undefined',
                    modulesCount: window.appData?.modules?.length,
                    renderedProjectNodes: document.querySelectorAll('.mindmap-project-node').length,
                    renderedModuleNodes: document.querySelectorAll('.mindmap-module-node').length,
                    toggleButtons: document.querySelectorAll('.mod-toggle-btn').length
                };
            })()
        `,
        returnByValue: true
    });

    console.log('DOM STATE:', JSON.stringify(res.result?.value, null, 2));

    // TEST Multi-column layout calculation
    const multiColRes = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const results = [];
                (window.appData.modules || []).forEach(m => {
                    const count = (m.projects || []).length;
                    if (count > 6) {
                        const xs = (m.projects || []).map(p => p._renderData ? p._renderData.x : null).filter(Boolean);
                        const uniqueXs = Array.from(new Set(xs));
                        results.push({
                            module: m.name,
                            count: count,
                            uniqueXs: uniqueXs,
                            isMultiColumn: uniqueXs.length >= 2
                        });
                    }
                });
                return results;
            })()
        `,
        returnByValue: true
    });
    console.log('MULTI-COLUMN RESULTS:', JSON.stringify(multiColRes.result?.value, null, 2));

    // TEST Multi-selection in filter chips
    const multiSelectRes = await send('Runtime.evaluate', {
        expression: `
            (() => {
                window.toggleFilterDrawer();
                window.toggleFilterChip('consultant', 'Osvaldo Avilés');
                window.toggleFilterChip('consultant', 'Emmanuel Sánchez');

                const consChipsActive = Array.from(document.querySelectorAll('#advFilterConsultantChips .filter-chip.active')).map(c => c.textContent.trim());
                const badgeText = document.getElementById('activeFiltersBadge')?.textContent;

                const mapNodes = Array.from(document.querySelectorAll('.mindmap-project-node')).map(el => ({
                    id: el.getAttribute('data-project-id'),
                    opacity: el.getAttribute('opacity')
                }));
                const activeCount = mapNodes.filter(n => n.opacity === '1').length;
                const dimmedCount = mapNodes.filter(n => n.opacity === '0.15').length;

                return {
                    activeChipsUI: consChipsActive,
                    badgeCount: badgeText,
                    activeOnMap: activeCount,
                    dimmedOnMap: dimmedCount
                };
            })()
        `,
        returnByValue: true
    });
    console.log('MULTI-SELECT RESULTS:', JSON.stringify(multiSelectRes.result?.value, null, 2));

    proc.kill();
    server.close();
    process.exit(0);
});
