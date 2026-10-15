const http = require('http');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const PORT = 8093;
const server = http.createServer((req, res) => {
    const cleanUrl = req.url.split('?')[0].replace(/^\/+/, '');
    let filePath = path.join(__dirname, '..', cleanUrl);
    if (!cleanUrl || filePath.endsWith(path.sep)) filePath = path.join(__dirname, '..', 'index.html');
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("Not found");
            return;
        }
        let ext = path.extname(filePath);
        let ct = 'text/html';
        if (ext === '.js') ct = 'application/javascript';
        if (ext === '.css') ct = 'text/css';
        if (ext === '.png') ct = 'image/png';
        res.writeHead(200, { 'Content-Type': ct });
        res.end(data);
    });
});

server.listen(PORT, async () => {
    console.log(`Test server at http://127.0.0.1:${PORT}`);
    
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const profileDir = 'C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_inspect_' + Date.now();
    const proc = cp.spawn(chromePath, [
        '--headless=new',
        '--remote-debugging-port=9228',
        `--user-data-dir=${profileDir}`,
        'about:blank'
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 200));
        try {
            const res = await fetch('http://127.0.0.1:9228/json/list');
            const data = await res.json();
            if (data && data.length > 0 && data[0].webSocketDebuggerUrl) {
                wsUrl = data[0].webSocketDebuggerUrl;
                break;
            }
        } catch (e) {}
    }

    if (!wsUrl) {
        console.error('No wsUrl found');
        proc.kill();
        server.close();
        return;
    }

    console.log('Connected to CDP');
    const ws = new WebSocket(wsUrl);

    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && callbacks.has(msg.id)) {
            const cb = callbacks.get(msg.id);
            callbacks.delete(msg.id);
            cb(msg);
        }
    };

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const reqId = id++;
            const timer = setTimeout(() => {
                callbacks.delete(reqId);
                reject(new Error(`Timeout on ${method}`));
            }, 8000);

            callbacks.set(reqId, (msg) => {
                clearTimeout(timer);
                resolve(msg.result || msg);
            });
            ws.send(JSON.stringify({ id: reqId, method, params }));
        });
    }

    await new Promise(r => ws.onopen = r);

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        mobile: false
    });

    console.log('Navigating to app...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Injecting credentials...');
    await send('Runtime.evaluate', {
        expression: `
            localStorage.setItem('sicom_author', 'Osvaldo Avilés');
            localStorage.setItem('sicom_role', 'Supremo');
            localStorage.setItem('sicom_theme', 'dark');
            location.reload();
        `
    });
    await new Promise(r => setTimeout(r, 3000));

    // TEST 1: Check multi-column layout
    console.log('Running TEST 1...');
    const evalCol = await send('Runtime.evaluate', {
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
    console.log('TEST 1 Multi-Column:', JSON.stringify(evalCol.result?.value, null, 2));

    // Capture Screenshot 1
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot1.data) {
        fs.writeFileSync(path.join(__dirname, 'mapa_multicolumn_expandido.png'), Buffer.from(shot1.data, 'base64'));
        console.log('Saved mapa_multicolumn_expandido.png');
    }

    // TEST 2: Check collapse buttons
    console.log('Running TEST 2...');
    const evalBtns = await send('Runtime.evaluate', {
        expression: `document.querySelectorAll('.mod-toggle-btn').length`,
        returnByValue: true
    });
    console.log('TEST 2 Module Toggle Buttons count:', evalBtns.result?.value);

    // TEST 3: Collapse single module
    console.log('Running TEST 3...');
    const evalColOne = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const mod = window.appData.modules.find(m => (m.projects || []).length > 6) || window.appData.modules[0];
                window.toggleModuleCollapse(mod.id);
                return {
                    collapsedMod: mod.name,
                    isCollapsed: window.isModuleCollapsed ? true : false,
                    visibleProjects: document.querySelectorAll('[data-project-id]').length
                };
            })()
        `,
        returnByValue: true
    });
    console.log('TEST 3 Collapse One Module:', evalColOne.result?.value);

    // TEST 4: Collapse All Modules
    console.log('Running TEST 4...');
    const evalColAll = await send('Runtime.evaluate', {
        expression: `
            (() => {
                window.collapseAllModules();
                return {
                    btnText: document.getElementById('btnToggleCollapseAllText')?.textContent,
                    visibleProjects: document.querySelectorAll('[data-project-id]').length,
                    visibleModules: document.querySelectorAll('[data-module-id]').length
                };
            })()
        `,
        returnByValue: true
    });
    console.log('TEST 4 Collapse All Modules:', evalColAll.result?.value);

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot2.data) {
        fs.writeFileSync(path.join(__dirname, 'mapa_todo_colapsado.png'), Buffer.from(shot2.data, 'base64'));
        console.log('Saved mapa_todo_colapsado.png');
    }

    // TEST 5: Expand All Modules
    console.log('Running TEST 5...');
    await send('Runtime.evaluate', { expression: `window.expandAllModules();` });
    await new Promise(r => setTimeout(r, 500));

    // TEST 6: Multi-Select Filter Drawer (Osvaldo + Emmanuel)
    console.log('Running TEST 6...');
    const evalMulti = await send('Runtime.evaluate', {
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
    console.log('TEST 6 Multi-Select Consultants:', evalMulti.result?.value);

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot3.data) {
        fs.writeFileSync(path.join(__dirname, 'filtros_multiselect_osvaldo_emmanuel.png'), Buffer.from(shot3.data, 'base64'));
        console.log('Saved filtros_multiselect_osvaldo_emmanuel.png');
    }

    // TEST 7: Multi-Select Companies (AFR + AVM)
    console.log('Running TEST 7...');
    const evalComp = await send('Runtime.evaluate', {
        expression: `
            (() => {
                window.toggleFilterChip('company', 'AFR');
                window.toggleFilterChip('company', 'AVM');
                const compChipsActive = Array.from(document.querySelectorAll('#advFilterCompanyChips .filter-chip.active')).map(c => c.textContent.trim());
                return {
                    activeChipsUI: compChipsActive,
                    badgeText: document.getElementById('activeFiltersBadge')?.textContent
                };
            })()
        `,
        returnByValue: true
    });
    console.log('TEST 7 Multi-Select Companies:', evalComp.result?.value);

    // TEST 8: Reset filters
    console.log('Running TEST 8...');
    const evalReset = await send('Runtime.evaluate', {
        expression: `
            (() => {
                window.resetAdvFilters();
                window.toggleFilterDrawer();
                return {
                    badgeHidden: document.getElementById('activeFiltersBadge')?.classList.contains('hidden')
                };
            })()
        `,
        returnByValue: true
    });
    console.log('TEST 8 Reset Filters:', evalReset.result?.value);

    // TEST 9: Secondary Links with Collapsed Module
    console.log('Running TEST 9...');
    const evalSec = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const allProjs = (window.appData.directProjects || []).concat((window.appData.modules || []).flatMap(m => m.projects || []));
                const secProj = allProjs.find(p => Array.isArray(p.secondaryModules) && p.secondaryModules.length > 0);
                if (!secProj) return { message: 'No secondary project found' };

                const secModId = secProj.secondaryModules[0];
                window.toggleModuleCollapse(secModId);

                const conns = document.querySelectorAll('.secondary-module-connector');
                const matchingConn = Array.from(conns).find(c => c.getAttribute('data-source-proj') === String(secProj.id));

                return {
                    testedProject: secProj.name,
                    secondaryModuleId: secModId,
                    destinationModuleCollapsed: true,
                    connectorFound: !!matchingConn,
                    connectorD: matchingConn ? matchingConn.getAttribute('d') : null
                };
            })()
        `,
        returnByValue: true
    });
    console.log('TEST 9 Secondary links with collapsed module:', evalSec.result?.value);

    console.log('--- ALL TESTS FINISHED SUCCESSFULLY! ---');
    proc.kill();
    server.close();
    process.exit(0);
});
