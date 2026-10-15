const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8129;
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
    
    const remotePort = 9228;
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
        
        // Log in as Supremo
        await send('Runtime.evaluate', {
            expression: `
                localStorage.setItem('sicom_author', 'Osvaldo (STGT)');
                localStorage.setItem('sicom_role', 'Supremo');
                location.reload();
            `
        });
        await new Promise(r => setTimeout(r, 2200));
        
        // Select a project and test the forum
        const testRes = await send('Runtime.evaluate', {
            expression: `(async () => {
                const results = {};
                // Find a project
                const ges = document.getElementById('globalEditSelector');
                const opt = Array.from(ges ? ges.options : []).find(o => o.value.startsWith('project|') || o.value.startsWith('direct-project|'));
                if (!opt) return { error: 'No project found in globalEditSelector' };
                
                const [type, id] = opt.value.split('|');
                window.selectNode(type, id);
                await new Promise(r => setTimeout(r, 500));
                
                // Open forum accordion
                const acc = document.getElementById('acc-notes-details');
                if (acc) acc.open = true;
                await new Promise(r => setTimeout(r, 300));
                
                // Check initial empty or existing notes
                const initialCount = document.querySelectorAll('#infoNotes > div').length;
                results.initialNotesCount = initialCount;
                
                // Set tag to 'acuerdo'
                window.setNoteTag('acuerdo', 'info');
                
                // Fill input
                const noteInput = document.getElementById('infoNoteInput');
                noteInput.value = 'Se pactó con el cliente la entrega del sprint 3 para este viernes. Ver detalles en https://docs.google.com/minuta-test';
                
                // Publish
                window.addProjectNote('info');
                await new Promise(r => setTimeout(r, 500));
                
                results.afterFirstNoteCount = document.querySelectorAll('#infoNotes > div').length;
                results.badgeText = document.getElementById('infoNotesBadge')?.textContent;
                
                // Add second note: 'bloqueo' using simulated Ctrl+Enter
                window.setNoteTag('bloqueo', 'info');
                noteInput.value = 'Falta aprobación de accesos a la base de datos de producción.';
                
                const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true });
                noteInput.dispatchEvent(enterEvent);
                await new Promise(r => setTimeout(r, 500));
                
                results.afterSecondNoteCount = document.querySelectorAll('#infoNotes > div').length;
                results.finalBadgeText = document.getElementById('infoNotesBadge')?.textContent;
                
                // Scroll card to see forum clearly
                const card = document.getElementById('infoCard');
                if (card) card.scrollTop = card.scrollHeight;
                
                return results;
            })()`,
            awaitPromise: true,
            returnByValue: true
        });

        console.log("Forum Test Evaluation:", JSON.stringify(testRes, null, 2));

        await new Promise(r => setTimeout(r, 600));

        // Take screenshot
        const screenshot = await send('Page.captureScreenshot', { format: 'png' });
        const screenshotBuf = Buffer.from(screenshot.data, 'base64');
        const artifactPath = path.resolve('C:\\Users\\osvsa\\.gemini\\antigravity\\brain\\708821d1-6daa-40a8-a63c-e7469c4936c9', 'infocard_forum_redesign.png');
        fs.writeFileSync(artifactPath, screenshotBuf);
        console.log(`Saved screenshot to ${artifactPath}`);

        ws.close();
        chromeProc.kill();
        server.close();
        process.exit(0);
    } catch(err) {
        console.error("Test error:", err);
        chromeProc.kill();
        server.close();
        process.exit(1);
    }
});
