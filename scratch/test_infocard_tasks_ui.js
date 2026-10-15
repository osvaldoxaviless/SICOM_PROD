const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8125;
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
    console.log(`Server running at http://localhost:${PORT}`);
    
    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const chromePath = chromePaths.find(p => fs.existsSync(p));
    if (!chromePath) {
        console.log("Chrome not found");
        server.close();
        process.exit(0);
    }
    
    const remotePort = 9227;
    const chromeProc = spawn(chromePath, [
        '--headless',
        '--disable-gpu',
        `--remote-debugging-port=${remotePort}`,
        '--window-size=1280,800',
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
        
        // Log in via localStorage
        await send('Runtime.evaluate', {
            expression: `
                localStorage.setItem('sicom_author', 'Osvaldo (STGT)');
                localStorage.setItem('sicom_role', 'Supremo');
                location.reload();
            `
        });
        await new Promise(r => setTimeout(r, 2000));
        
        // Select a project using globalEditSelector
        const evalRes = await send('Runtime.evaluate', {
            expression: `(async () => {
                const ges = document.getElementById('globalEditSelector');
                const opt = Array.from(ges ? ges.options : []).find(o => o.value.startsWith('project|') || o.value.startsWith('direct-project|'));
                if (opt) {
                    const [type, id] = opt.value.split('|');
                    if (window.selectNode) window.selectNode(type, id);
                }
                await new Promise(r => setTimeout(r, 600));
                
                // Expand "Tareas del Proyecto" details accordion
                const details = Array.from(document.querySelectorAll('#infoCard details')).find(d => d.textContent.includes('Tareas del Proyecto'));
                if (details) details.open = true;
                
                const assigneeSelect = document.getElementById('newQuickTaskAssignee');
                const optText = assigneeSelect && assigneeSelect.options[0] ? assigneeSelect.options[0].textContent : '';
                
                // Scroll infoCard to bottom
                const card = document.getElementById('infoCard');
                if (card) card.scrollTop = card.scrollHeight;
                await new Promise(r => setTimeout(r, 400));
                
                return {
                    infoCardVisible: !document.getElementById('infoCard').classList.contains('hidden'),
                    firstOption: optText,
                    numOptions: assigneeSelect ? assigneeSelect.options.length : 0
                };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });

        console.log("Evaluation result:", JSON.stringify(evalRes, null, 2));

        await new Promise(r => setTimeout(r, 600));

        // Take a screenshot of infoCard with tasks accordion open
        const screenshot = await send('Page.captureScreenshot', { format: 'png' });
        const screenshotPath = path.join(__dirname, 'infocard_tasks_redesign.png');
        fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
        console.log(`Screenshot saved to ${screenshotPath}`);

        ws.close();
    } catch (e) {
        console.error("Test error:", e);
    } finally {
        chromeProc.kill();
        server.close();
        process.exit(0);
    }
});
