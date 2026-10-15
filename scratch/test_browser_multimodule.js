const http = require('http');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const PORT = 8089;
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
        '--remote-debugging-port=9224',
        '--user-data-dir=C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_inspect_profile_' + Date.now(),
        'about:blank'
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 200));
        try {
            const res = await fetch('http://127.0.0.1:9224/json/list');
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
        return;
    }

    console.log('Connected to Chrome CDP WebSocket');
    const ws = new WebSocket(wsUrl);

    ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
            const text = msg.params.args.map(a => a.value !== undefined ? a.value : (a.description || JSON.stringify(a))).join(' ');
            console.log(`[BROWSER LOG]: ${text}`);
        } else if (msg.method === 'Runtime.exceptionThrown') {
            console.error('[BROWSER EXCEPTION]:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description || '', msg.params.exceptionDetails.stackTrace);
        }
    });

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

    ws.onopen = async () => {
        await send('Runtime.enable');
        await send('Page.enable');

        console.log(`Navigating to http://127.0.0.1:${PORT}/index.html ...`);
        await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });

        // Wait for page and scripts to run
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 500));
            const checkFn = await send('Runtime.evaluate', {
                expression: 'typeof window.populateNewProjectLocationSelect'
            });
            if (checkFn && checkFn.result && checkFn.result.value === 'function') {
                console.log('window.populateNewProjectLocationSelect is ready!');
                break;
            }
        }

        // Evaluate login and multi-module functionality
        const evalRes = await send('Runtime.evaluate', {
            expression: `(function() {
                try {
                    // Simular autor
                    localStorage.setItem('sicom_author', 'Erick');
                    if (typeof window.switchUser === 'function') {
                        window.switchUser('Erick');
                    }

                    // Test population of new project location & secondary modules
                    window.populateNewProjectLocationSelect();
                    const newLoc = document.getElementById('newProjLocation');
                    const secList = document.getElementById('newProjSecondaryModulesList');
                    
                    const modulesCount = (window.appData && window.appData.modules) ? window.appData.modules.length : 0;
                    const secCheckboxes = document.querySelectorAll('.newProjSecMod-chk');

                    // Create test project linked to first module + direct hub as secondary
                    const firstModId = window.appData.modules[0] ? window.appData.modules[0].id : 'DIRECT';
                    const targetSecModId = window.appData.modules[1] ? window.appData.modules[1].id : 'DIRECT';
                    
                    document.getElementById('newProjName').value = 'PROYECTO MULTIMODULO TEST';
                    newLoc.value = firstModId;
                    window.populateSecondaryModulesChecklist('newProj', firstModId, [targetSecModId]);
                    
                    // Mark targetSecModId checkbox as checked
                    const chk = document.querySelector('.newProjSecMod-chk[value="' + targetSecModId + '"]');
                    if (chk) chk.checked = true;

                    // Execute project creation
                    window.createNewProject();

                    // Find created project
                    const created = (window.appData.modules[0]?.projects || []).find(p => p.name === 'PROYECTO MULTIMODULO TEST') ||
                                    (window.appData.directProjects || []).find(p => p.name === 'PROYECTO MULTIMODULO TEST');

                    // Check secondary connector paths in DOM
                    const secConnectors = document.querySelectorAll('.secondary-module-connector');

                    return {
                        success: true,
                        modulesCount,
                        secCheckboxesCount: secCheckboxes.length,
                        createdFound: !!created,
                        createdSecMods: created ? created.secondaryModules : null,
                        secConnectorsCount: secConnectors.length
                    };
                } catch(err) {
                    return { success: false, error: err.message, stack: err.stack };
                }
            })()`,
            returnByValue: true
        });

        console.log("Evaluation Result:", JSON.stringify(evalRes.result ? evalRes.result.value : evalRes, null, 2));

        // Take a screenshot of the canvas
        const ss = await send('Page.captureScreenshot', { format: 'png' });
        if (ss && ss.data) {
            fs.writeFileSync(path.join(__dirname, 'test_multimodule_canvas.png'), Buffer.from(ss.data, 'base64'));
            console.log("Saved screenshot to scratch/test_multimodule_canvas.png");
        }

        // Cleanup test project
        await send('Runtime.evaluate', {
            expression: `(function() {
                if (window.appData && window.appData.modules) {
                    window.appData.modules.forEach(m => {
                        m.projects = (m.projects || []).filter(p => p.name !== 'PROYECTO MULTIMODULO TEST');
                    });
                }
                if (window.appData && window.appData.directProjects) {
                    window.appData.directProjects = window.appData.directProjects.filter(p => p.name !== 'PROYECTO MULTIMODULO TEST');
                }
                window.renderMindMap();
            })()`
        });

        proc.kill();
        server.close();
        process.exit(0);
    };
});
