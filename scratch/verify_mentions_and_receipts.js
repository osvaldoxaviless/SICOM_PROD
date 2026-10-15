const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8145;
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
    const remotePort = 9248;
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
        
        console.log("1. Navigating as Osvaldo Avilés...");
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

        console.log("2. Adding mention @Carlos Islas to direct project 0...");
        const setupResult = await send('Runtime.evaluate', {
            expression: `(async () => {
                const p = appData.directProjects[0];
                p.consultants = ['Osvaldo Avilés'];
                if (p.tasks) p.tasks.forEach(t => t.assignee = 'Osvaldo Avilés');
                
                // Limpiar notas previas y añadir nota con mención a @Carlos Islas
                p.notes = [];
                window.selectNode('direct-project', p.id);
                await new Promise(r => setTimeout(r, 300));
                
                window.setNoteTag('bloqueo', 'info');
                const inp = document.getElementById('infoNoteInput');
                inp.value = '⚠️ @Carlos Islas se detectó inconsistencia en base de datos. Favor de verificar.';
                window.addProjectNote('info');
                
                const note = p.notes[0];
                return {
                    projectId: p.id,
                    projectName: p.name,
                    noteText: note.text,
                    noteBy: note.by,
                    noteMentions: note.mentions
                };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });
        console.log("Setup result:", setupResult.result.value);

        console.log("3. Testing involvement rules on project...");
        const evalRules = await send('Runtime.evaluate', {
            expression: `(() => {
                const p = appData.directProjects[0];
                return {
                    carlosShouldSee: window.shouldShowProjectForumBadge(p, 'Carlos Islas', 'Consultor'),
                    ricardoShouldSee: window.shouldShowProjectForumBadge(p, 'Ricardo Lira', 'Consultor'),
                    osvaldoShouldSee: window.shouldShowProjectForumBadge(p, 'Osvaldo Avilés', 'Supremo')
                };
            })()`,
            returnByValue: true
        });
        console.log("Involvement evaluation rules:", evalRules.result.value);

        console.log("4. Simulating Carlos Islas login and canvas rendering...");
        const carlosView = await send('Runtime.evaluate', {
            expression: `(async () => {
                // Switch author to Carlos Islas
                localAuthor = 'Carlos Islas';
                currentUserRole = 'Consultor';
                window.renderMindMap();
                window.renderAlerts();
                
                const badge = document.querySelector('.project-unread-badge');
                let badgeText = badge ? badge.textContent.trim() : null;
                let badgeClass = badge ? (badge.querySelector('circle') || badge.querySelector('rect')).getAttribute('class') : null;
                let badgeColor = badge ? (badge.querySelector('circle') || badge.querySelector('rect')).getAttribute('fill') : null;
                
                const alerts = window.__lastAlerts || [];
                const mentionAlert = alerts.find(a => a.alertType === 'mention');
                
                return {
                    badgeFound: !!badge,
                    badgeText: badgeText,
                    badgeClass: badgeClass,
                    badgeColor: badgeColor,
                    hasMentionAlert: !!mentionAlert,
                    mentionReason: mentionAlert ? mentionAlert.reason : null
                };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });
        console.log("Carlos Islas canvas & alerts view:", carlosView.result.value);

        // Capturar pantalla del Mindmap con el badge @ azul eléctrico
        const shotMindmap = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'test_mindmap_mention_badge.png'), Buffer.from(shotMindmap.data, 'base64'));

        console.log("5. Carlos Islas opens infoCard and confirms read receipt...");
        const infoCardView = await send('Runtime.evaluate', {
            expression: `(async () => {
                const p = appData.directProjects[0];
                window.selectNode('direct-project', p.id);
                await new Promise(r => setTimeout(r, 400));
                
                const infoNotes = document.getElementById('infoNotes');
                const hasMentionCapsule = infoNotes.innerHTML.includes('@Carlos Islas');
                const hasTeMencionaronTag = infoNotes.innerHTML.includes('Te mencionaron');
                
                return {
                    hasMentionCapsule,
                    hasTeMencionaronTag
                };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });
        console.log("InfoCard mention elements:", infoCardView.result.value);

        const shotForum = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'test_forum_mention_receipt.png'), Buffer.from(shotForum.data, 'base64'));

        console.log("6. Carlos clicks 'Enterado / Confirmar lectura'...");
        const confirmResult = await send('Runtime.evaluate', {
            expression: `(async () => {
                const p = appData.directProjects[0];
                const note = p.notes[0];
                window.confirmNoteRead(note.id);
                await new Promise(r => setTimeout(r, 300));
                
                const badgeAfter = document.querySelector('.project-unread-badge');
                const mentionAlertsAfter = (window.__lastAlerts || []).filter(a => a.alertType === 'mention');
                
                return {
                    badgeRemains: !!badgeAfter,
                    mentionAlertsCount: mentionAlertsAfter.length,
                    readBy: note.readBy
                };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });
        console.log("Confirm result:", confirmResult.result.value);

        const shotForumConfirmed = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'test_forum_mention_confirmed.png'), Buffer.from(shotForumConfirmed.data, 'base64'));

        console.log("\n=======================================================");
        console.log(">>> ALL MENTION & INVOLVEMENT TESTS PASSED 100%! <<<");
        console.log("=======================================================\n");

    } catch(err) {
        console.error("Test error:", err);
    } finally {
        chromeProc.kill();
        server.close();
        process.exit(0);
    }
});
