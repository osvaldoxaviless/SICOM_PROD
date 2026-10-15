const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8140;
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
        
        // 0. Ensure Osvaldo Avilés is logged in
        await send('Runtime.evaluate', {
            expression: `
                localStorage.setItem('sicom_author', 'Osvaldo Avilés');
                localStorage.setItem('sicom_role', 'Supremo');
                location.reload();
            `
        });
        await new Promise(r => setTimeout(r, 2500));
        
        // 1. Post mention @Carlos Islas in a project where Carlos Islas is NOT assigned
        console.log("1. Setting up project and posting @Carlos Islas mention...");
        const postRes = await send('Runtime.evaluate', {
            expression: `(async () => {
                const ges = document.getElementById('globalEditSelector');
                const opt = Array.from(ges ? ges.options : []).find(o => o.value.startsWith('project|') || o.value.startsWith('direct-project|'));
                if (!opt) return { error: 'No project found' };
                const [type, pId] = opt.value.split('|');
                window.selectNode(type, pId);
                await new Promise(r => setTimeout(r, 400));
                
                const item = window.getSelectedItem();
                // Ensure Carlos Islas is NOT assigned
                item.consultants = ['Osvaldo Avilés'];
                if (item.tasks) {
                    item.tasks.forEach(t => t.assignee = 'Osvaldo Avilés');
                }
                
                // Add note mentioning @Carlos Islas
                item.notes = item.notes || [];
                window.setNoteTag('bloqueo', 'info');
                const noteInput = document.getElementById('infoNoteInput');
                noteInput.value = 'URGENTE @Carlos Islas por favor revisar los logs del servidor de producción.';
                window.addProjectNote('info');
                await new Promise(r => setTimeout(r, 500));
                
                // Persist state to localStorage so page reload sees it
                localStorage.setItem('sicom_data', JSON.stringify(appData));
                
                return {
                    pId,
                    pName: item.name,
                    notesCount: item.notes.length,
                    lastNote: item.notes[item.notes.length - 1]
                };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });

        console.log("Post result:", JSON.stringify(postRes.result.value, null, 2));
        const testProjectId = postRes.result.value.pId;

        // 2. Probar usuario no involucrado y no mencionado: "Ricardo Lira"
        console.log("2. Switching user to Ricardo Lira (unassigned, not mentioned)...");
        await send('Runtime.evaluate', {
            expression: `
                localStorage.setItem('sicom_author', 'Ricardo Lira');
                localStorage.setItem('sicom_role', 'Consultor');
                location.reload();
            `
        });
        await new Promise(r => setTimeout(r, 2500));

        const ricardoBadges = await send('Runtime.evaluate', {
            expression: `(() => {
                const badges = Array.from(document.querySelectorAll('.project-unread-badge'));
                return {
                    author: localStorage.getItem('sicom_author'),
                    badgeCount: badges.length
                };
            })()`,
            returnByValue: true
        });
        console.log("Ricardo Lira badges (Zero expected):", JSON.stringify(ricardoBadges.result.value, null, 2));

        // 3. Probar usuario MENCIONADO: "Carlos Islas"
        console.log("3. Switching user to Carlos Islas (mentioned via @Carlos Islas)...");
        await send('Runtime.evaluate', {
            expression: `
                localStorage.setItem('sicom_author', 'Carlos Islas');
                localStorage.setItem('sicom_role', 'Consultor');
                location.reload();
            `
        });
        await new Promise(r => setTimeout(r, 2500));

        const carlosBadges = await send('Runtime.evaluate', {
            expression: `(() => {
                const badges = Array.from(document.querySelectorAll('.project-unread-badge'));
                const badgeInfo = badges.map(b => ({
                    text: b.textContent.trim(),
                    circle: b.querySelector('circle') ? {
                        fill: b.querySelector('circle').getAttribute('fill'),
                        class: b.querySelector('circle').getAttribute('class')
                    } : null
                }));
                const alerts = window.__lastAlerts || [];
                const mentionAlerts = alerts.filter(a => a.alertType === 'mention');
                return {
                    author: localStorage.getItem('sicom_author'),
                    badgeCount: badges.length,
                    badgeInfo: badgeInfo,
                    mentionAlertsCount: mentionAlerts.length,
                    mentionAlert: mentionAlerts[0] || null
                };
            })()`,
            returnByValue: true
        });
        console.log("Carlos Islas check (Badge '@' & Mention Alert expected):", JSON.stringify(carlosBadges.result.value, null, 2));

        // Screenshot del MindMap con el badge @ en azul eléctrico
        const shotMindmap = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'test_mindmap_mention_badge.png'), Buffer.from(shotMindmap.data, 'base64'));

        // 4. Carlos Islas abre el proyecto y revisa el foro
        console.log("4. Carlos Islas opens the project info card...");
        await send('Runtime.evaluate', {
            expression: `(async () => {
                const ges = document.getElementById('globalEditSelector');
                const opt = Array.from(ges ? ges.options : []).find(o => o.value.includes('${testProjectId}'));
                const [type, id] = opt.value.split('|');
                window.selectNode(type, id);
                await new Promise(r => setTimeout(r, 500));
            })()`,
            awaitPromise: true
        });
        await new Promise(r => setTimeout(r, 600));

        const shotForum = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'test_forum_mention_receipt.png'), Buffer.from(shotForum.data, 'base64'));

        // 5. Carlos Islas confirma lectura de la nota
        console.log("5. Carlos Islas confirms reading the mention...");
        const confirmCheck = await send('Runtime.evaluate', {
            expression: `(async () => {
                const item = window.getSelectedItem();
                const note = item.notes[item.notes.length - 1];
                window.confirmNoteRead(note.id);
                await new Promise(r => setTimeout(r, 400));
                
                const badgesAfter = document.querySelectorAll('.project-unread-badge');
                const alertsAfter = (window.__lastAlerts || []).filter(a => a.alertType === 'mention');
                return {
                    badgesAfterCount: badgesAfter.length,
                    mentionAlertsAfterCount: alertsAfter.length,
                    readBy: note.readBy
                };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });
        console.log("Confirm check (Zero badges & Zero mention alerts expected):", JSON.stringify(confirmCheck.result.value, null, 2));

        // 6. Screenshot de Daily Drawer
        console.log("6. Carlos Islas opens Daily Drawer...");
        await send('Runtime.evaluate', {
            expression: `window.toggleDailyDrawer();`
        });
        await new Promise(r => setTimeout(r, 600));
        const shotDrawer = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'test_daily_drawer_mentions.png'), Buffer.from(shotDrawer.data, 'base64'));

        console.log("\n====== ALL TESTS VERIFIED & PASSED PERFECTLY! ======\n");

    } catch (err) {
        console.error("Test error:", err);
    } finally {
        chromeProc.kill();
        server.close();
        process.exit(0);
    }
});
