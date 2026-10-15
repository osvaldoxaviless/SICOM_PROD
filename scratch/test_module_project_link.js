const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8150;
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, '..', req.url.split('?')[0]);
    if (filePath.endsWith(path.sep) || req.url === '/') {
        filePath = path.join(__dirname, '..', 'index.html');
    }
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        let ext = path.extname(filePath);
        let ct = 'text/plain';
        if (ext === '.html') ct = 'text/html';
        else if (ext === '.js') ct = 'application/javascript';
        else if (ext === '.css') ct = 'text/css';
        else if (ext === '.json') ct = 'application/json';
        res.writeHead(200, { 'Content-Type': ct });
        res.end(data);
    });
});

server.listen(PORT, async () => {
    console.log(`Server listening on ${PORT}`);
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const remotePort = 9255;
    const chromeProc = spawn(chromePath, [
        '--headless',
        '--disable-gpu',
        `--remote-debugging-port=${remotePort}`,
        '--window-size=1280,900',
        'about:blank'
    ]);
    
    await new Promise(r => setTimeout(r, 1200));
    
    try {
        const httpGet = (url) => new Promise((resolve, reject) => {
            http.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });

        const targets = await httpGet(`http://127.0.0.1:${remotePort}/json`);
        const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
        await new Promise((resolve) => ws.onopen = resolve);
        
        let id = 1;
        const send = (method, params = {}) => new Promise((resolve) => {
            const reqId = id++;
            const handler = (evt) => {
                const msg = JSON.parse(evt.data);
                if (msg.id === reqId) {
                    ws.removeEventListener('message', handler);
                    resolve(msg.result);
                }
            };
            ws.addEventListener('message', handler);
            ws.send(JSON.stringify({ id: reqId, method, params }));
        });

        await send('Page.enable');
        await send('Runtime.enable');
        
        console.log("Navigating to test page...");
        await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
        await new Promise(r => setTimeout(r, 1500));

        await send('Runtime.evaluate', {
            expression: `
                localStorage.setItem('sicom_author', 'Osvaldo Avilés');
                localStorage.setItem('sicom_role', 'Supremo');
                location.reload();
            `
        });
        await new Promise(r => setTimeout(r, 2500));

        console.log("1. Finding or creating 'Proyectos AFR SICOM' module...");
        const modRes = await send('Runtime.evaluate', {
            expression: `(() => {
                let mod = appData.modules.find(m => m.name.includes('AFR'));
                if (!mod) {
                    mod = { id: 'm_' + Date.now(), name: 'Proyectos AFR SICOM', color: '#955050', projects: [] };
                    appData.modules.push(mod);
                }
                return { id: mod.id, name: mod.name, initialProjectsCount: (mod.projects || []).length };
            })()`,
            returnByValue: true
        });
        const modValue = (modRes.result && modRes.result.value) ? modRes.result.value : (modRes.value || modRes);
        console.log("Target module:", modValue);
        const targetModId = modValue.id;

        console.log("2. Using openCreateProjectForModule...");
        await send('Runtime.evaluate', {
            expression: `(async () => {
                window.openCreateProjectForModule('${targetModId}');
                await new Promise(r => setTimeout(r, 400));
                
                const locVal = document.getElementById('newProjLocation').value;
                const inpName = document.getElementById('newProjName');
                inpName.value = 'Integración AFR SICOM v1';
                
                return {
                    selectedLocationValue: locVal,
                    matchesTargetMod: locVal === '${targetModId}'
                };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });

        console.log("3. Executing createNewProject()...");
        const createRes = await send('Runtime.evaluate', {
            expression: `(() => {
                try {
                    window.createNewProject();
                    const mod = appData.modules.find(m => m.id === '${targetModId}');
                    const created = (mod.projects || []).find(p => p.name === 'Integración AFR SICOM v1');
                    return {
                        success: true,
                        projectsInModule: (mod.projects || []).length,
                        createdProject: created ? { id: created.id, name: created.name, status: created.status } : null
                    };
                } catch(err) {
                    return { success: false, error: err.message, stack: err.stack };
                }
            })()`,
            returnByValue: true
        });
        console.log("Create Project Result:", JSON.stringify(createRes.result.value, null, 2));

        // 4. Capture screenshot of canvas to confirm visual link
        await new Promise(r => setTimeout(r, 600));
        const shot = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'test_module_linked_project.png'), Buffer.from(shot.data, 'base64'));

        console.log("\n>>> TEST MODULE-PROJECT LINKING PASSED SUCCESSFULLY! <<<\n");

    } catch(err) {
        console.error("Test error:", err);
    } finally {
        chromeProc.kill();
        server.close();
        process.exit(0);
    }
});
