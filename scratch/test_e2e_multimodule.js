const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8140;
const server = http.createServer((req, res) => {
    const cleanUrl = req.url.split('?')[0].replace(/^\/+/, '');
    const filePath = cleanUrl ? path.join(__dirname, '..', cleanUrl) : path.join(__dirname, '..', 'index.html');
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found: ' + filePath);
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
    console.log(`Test server running at http://localhost:${PORT}`);
    
    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const chromePath = chromePaths.find(p => fs.existsSync(p));
    if (!chromePath) {
        console.error("Chrome not found");
        server.close();
        process.exit(1);
    }
    
    const remotePort = 9240;
    const chromeProc = spawn(chromePath, [
        '--headless',
        '--disable-gpu',
        `--remote-debugging-port=${remotePort}`,
        '--window-size=1400,900',
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
        const pageTarget = targets.find(t => t.type === 'page');
        
        const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
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
        
        console.log("Setting up session as Osvaldo Avilés (Supremo)...");
        await send('Runtime.evaluate', {
            expression: `
                localStorage.setItem('sicom_author', 'Osvaldo Avilés');
                localStorage.setItem('sicom_role', 'Supremo');
                location.reload();
            `
        });
        await new Promise(r => setTimeout(r, 2500));

        console.log("Running Multi-Module Verification in browser context...");
        const testRes = await send('Runtime.evaluate', {
            expression: `(function() {
                try {
                    const results = {};
                    const appData = window.getAppData ? window.getAppData() : null;
                    if (!appData) return { error: "getAppData() not found" };
                    
                    // 1. Verificar existencia de módulos en appData
                    const modules = appData.modules || [];
                    results.totalModules = modules.length;
                    if (modules.length < 2) return { error: "Less than 2 modules found" };

                    const mod1 = modules[0]; // e.g. COM
                    const mod2 = modules[1]; // e.g. CONTROLES VOLUMÉTRICOS

                    // 2. Probar función populateSecondaryModulesChecklist
                    window.populateSecondaryModulesChecklist('newProj', mod1.id, [mod2.id]);
                    const secList = document.getElementById('newProjSecondaryModulesList');
                    results.secListPopulated = !!secList && secList.children.length > 0;

                    // 3. Crear proyecto vinculado a mod1 (principal) y mod2 (secundario)
                    window.populateNewProjectLocationSelect(mod1.id);
                    document.getElementById('newProjName').value = 'Proyecto E2E MultiModulo';
                    document.getElementById('newProjLocation').value = mod1.id;
                    window.populateSecondaryModulesChecklist('newProj', mod1.id, [mod2.id]);
                    
                    // Asegurar checkbox de mod2 marcado
                    const chk = document.querySelector('.newProjSecMod-chk[value="' + mod2.id + '"]');
                    if (chk) chk.checked = true;
                    results.chkFoundAndChecked = !!chk && chk.checked;

                    // Crear el proyecto
                    window.createNewProject();

                    // 4. Buscar proyecto creado
                    const createdProj = (mod1.projects || []).find(p => p.name === 'Proyecto E2E MultiModulo');
                    results.createdFound = !!createdProj;
                    results.createdSecondaryModules = createdProj ? createdProj.secondaryModules : null;

                    // 5. Verificar renderizado en MindMap
                    window.renderMindMap();
                    const secConnectors = document.querySelectorAll('.secondary-module-connector');
                    results.secondaryConnectorsCount = secConnectors.length;

                    // 6. Verificar InfoCard del proyecto
                    window.showInfoCard('project', createdProj.id);
                    const infoModCont = document.getElementById('infoModulesContainer');
                    results.infoModulesVisible = !infoModCont.classList.contains('hidden');
                    results.infoModulesBadgesCount = infoModCont.children.length;

                    // 6.5 Probar Edición del Proyecto y añadir un segundo módulo secundario (mod3)
                    const mod3 = modules[2]; // Tercer módulo
                    window.selectNode('project', createdProj.id);
                    const editSecChk = document.querySelector('.editProjSecMod-chk[value="' + mod3.id + '"]');
                    if (editSecChk) editSecChk.checked = true;
                    window.saveEditChanges();

                    results.afterEditSecondaryModules = createdProj.secondaryModules;
                    window.renderMindMap();
                    const secConnectorsAfterEdit = document.querySelectorAll('.secondary-module-connector');
                    results.secondaryConnectorsAfterEdit = secConnectorsAfterEdit.length;

                    // 7. Verificar filtrado por módulo secundario (mod2)
                    window.activeFilterModule = mod2.id;
                    window.renderMindMap();
                    results.filterMatchesSecondary = document.querySelectorAll('.secondary-module-connector').length > 0;

                    // Reset filter
                    window.activeFilterModule = 'ALL';
                    window.renderMindMap();

                    // Cleanup test project
                    mod1.projects = mod1.projects.filter(p => p.name !== 'Proyecto E2E MultiModulo');
                    window.renderMindMap();

                    return { success: true, results };
                } catch(err) {
                    return { success: false, error: err.message, stack: err.stack };
                }
            })()`,
            returnByValue: true
        });

        console.log("TEST RESULTS:\n", JSON.stringify(testRes.result ? testRes.result.value : testRes, null, 2));

        // Screenshot
        const ss = await send('Page.captureScreenshot', { format: 'png' });
        if (ss && ss.data) {
            fs.writeFileSync(path.join(__dirname, 'test_multimodule_success.png'), Buffer.from(ss.data, 'base64'));
            console.log("📸 Screenshot saved to scratch/test_multimodule_success.png");
        }

    } catch(err) {
        console.error("Test failed with error:", err);
    } finally {
        chromeProc.kill();
        server.close();
        process.exit(0);
    }
});
