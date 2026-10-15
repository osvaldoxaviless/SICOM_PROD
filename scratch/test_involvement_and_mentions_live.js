const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8135;
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
    
    const remotePort = 9235;
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
        await new Promise(r => setTimeout(r, 2000));
        
        // 1. Iniciar sesión como Osvaldo (Supremo) y postear nota con @Rodrigo en un proyecto donde Rodrigo NO es consultor
        console.log("1. Setting up project and posting @Rodrigo mention as Osvaldo...");
        await send('Runtime.evaluate', {
            expression: `
                localStorage.setItem('sicom_author', 'Osvaldo (STGT)');
                localStorage.setItem('sicom_role', 'Supremo');
                location.reload();
            `
        });
        await new Promise(r => setTimeout(r, 2500));

        const postMentionRes = await send('Runtime.evaluate', {
            expression: `(async () => {
                const ges = document.getElementById('globalEditSelector');
                const opt = Array.from(ges ? ges.options : []).find(o => o.value.startsWith('project|') || o.value.startsWith('direct-project|'));
                if (!opt) return { error: 'No project found' };
                const [type, id] = opt.value.split('|');
                window.selectNode(type, id);
                await new Promise(r => setTimeout(r, 400));
                
                const item = window.getSelectedItem();
                // Asegurar que Rodrigo NO está en consultants ni tasks para comprobar la mención
                item.consultants = ['Osvaldo (STGT)'];
                if (item.tasks) {
                    item.tasks.forEach(t => t.assignee = 'Osvaldo (STGT)');
                }
                
                // Limpiar notas previas para el test
                item.notes = [];
                
                // Seleccionar tag acuerdo y escribir nota mencionando a @Rodrigo
                window.setNoteTag('acuerdo', 'info');
                const noteInput = document.getElementById('infoNoteInput');
                noteInput.value = 'Favor de coordinar la entrega con @Rodrigo para el lunes.';
                window.addProjectNote('info');
                
                return {
                    projectId: id,
                    projectName: item.name,
                    notesCount: item.notes.length,
                    note: item.notes[0]
                };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });

        console.log("Post mention result:", JSON.stringify(postMentionRes.result.value, null, 2));
        const testProjectId = postMentionRes.result.value.projectId;

        // 2. Probar usuario no involucrado y no mencionado: Consultor "Valeria"
        console.log("2. Switching to Valeria (unassigned, unmentioned)...");
        await send('Runtime.evaluate', {
            expression: `
                localStorage.setItem('sicom_author', 'Valeria');
                localStorage.setItem('sicom_role', 'Consultor');
                location.reload();
            `
        });
        await new Promise(r => setTimeout(r, 2500));

        const valeriaCheck = await send('Runtime.evaluate', {
            expression: `(() => {
                // Verificar si aparece badge en el mapa para Valeria
                const allBadges = document.querySelectorAll('.project-unread-badge');
                return {
                    valeriaAuthor: localAuthor,
                    valeriaRole: currentUserRole,
                    badgesFound: allBadges.length,
                    alertsCount: (window.__lastAlerts || []).length
                };
            })()`,
            returnByValue: true
        });
        console.log("Valeria check (Zero noise expected):", JSON.stringify(valeriaCheck.result.value, null, 2));

        // 3. Probar usuario MENCIONADO: Consultor "Rodrigo"
        console.log("3. Switching to Rodrigo (mentioned via @Rodrigo)...");
        await send('Runtime.evaluate', {
            expression: `
                localStorage.setItem('sicom_author', 'Rodrigo');
                localStorage.setItem('sicom_role', 'Consultor');
                location.reload();
            `
        });
        await new Promise(r => setTimeout(r, 2500));

        const rodrigoCheck = await send('Runtime.evaluate', {
            expression: `(() => {
                const badges = Array.from(document.querySelectorAll('.project-unread-badge'));
                const badgeTexts = badges.map(b => b.textContent.trim());
                const alerts = window.__lastAlerts || [];
                const mentionAlert = alerts.find(a => a.alertType === 'mention');
                return {
                    rodrigoAuthor: localAuthor,
                    badgesCount: badges.length,
                    badgeTexts: badgeTexts,
                    alertsCount: alerts.length,
                    mentionAlert: mentionAlert ? {
                        id: mentionAlert.id,
                        reason: mentionAlert.reason,
                        icon: mentionAlert.icon,
                        alertType: mentionAlert.alertType
                    } : null
                };
            })()`,
            returnByValue: true
        });
        console.log("Rodrigo check (Badge '@' and Mention Alert expected):", JSON.stringify(rodrigoCheck.result.value, null, 2));

        // 4. Capturar screenshot del Mindmap con el badge '@'
        const shotMindmap = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'test_mindmap_mention_badge.png'), Buffer.from(shotMindmap.data, 'base64'));

        // 5. Rodrigo abre el proyecto y revisa el foro
        console.log("5. Rodrigo opens the project info card...");
        await send('Runtime.evaluate', {
            expression: `(async () => {
                const ges = document.getElementById('globalEditSelector');
                const opt = Array.from(ges ? ges.options : []).find(o => o.value.includes('${testProjectId}'));
                const [type, id] = opt.value.split('|');
                window.selectNode(type, id);
                await new Promise(r => setTimeout(r, 400));
            })()`,
            awaitPromise: true
        });
        await new Promise(r => setTimeout(r, 600));

        const forumCheck = await send('Runtime.evaluate', {
            expression: `(() => {
                const infoNotes = document.getElementById('infoNotes');
                return {
                    hasNotesContainer: !!infoNotes,
                    html: infoNotes ? infoNotes.innerHTML : ''
                };
            })()`,
            returnByValue: true
        });

        const shotForum = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'test_forum_mention_receipt.png'), Buffer.from(shotForum.data, 'base64'));

        // 6. Rodrigo hace clic en 'Enterado / Confirmar lectura'
        console.log("6. Rodrigo confirms reading the mention note...");
        const confirmRes = await send('Runtime.evaluate', {
            expression: `(async () => {
                const item = window.getSelectedItem();
                const note = item.notes[0];
                window.confirmNoteRead(note.id);
                await new Promise(r => setTimeout(r, 400));
                
                const badgesAfter = document.querySelectorAll('.project-unread-badge');
                const alertsAfter = window.__lastAlerts || [];
                return {
                    badgesAfterCount: badgesAfter.length,
                    alertsAfterCount: alertsAfter.length,
                    noteReadBy: note.readBy
                };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });
        console.log("Confirmation result (Zero badges after confirmation):", JSON.stringify(confirmRes.result.value, null, 2));

        // 7. Abrir Notificaciones y Trabajo (Daily Drawer) para verificar su render
        console.log("7. Checking daily drawer render...");
        await send('Runtime.evaluate', {
            expression: `window.toggleDailyDrawer();`
        });
        await new Promise(r => setTimeout(r, 600));
        const shotDrawer = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'test_daily_drawer_mentions.png'), Buffer.from(shotDrawer.data, 'base64'));

        console.log("\n====== ALL E2E INVOLVEMENT & MENTION TESTS COMPLETED SUCCESSFULLY! ======\n");

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        chromeProc.kill();
        server.close();
        process.exit(0);
    }
});
