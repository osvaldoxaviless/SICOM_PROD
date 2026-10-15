const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

const PORT = 8124;
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
    
    // Find Chrome path
    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const chromePath = chromePaths.find(p => fs.existsSync(p));
    if (!chromePath) {
        console.log("Chrome not found for headless test");
        server.close();
        process.exit(0);
    }
    
    const remotePort = 9226;
    const chromeProc = spawn(chromePath, [
        '--headless',
        '--disable-gpu',
        `--remote-debugging-port=${remotePort}`,
        '--window-size=1280,800',
        'about:blank'
    ]);
    
    // Wait for chrome
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
        
        // Open dailyDrawer
        await send('Runtime.evaluate', {
            expression: `
                if (window.toggleDailyDrawer) window.toggleDailyDrawer();
            `
        });
        await new Promise(r => setTimeout(r, 600));
        
        // Test switching to 'alerts'
        await send('Runtime.evaluate', {
            expression: `
                if (window.setNotifTab) window.setNotifTab('alerts');
            `
        });
        await new Promise(r => setTimeout(r, 600));

        // Emulate mobile landscape: 844x390
        await send('Emulation.setDeviceMetricsOverride', {
            width: 844,
            height: 390,
            deviceScaleFactor: 2,
            mobile: true,
            screenOrientation: { type: 'landscapePrimary', angle: 90 }
        });
        await new Promise(r => setTimeout(r, 600));

        // Take a screenshot of completed tab in landscape
        screenshot = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(__dirname, 'daily_drawer_landscape.png'), Buffer.from(screenshot.data, 'base64'));

        console.log("Captured landscape screenshot!");
        ws.close();
    } catch (e) {
        console.error("Test error:", e);
    } finally {
        chromeProc.kill();
        server.close();
        process.exit(0);
    }
});
