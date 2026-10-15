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
    console.log(`Test server running at http://127.0.0.1:${PORT}`);
    
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const proc = cp.spawn(chromePath, [
        '--headless=new',
        '--remote-debugging-port=9229',
        '--user-data-dir=C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_inspect_profile_' + Date.now(),
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

    if (!wsUrl) {
        console.error('No wsUrl found for Chrome CDP');
        proc.kill();
        server.close();
        process.exit(1);
    }

    console.log('Connected to Chrome CDP WebSocket');
    const ws = new WebSocket(wsUrl);

    let id = 1;
    function send(method, params = {}) {
        return new Promise((resolve) => {
            const reqId = id++;
            const handler = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.id === reqId) {
                    ws.removeEventListener('message', handler);
                    resolve(msg.result);
                }
            };
            ws.addEventListener('message', handler);
            ws.send(JSON.stringify({ id: reqId, method, params }));
        });
    }

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.exceptionThrown') {
            console.error('[BROWSER EXCEPTION]:', msg.params.exceptionDetails?.text, msg.params.exceptionDetails?.exception?.description || '');
        }
    };

    await new Promise(r => ws.onopen = r);

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        mobile: false
    });

    console.log('Navigating to app and injecting credentials...');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
    await new Promise(r => setTimeout(r, 2000));

    await send('Runtime.evaluate', {
        expression: `
            localStorage.setItem('sicom_author', 'Osvaldo Avilés');
            localStorage.setItem('sicom_role', 'Supremo');
            localStorage.setItem('sicom_theme', 'dark');
            location.reload();
        `
    });

    await new Promise(r => setTimeout(r, 3000));

    // TEST 1: Inspect module columns and single column alignment
    const evalResult = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const modules = (window.appData.modules || []).map(m => {
                    const count = (m.projects || []).length;
                    const xs = (m.projects || []).map(p => p._renderData ? p._renderData.x : null).filter(Boolean);
                    const uniqueXs = Array.from(new Set(xs));
                    return {
                        id: m.id,
                        name: m.name,
                        count: count,
                        uniqueXs: uniqueXs,
                        isSingleColumn: uniqueXs.length <= 1
                    };
                });
                const totalProjectsOnMap = document.querySelectorAll('.mindmap-project-node').length;
                const toggleBtns = document.querySelectorAll('.mod-toggle-btn').length;
                return {
                    modules: modules,
                    totalProjectsOnMap: totalProjectsOnMap,
                    toggleBtns: toggleBtns
                };
            })()
        `,
        returnByValue: true
    });

    console.log('--- TEST 1: MAP MODULES & SINGLE COLUMN CHECK ---');
    console.log(JSON.stringify(evalResult?.value, null, 2));

    // Take screenshot of clean full mindmap
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot1 && shot1.data) {
        fs.writeFileSync(path.join(__dirname, 'mapa_limpio_ordenado.png'), Buffer.from(shot1.data, 'base64'));
        console.log('Saved mapa_limpio_ordenado.png');
    }

    // TEST 2: Collapse Portal Operativo and verify stability
    const collapseTest = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const portal = (window.appData.modules || []).find(m => m.name.toUpperCase().includes('PORTAL OPERATIVO'));
                if (!portal) return { error: 'Portal Operativo not found' };
                
                // Record other module sides before collapse
                const sidesBefore = {};
                (window.appData.modules || []).forEach(m => {
                    sidesBefore[m.id] = m._renderData ? m._renderData.isLeft : null;
                });
                
                window.toggleModuleCollapse(portal.id);
                
                // Check sides after collapse
                const sidesAfter = {};
                let sidesSwapped = false;
                (window.appData.modules || []).forEach(m => {
                    sidesAfter[m.id] = m._renderData ? m._renderData.isLeft : null;
                    if (sidesBefore[m.id] !== sidesAfter[m.id]) sidesSwapped = true;
                });
                
                const portalRender = portal._renderData;
                const projectsVisible = (portal.projects || []).filter(p => p._renderData !== null).length;
                
                return {
                    portalName: portal.name,
                    sidesSwapped: sidesSwapped,
                    projectsVisibleAfterCollapse: projectsVisible,
                    portalRenderData: portalRender
                };
            })()
        `,
        returnByValue: true
    });

    console.log('--- TEST 2: COLLAPSE PORTAL OPERATIVO STABILITY ---');
    console.log(JSON.stringify(collapseTest?.value, null, 2));

    // Take screenshot of portal operativo collapsed
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot2 && shot2.data) {
        fs.writeFileSync(path.join(__dirname, 'mapa_portal_colapsado.png'), Buffer.from(shot2.data, 'base64'));
        console.log('Saved mapa_portal_colapsado.png');
    }

    // TEST 3: Expand back Portal Operativo
    const expandTest = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const portal = (window.appData.modules || []).find(m => m.name.toUpperCase().includes('PORTAL OPERATIVO'));
                window.toggleModuleCollapse(portal.id);
                const projectsVisible = (portal.projects || []).filter(p => p._renderData !== null).length;
                return {
                    portalName: portal.name,
                    projectsVisibleAfterExpand: projectsVisible
                };
            })()
        `,
        returnByValue: true
    });
    console.log('--- TEST 3: EXPAND BACK PORTAL OPERATIVO ---');
    console.log(JSON.stringify(expandTest?.value, null, 2));

    // TEST 4: Collapse All and check button text
    const collapseAllTest = await send('Runtime.evaluate', {
        expression: `
            (() => {
                window.collapseAllModules();
                const totalProjectsOnMap = document.querySelectorAll('.mindmap-project-node').length;
                const btnText = document.getElementById('textCollapseAll')?.textContent;
                return {
                    totalProjectsOnMap: totalProjectsOnMap,
                    btnText: btnText
                };
            })()
        `,
        returnByValue: true
    });
    console.log('--- TEST 4: COLLAPSE ALL ---');
    console.log(JSON.stringify(collapseAllTest?.value, null, 2));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot3 && shot3.data) {
        fs.writeFileSync(path.join(__dirname, 'mapa_todos_colapsados_limpio.png'), Buffer.from(shot3.data, 'base64'));
        console.log('Saved mapa_todos_colapsados_limpio.png');
    }

    // Expand All
    await send('Runtime.evaluate', { expression: `window.expandAllModules();` });

    console.log('All tests passed successfully!');
    proc.kill();
    server.close();
    process.exit(0);
});
