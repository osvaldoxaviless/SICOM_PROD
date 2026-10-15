const http = require('http');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const PORT = 8115;
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
    console.log(`Server started on ${PORT}`);
    const chrome = cp.spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new',
        '--remote-debugging-port=9245',
        '--user-data-dir=C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_' + Date.now(),
        `http://127.0.0.1:${PORT}/index.html`
    ]);

    await new Promise(r => setTimeout(r, 2000));
    const list = await (await fetch('http://127.0.0.1:9245/json/list')).json();
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

    // Wait 2s for app to boot
    await new Promise(r => setTimeout(r, 2000));

    // Log in as Supremo
    await send('Runtime.evaluate', {
        expression: `(() => {
            document.getElementById('loginUserSelect').value = 'Osvaldo Avilés';
            window.handleLoginUserChange();
            document.getElementById('loginPasswordInput').value = 'Sicom2026';
            window.attemptLogin();
        })()`
    });
    await new Promise(r => setTimeout(r, 1200));

    // Execute tests
    const testResult = await send('Runtime.evaluate', {
        expression: `(() => {
            try {
                // 1. Verify helper functions exist
                const hasGetComps = typeof window.getProjectCompanies === 'function';
                const hasStyle = typeof window.getCompanyStyle === 'function';
                const hasAllKnown = typeof window.getAllKnownCompanies === 'function';
                const hasPopulateChk = typeof window.populateCompanyChecklist === 'function';

                const sampleStyleAFR = window.getCompanyStyle('AFR');
                const sampleStyleAVM = window.getCompanyStyle('AVM');
                const sampleStyleTEO = window.getCompanyStyle('TEO');

                // 2. Test getProjectCompanies with various shapes
                const testObj1 = { name: 'P1', companies: ['AFR', 'AVM'] };
                const testObj2 = { name: 'P2', company: 'TEO' };
                const testObj3 = { name: 'P3' };

                const comps1 = window.getProjectCompanies(testObj1);
                const comps2 = window.getProjectCompanies(testObj2);
                const comps3 = window.getProjectCompanies(testObj3);

                // 3. Test populateCompanyChecklist rendering
                window.populateCompanyChecklist('newProj', ['AFR', 'TEO']);
                const newProjList = document.getElementById('newProjCompaniesList');
                const renderedChips = newProjList ? Array.from(newProjList.querySelectorAll('label')).map(l => l.textContent.trim()) : [];
                const checkedChips = newProjList ? Array.from(newProjList.querySelectorAll('.newProjComp-chk:checked')).map(cb => cb.value) : [];

                // 4. Test addCustomCompany
                const customInp = document.getElementById('newProjCustomComp');
                if (customInp) {
                    customInp.value = 'CORP_XYZ';
                    window.addCustomCompany('newProj');
                }
                const afterCustomChecked = newProjList ? Array.from(newProjList.querySelectorAll('.newProjComp-chk:checked')).map(cb => cb.value) : [];

                // 5. Test InfoCard companies rendering
                const mockProject = {
                    id: 'p_mock_1',
                    name: 'Proyecto Piloto AFR',
                    status: 'En Progreso',
                    progress: 75,
                    priority: 1,
                    companies: ['AFR', 'AVM'],
                    consultants: ['Emmanuel Sánchez'],
                    tasks: [],
                    notes: []
                };
                if (!window.appData.directProjects) window.appData.directProjects = [];
                window.appData.directProjects.push(mockProject);

                window.showInfoCard('direct-project', mockProject.id);
                const infoCompContainer = document.getElementById('infoCompaniesContainer');
                const isInfoCompHidden = infoCompContainer ? infoCompContainer.classList.contains('hidden') : true;
                const infoBadges = infoCompContainer ? Array.from(infoCompContainer.querySelectorAll('span')).map(s => s.textContent.trim()).filter(Boolean) : [];

                // 6. Test AdvFilters
                window.populateAdvFilters();
                const advSel = document.getElementById('advFilterCompany');
                const advOpts = advSel ? Array.from(advSel.options).map(o => o.value) : [];

                // 7. Test ExportCSV
                let exportedCsv = '';
                const origBlob = window.Blob;
                window.Blob = function(parts, opts) {
                    exportedCsv = parts.join('');
                    return new origBlob(parts, opts);
                };
                const origClick = HTMLAnchorElement.prototype.click;
                HTMLAnchorElement.prototype.click = () => {};
                window.exportCSV();
                window.Blob = origBlob;
                HTMLAnchorElement.prototype.click = origClick;

                const csvHeader = exportedCsv.split('\\n')[0];
                const csvRowMock = exportedCsv.split('\\n').find(r => r.includes('Proyecto Piloto AFR'));

                return {
                    helpers: { hasGetComps, hasStyle, hasAllKnown, hasPopulateChk },
                    sampleStyleAFR,
                    sampleStyleAVM,
                    sampleStyleTEO,
                    normalization: { comps1, comps2, comps3 },
                    formChecklist: { renderedChips, checkedChips, afterCustomChecked },
                    infoCard: { isInfoCompHidden, infoBadges },
                    advFilterOptions: advOpts,
                    csv: { csvHeader, csvRowMock }
                };
            } catch (err) {
                return { error: err.message, stack: err.stack };
            }
        })()`,
        returnByValue: true
    });

    console.log('RESULTS:\n', JSON.stringify(testResult?.result?.value, null, 2));

    // Capture screenshots
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    if (ss1 && ss1.data) {
        const p1 = 'C:\\Users\\osvsa\\.gemini\\antigravity\\brain\\708821d1-6daa-40a8-a63c-e7469c4936c9\\empresa_infocard_badges.png';
        fs.writeFileSync(p1, Buffer.from(ss1.data, 'base64'));
        console.log('Screenshot 1 saved:', p1);
    }

    // Render Mindmap with mock project to capture capsule micro-badge
    await send('Runtime.evaluate', { expression: `window.closeConfigDrawer(); window.closeInfoCardSafe(); window.renderMindMap();` });
    await new Promise(r => setTimeout(r, 600));

    const ssCanvas = await send('Page.captureScreenshot', { format: 'png' });
    if (ssCanvas && ssCanvas.data) {
        const pCanvas = 'C:\\Users\\osvsa\\.gemini\\antigravity\\brain\\708821d1-6daa-40a8-a63c-e7469c4936c9\\empresa_canvas.png';
        fs.writeFileSync(pCanvas, Buffer.from(ssCanvas.data, 'base64'));
        console.log('Screenshot canvas saved:', pCanvas);
    }

    // Open filter drawer and screenshot
    await send('Runtime.evaluate', { expression: `window.openFilterDrawer();` });
    await new Promise(r => setTimeout(r, 600));

    const ssFilter = await send('Page.captureScreenshot', { format: 'png' });
    if (ssFilter && ssFilter.data) {
        const pFilter = 'C:\\Users\\osvsa\\.gemini\\antigravity\\brain\\708821d1-6daa-40a8-a63c-e7469c4936c9\\empresa_filter_drawer.png';
        fs.writeFileSync(pFilter, Buffer.from(ssFilter.data, 'base64'));
        console.log('Screenshot filter saved:', pFilter);
    }

    ws.close();
    chrome.kill();
    server.close();
    process.exit(0);
});
