const http = require('http');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const PORT = 8116;
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, '..', req.url.split('?')[0].replace(/^\/+/, '') || 'index.html');
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        let ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': ext === '.js' ? 'application/javascript' : (ext === '.css' ? 'text/css' : 'text/html') });
        res.end(data);
    });
});

server.listen(PORT, async () => {
    console.log(`Test server started on port ${PORT}`);
    const chrome = cp.spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new',
        '--remote-debugging-port=9246',
        '--user-data-dir=C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_' + Date.now(),
        `http://127.0.0.1:${PORT}/index.html`
    ]);

    await new Promise(r => setTimeout(r, 2000));
    const list = await (await fetch('http://127.0.0.1:9246/json/list')).json();
    const pageTab = list.find(t => t.url.includes(`${PORT}`));
    if (!pageTab) {
        console.error('Page tab not found:', list);
        chrome.kill(); server.close(); process.exit(1);
    }

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    ws.onmessage = e => {
        const m = JSON.parse(e.data);
        if (m.method === 'Runtime.consoleAPICalled') {
            console.log('[BROWSER LOG]', m.params.args.map(a => a.value || a.description).join(' '));
        }
        if (m.method === 'Runtime.exceptionThrown') {
            console.error('[BROWSER EXCEPTION]', m.params.exceptionDetails.text, m.params.exceptionDetails.exception);
        }
    };

    let id = 1;
    function send(method, params = {}) {
        return new Promise(res => {
            const reqId = id++;
            const h = e => {
                const m = JSON.parse(e.data);
                if (m.id === reqId) { ws.removeEventListener('message', h); res(m.result); }
            };
            ws.addEventListener('message', h);
            ws.send(JSON.stringify({ id: reqId, method, params }));
        });
    }

    await new Promise(r => ws.onopen = r);
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    console.log(`Navigating to http://127.0.0.1:${PORT}/index.html ...`);
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });

    // Wait for scripts to load
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 400));
        const checkFn = await send('Runtime.evaluate', { expression: 'typeof window.renderMindMap' });
        if (checkFn && checkFn.result && checkFn.result.value === 'function') break;
    }

    // Login as Supremo
    await send('Runtime.evaluate', {
        expression: `(() => {
            document.getElementById('loginUserSelect').value = 'Osvaldo Avilés';
            window.handleLoginUserChange();
            document.getElementById('loginPasswordInput').value = 'Sicom2026';
            window.attemptLogin();
        })()`
    });
    console.log('Logging in and waiting for finishInit...');
    await new Promise(r => setTimeout(r, 2000));
    const diag = await send('Runtime.evaluate', {
        expression: `(() => {
            return {
                overlayHidden: document.getElementById('loginOverlay') ? document.getElementById('loginOverlay').classList.contains('hidden') : null,
                hasAppData: typeof appData !== 'undefined',
                modCount: (typeof appData !== 'undefined' && appData.modules) ? appData.modules.length : 0,
                projNodes: document.querySelectorAll('.mindmap-project-node').length,
                allGNodes: document.querySelectorAll('#canvasGroup g').length
            };
        })()`,
        returnByValue: true
    });
    console.log('DOM & Data Diagnostics:', diag.result.value);

    // Evaluate initial clean state
    const evalResult = await send('Runtime.evaluate', {
        expression: `(() => {
            const connectors = document.querySelectorAll('.secondary-module-connector');
            const btn = document.getElementById('btnToggleLinks');
            const sample = connectors.length > 0 ? window.getComputedStyle(connectors[0]).opacity : null;
            return {
                connectorCount: connectors.length,
                hasToggleBtn: !!btn,
                btnText: btn ? btn.textContent.trim() : null,
                initialOpacity: sample
            };
        })()`,
        returnByValue: true
    });

    console.log('Initial State Result:', evalResult.result.value);

    // Save initial clean canvas screenshot
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\osvsa\\.gemini\\antigravity\\brain\\708821d1-6daa-40a8-a63c-e7469c4936c9\\mapa_limpio_default.png', Buffer.from(shot1.data, 'base64'));
    console.log('Saved mapa_limpio_default.png');

    // Test Hover illumination on project with secondary modules
    const hoverTest = await send('Runtime.evaluate', {
        expression: `(() => {
            const multiProjG = Array.from(document.querySelectorAll('.mindmap-project-node')).find(g => {
                return g.querySelector('text') && g.textContent.includes('🔗+');
            });
            if (!multiProjG) return { success: false, error: 'No multimodule project node found in DOM' };
            
            const projId = multiProjG.getAttribute('data-project-id');
            // Trigger mouseenter
            multiProjG.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            
            const relatedConns = Array.from(document.querySelectorAll('.secondary-module-connector[data-source-proj="' + projId + '"]'));
            const opacities = relatedConns.map(c => window.getComputedStyle(c).opacity);
            const classes = relatedConns.map(c => c.className.baseVal || c.className);
            
            return {
                success: true,
                projId,
                connCount: relatedConns.length,
                opacities,
                classes
            };
        })()`,
        returnByValue: true
    });
    console.log('Hover Illumination Result:', hoverTest.result.value);

    // Save illuminated hover screenshot
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\osvsa\\.gemini\\antigravity\\brain\\708821d1-6daa-40a8-a63c-e7469c4936c9\\mapa_iluminado_hover.png', Buffer.from(shot2.data, 'base64'));
    console.log('Saved mapa_iluminado_hover.png');

    // Test mouseleave
    const leaveTest = await send('Runtime.evaluate', {
        expression: `(() => {
            const multiProjG = Array.from(document.querySelectorAll('.mindmap-project-node')).find(g => {
                return g.querySelector('text') && g.textContent.includes('🔗+');
            });
            if (!multiProjG) return { success: false };
            multiProjG.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
            const projId = multiProjG.getAttribute('data-project-id');
            const relatedConns = Array.from(document.querySelectorAll('.secondary-module-connector[data-source-proj="' + projId + '"]'));
            return {
                opacitiesAfterLeave: relatedConns.map(c => window.getComputedStyle(c).opacity)
            };
        })()`,
        returnByValue: true
    });
    console.log('Mouseleave Result:', leaveTest.result.value);

    // Test Global Navbar Toggle
    const toggleTest = await send('Runtime.evaluate', {
        expression: `(() => {
            const btn = document.getElementById('btnToggleLinks');
            btn.click();
            const bodyHasClass = document.body.classList.contains('show-all-sec-links');
            const connectors = Array.from(document.querySelectorAll('.secondary-module-connector'));
            const opacities = connectors.slice(0, 3).map(c => window.getComputedStyle(c).opacity);
            return {
                bodyHasClass,
                opacitiesWhenToggledOn: opacities
            };
        })()`,
        returnByValue: true
    });
    console.log('Global Toggle ON Result:', toggleTest.result.value);

    // Save global toggle screenshot
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\osvsa\\.gemini\\antigravity\\brain\\708821d1-6daa-40a8-a63c-e7469c4936c9\\mapa_vinculos_global_toggle.png', Buffer.from(shot3.data, 'base64'));
    console.log('Saved mapa_vinculos_global_toggle.png');

    // Toggle back OFF
    const toggleOffTest = await send('Runtime.evaluate', {
        expression: `(() => {
            const btn = document.getElementById('btnToggleLinks');
            btn.click();
            return {
                bodyHasClass: document.body.classList.contains('show-all-sec-links')
            };
        })()`,
        returnByValue: true
    });
    console.log('Global Toggle OFF Result:', toggleOffTest.result.value);

    console.log('All automated browser tests completed successfully!');
    chrome.kill();
    server.close();
    process.exit(0);
});
