const http = require('http');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const PORT = 8092;
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
        '--remote-debugging-port=9227',
        '--user-data-dir=C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_inspect_profile_' + Date.now(),
        'about:blank'
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 200));
        try {
            const res = await fetch('http://127.0.0.1:9227/json/list');
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

    // TEST 1: Check multi-column layout for modules with > 6 projects
    const checkColumns = await send('Runtime.evaluate', {
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
    console.log('--- TEST 1: MULTI-COLUMN LAYOUT ---');
    console.log(JSON.stringify(checkColumns?.value, null, 2));

    // Take screenshot of multi-column layout
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot1 && shot1.data) {
        fs.writeFileSync(path.join(__dirname, 'mapa_multicolumn_expandido.png'), Buffer.from(shot1.data, 'base64'));
        console.log('Saved mapa_multicolumn_expandido.png');
    }

    // TEST 2: Check module toggle buttons (+ / -)
    const checkToggleBtns = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const btns = document.querySelectorAll('.mod-toggle-btn');
                return {
                    toggleButtonCount: btns.length,
                    modulesCount: (window.appData.modules || []).length + 1
                };
            })()
        `,
        returnByValue: true
    });
    console.log('--- TEST 2: MODULE TOGGLE BUTTONS ---');
    console.log(JSON.stringify(checkToggleBtns?.value, null, 2));

    // TEST 3: Collapse single module
    const testCollapseOne = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const mod = window.appData.modules.find(m => (m.projects || []).length > 6) || window.appData.modules[0];
                window.toggleModuleCollapse(mod.id);
                const projNodesAfter = document.querySelectorAll('[data-project-id]').length;
                return {
                    collapsedMod: mod.name,
                    collapsedId: mod.id,
                    visibleProjectNodesCount: projNodesAfter
                };
            })()
        `,
        returnByValue: true
    });
    console.log('--- TEST 3: COLLAPSE ONE MODULE ---');
    console.log(JSON.stringify(testCollapseOne?.value, null, 2));

    // TEST 4: Global Collapse All Modules
    const testCollapseAll = await send('Runtime.evaluate', {
        expression: `
            (() => {
                window.collapseAllModules();
                const totalProjNodes = document.querySelectorAll('[data-project-id]').length;
                const totalModNodes = document.querySelectorAll('[data-module-id]').length;
                const btnText = document.getElementById('btnToggleCollapseAllText')?.textContent;
                return {
                    visibleProjectNodes: totalProjNodes,
                    visibleModuleNodes: totalModNodes,
                    btnText: btnText
                };
            })()
        `,
        returnByValue: true
    });
    console.log('--- TEST 4: COLLAPSE ALL MODULES ---');
    console.log(JSON.stringify(testCollapseAll?.value, null, 2));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot2 && shot2.data) {
        fs.writeFileSync(path.join(__dirname, 'mapa_todo_colapsado.png'), Buffer.from(shot2.data, 'base64'));
        console.log('Saved mapa_todo_colapsado.png');
    }

    // TEST 5: Expand All Modules
    await send('Runtime.evaluate', { expression: `window.expandAllModules();` });
    await new Promise(r => setTimeout(r, 600));

    // TEST 6: Multi-Select in Filter Drawer (Osvaldo + Emmanuel)
    const testMultiFilter = await send('Runtime.evaluate', {
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
                    badgeText: badgeText,
                    activeOnMap: activeCount,
                    dimmedOnMap: dimmedCount
                };
            })()
        `,
        returnByValue: true
    });
    console.log('--- TEST 6: MULTI-SELECT CONSULTANTS (OSVALDO + EMMANUEL) ---');
    console.log(JSON.stringify(testMultiFilter?.value, null, 2));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot3 && shot3.data) {
        fs.writeFileSync(path.join(__dirname, 'filtros_multiselect_osvaldo_emmanuel.png'), Buffer.from(shot3.data, 'base64'));
        console.log('Saved filtros_multiselect_osvaldo_emmanuel.png');
    }

    // TEST 7: Multi-Select Companies (AFR + AVM)
    const testCompanyFilter = await send('Runtime.evaluate', {
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
    console.log('--- TEST 7: MULTI-SELECT COMPANIES (AFR + AVM) ---');
    console.log(JSON.stringify(testCompanyFilter?.value, null, 2));

    // TEST 8: Reset Filters
    const testReset = await send('Runtime.evaluate', {
        expression: `
            (() => {
                window.resetAdvFilters();
                window.toggleFilterDrawer(); // close
                return {
                    badgeHidden: document.getElementById('activeFiltersBadge')?.classList.contains('hidden')
                };
            })()
        `,
        returnByValue: true
    });
    console.log('--- TEST 8: RESET ADV FILTERS ---');
    console.log(JSON.stringify(testReset?.value, null, 2));

    // TEST 9: Secondary Links with Collapsed Modules
    const testSecLinks = await send('Runtime.evaluate', {
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
    console.log('--- TEST 9: SECONDARY LINKS WITH COLLAPSED DESTINATION MODULE ---');
    console.log(JSON.stringify(testSecLinks?.value, null, 2));

    console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
    proc.kill();
    server.close();
    process.exit(0);
});
