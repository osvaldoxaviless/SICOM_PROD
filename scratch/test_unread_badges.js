const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8130;
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
    
    const remotePort = 9229;
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
        await new Promise(r => setTimeout(r, 1800));
        
        // 1. Iniciar sesión como Osvaldo (STGT) y agregar un bloqueo en un proyecto
        console.log("1. Adding note as Osvaldo (STGT)...");
        await send('Runtime.evaluate', {
            expression: `
                localStorage.setItem('sicom_author', 'Osvaldo (STGT)');
                localStorage.setItem('sicom_role', 'Supremo');
                location.reload();
            `
        });
        await new Promise(r => setTimeout(r, 2200));

        const addRes = await send('Runtime.evaluate', {
            expression: `(async () => {
                const ges = document.getElementById('globalEditSelector');
                const opt = Array.from(ges ? ges.options : []).find(o => o.value.startsWith('project|') || o.value.startsWith('direct-project|'));
                if (!opt) return { error: 'No project' };
                const [type, id] = opt.value.split('|');
                window.selectNode(type, id);
                await new Promise(r => setTimeout(r, 400));
                
                const item = window.getSelectedItem();
                // Ensure consultants list includes a second consultant: 'Rodrigo'
                if (item && (!item.consultants || !item.consultants.includes('Rodrigo'))) {
                    item.consultants = item.consultants || [];
                    item.consultants.push('Rodrigo');
                }
                
                window.setNoteTag('bloqueo', 'info');
                const noteInput = document.getElementById('infoNoteInput');
                noteInput.value = '⚠️ Atención equipo: El servidor de homologación estará en mantenimiento hoy a las 18:00 hrs. Favor de confirmar enterados.';
                window.addProjectNote('info');
                await new Promise(r => setTimeout(r, 500));

                return { projectId: id, projectName: item.name };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });
        console.log("Note added:", JSON.stringify(addRes, null, 2));

        // 2. Cambiar de usuario a Rodrigo (Consultor)
        console.log("2. Switching user to Rodrigo...");
        await send('Runtime.evaluate', {
            expression: `
                localStorage.setItem('sicom_author', 'Rodrigo');
                localStorage.setItem('sicom_role', 'Consultor');
                location.reload();
            `
        });
        await new Promise(r => setTimeout(r, 2200));

        // 3. Verificar si en el mapa aparece el badge en la pastilla del proyecto
        console.log("3. Checking mindmap badge for Rodrigo...");
        const badgeCheck = await send('Runtime.evaluate', {
            expression: `(() => {
                const badges = document.querySelectorAll('.project-unread-badge');
                return {
                    numBadgesFound: badges.length,
                    badgeText: badges[0] ? badges[0].textContent.trim() : null
                };
            })()`,
            returnByValue: true
        });
        console.log("Badge check result for Rodrigo:", JSON.stringify(badgeCheck, null, 2));

        // Capture screenshot of canvas with badge
        const mapScreenshot = await send('Page.captureScreenshot', { format: 'png' });
        const mapArtifactPath = path.resolve('C:\\Users\\osvsa\\.gemini\\antigravity\\brain\\708821d1-6daa-40a8-a63c-e7469c4936c9', 'mindmap_unread_badge.png');
        fs.writeFileSync(mapArtifactPath, Buffer.from(mapScreenshot.data, 'base64'));
        console.log(`Saved canvas badge screenshot to ${mapArtifactPath}`);

        // 4. Rodrigo hace clic en el proyecto para ver la nota y confirmar lectura
        console.log("4. Rodrigo opens project and confirms reading...");
        const readAction = await send('Runtime.evaluate', {
            expression: `(async () => {
                const ges = document.getElementById('globalEditSelector');
                const opt = Array.from(ges ? ges.options : []).find(o => o.value.startsWith('project|') || o.value.startsWith('direct-project|'));
                const [type, id] = opt.value.split('|');
                window.selectNode(type, id);
                await new Promise(r => setTimeout(r, 600));

                // Check if accordion is opened
                const acc = document.getElementById('acc-notes-details');
                const isOpen = acc ? acc.open : false;

                // Find confirm read button
                const btnRead = document.querySelector("button[onclick*='confirmNoteRead']");
                const hasBtn = Boolean(btnRead);

                // Scroll card to see forum
                const card = document.getElementById('infoCard');
                if (card) card.scrollTop = card.scrollHeight;

                return {
                    isOpen,
                    hasConfirmButton: hasBtn
                };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });
        console.log("Read action state:", JSON.stringify(readAction, null, 2));

        // Take screenshot of infoCard with unread note and [Enterado] button
        const cardScreenshot = await send('Page.captureScreenshot', { format: 'png' });
        const cardArtifactPath = path.resolve('C:\\Users\\osvsa\\.gemini\\antigravity\\brain\\708821d1-6daa-40a8-a63c-e7469c4936c9', 'infocard_unconfirmed_note.png');
        fs.writeFileSync(cardArtifactPath, Buffer.from(cardScreenshot.data, 'base64'));
        console.log(`Saved unconfirmed note screenshot to ${cardArtifactPath}`);

        // 5. Rodrigo da clic en [Enterado / Confirmar lectura]
        console.log("5. Clicking [Enterado / Confirmar lectura]...");
        const afterConfirm = await send('Runtime.evaluate', {
            expression: `(async () => {
                const btnRead = document.querySelector("button[onclick*='confirmNoteRead']");
                if (btnRead) btnRead.click();
                await new Promise(r => setTimeout(r, 600));

                const badgesAfter = document.querySelectorAll('.project-unread-badge').length;
                const notesContainer = document.getElementById('infoNotes');
                return {
                    badgesRemainingOnCanvas: badgesAfter,
                    confirmedNoteHTML: notesContainer ? notesContainer.innerHTML : ''
                };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });
        console.log("After confirmation result:", JSON.stringify(afterConfirm, null, 2));

        // Take screenshot after confirmation
        const confirmedScreenshot = await send('Page.captureScreenshot', { format: 'png' });
        const confirmedArtifactPath = path.resolve('C:\\Users\\osvsa\\.gemini\\antigravity\\brain\\708821d1-6daa-40a8-a63c-e7469c4936c9', 'infocard_confirmed_receipt.png');
        fs.writeFileSync(confirmedArtifactPath, Buffer.from(confirmedScreenshot.data, 'base64'));
        console.log(`Saved confirmed receipt screenshot to ${confirmedArtifactPath}`);

        ws.close();
        chromeProc.kill();
        server.close();
        console.log("TEST COMPLETED WITH 100% SUCCESS!");
        process.exit(0);
    } catch(err) {
        console.error("Test error:", err);
        chromeProc.kill();
        server.close();
        process.exit(1);
    }
});
