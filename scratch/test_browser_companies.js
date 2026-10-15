const http = require('http');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const PORT = 8097;
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

    ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
            const text = msg.params.args.map(a => a.value !== undefined ? a.value : (a.description || JSON.stringify(a))).join(' ');
            console.log(`[BROWSER LOG]: ${text}`);
        } else if (msg.method === 'Runtime.exceptionThrown') {
            console.error('[BROWSER EXCEPTION]:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description || '', msg.params.exceptionDetails.stackTrace);
        }
    });

    ws.onopen = async () => {
        await send('Runtime.enable');
        await send('Page.enable');
        await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

        console.log(`Navigating to http://127.0.0.1:${PORT}/index.html ...`);
        await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });

        // Wait for login screen to be ready
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 400));
            const checkFn = await send('Runtime.evaluate', {
                expression: 'typeof window.attemptLogin'
            });
            if (checkFn && checkFn.result && checkFn.result.value === 'function') {
                console.log('window.attemptLogin is ready!');
                break;
            }
        }

        // Login as Supremo
        await send('Runtime.evaluate', {
            expression: `(() => {
                document.getElementById('loginUserSelect').value = 'Emmanuel Sánchez';
                window.handleLoginUserChange();
                document.getElementById('loginPasswordInput').value = 'Sicom2026';
                window.attemptLogin();
            })()`
        });
        await new Promise(r => setTimeout(r, 800));

        // Run full end-to-end evaluation
        const evalRes = await send('Runtime.evaluate', {
            expression: `(function() {
                try {

                    // 1. Create project with company AFR and AVM
                    window.populateNewProjectLocationSelect();
                    window.populateCompanyChecklist('newProj', []);
                    
                    // Mark AFR and AVM
                    const chks = document.querySelectorAll('.newProjComp-chk');
                    chks.forEach(cb => {
                        if (cb.value === 'AFR' || cb.value === 'AVM') cb.checked = true;
                    });
                    
                    // Also test adding custom company "PROD_EXT"
                    const customInp = document.getElementById('newProjCustomComp');
                    if (customInp) {
                        customInp.value = 'PROD_EXT';
                        window.addCustomCompany('newProj');
                    }

                    document.getElementById('newProjName').value = 'PROYECTO MULTI-EMPRESA TEST';
                    document.getElementById('newProjLocation').value = 'DIRECT';
                    
                    window.createNewProject();

                    // Find created project
                    const createdP = (appData.directProjects || []).find(p => p.name === 'PROYECTO MULTI-EMPRESA TEST');
                    if (!createdP) return { error: 'Project not created' };

                    // 2. Open info card for this project
                    window.showInfoCard('direct-project', createdP.id);
                    const compContainer = document.getElementById('infoCompaniesContainer');
                    const badges = compContainer ? Array.from(compContainer.querySelectorAll('span')).map(s => s.textContent.trim()) : [];
                    const isCompContainerHidden = compContainer ? compContainer.classList.contains('hidden') : true;

                    // 3. Open edit drawer for this project
                    window.selectNodeAndOpenConfig('direct-project', createdP.id);
                    const editList = document.getElementById('editProjCompaniesList');
                    const editChecked = editList ? Array.from(editList.querySelectorAll('.editProjComp-chk:checked')).map(cb => cb.value) : [];

                    // 4. Test advanced filter by company
                    window.populateAdvFilters();
                    const advSel = document.getElementById('advFilterCompany');
                    const filterOptions = advSel ? Array.from(advSel.options).map(o => o.value) : [];

                    // 5. Test exportCSV
                    let exportedCsv = '';
                    const origCreate = URL.createObjectURL;
                    URL.createObjectURL = () => 'blob:mock';
                    const origBlob = window.Blob;
                    window.Blob = function(parts, opts) {
                        exportedCsv = parts.join('');
                        return new origBlob(parts, opts);
                    };
                    const origClick = HTMLAnchorElement.prototype.click;
                    HTMLAnchorElement.prototype.click = function() {};
                    window.exportCSV();
                    window.Blob = origBlob;
                    URL.createObjectURL = origCreate;
                    HTMLAnchorElement.prototype.click = origClick;

                    const csvHeader = exportedCsv.split('\\n')[0];
                    const csvRow = exportedCsv.split('\\n').find(r => r.includes('PROYECTO MULTI-EMPRESA TEST'));

                    return {
                        success: true,
                        createdP_companies: createdP.companies,
                        infoCardBadges: badges,
                        isCompContainerHidden,
                        editChecked,
                        filterOptions,
                        csvHeader,
                        csvRow
                    };
                } catch (e) {
                    return { error: e.message, stack: e.stack };
                }
            })()`,
            returnByValue: true
        });

        console.log('Evaluation result:', JSON.stringify(evalRes?.result?.value, null, 2));

        // Take screenshot of InfoCard with company badges
        await send('Runtime.evaluate', { expression: `window.closeConfigDrawer(); window.showInfoCard('direct-project', appData.directProjects.find(p => p.name === 'PROYECTO MULTI-EMPRESA TEST').id);` });
        await new Promise(r => setTimeout(r, 600));

        const ss1 = await send('Page.captureScreenshot', { format: 'png' });
        if (ss1 && ss1.data) {
            const artifactPath1 = 'C:\\Users\\osvsa\\.gemini\\antigravity\\brain\\708821d1-6daa-40a8-a63c-e7469c4936c9\\empresa_infocard_badges.png';
            fs.writeFileSync(artifactPath1, Buffer.from(ss1.data, 'base64'));
            console.log('Saved artifact 1: empresa_infocard_badges.png');
        }

        // Take screenshot of canvas
        const ss2 = await send('Page.captureScreenshot', { format: 'png' });
        if (ss2 && ss2.data) {
            const artifactPath2 = 'C:\\Users\\osvsa\\.gemini\\antigravity\\brain\\708821d1-6daa-40a8-a63c-e7469c4936c9\\empresa_canvas.png';
            fs.writeFileSync(artifactPath2, Buffer.from(ss2.data, 'base64'));
            console.log('Saved artifact 2: empresa_canvas.png');
        }

        console.log('Test completed successfully!');
        ws.close();
        proc.kill();
        server.close();
        process.exit(0);
    };
});
