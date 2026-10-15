const http = require('http');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const PORT = 8101;
const server = http.createServer((req, res) => {
    console.log('[HTTP REQ]', req.url);
    let filePath = path.join(__dirname, '..', req.url.split('?')[0].replace(/^\/+/, '') || 'index.html');
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        let ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': ext === '.js' ? 'application/javascript' : (ext === '.css' ? 'text/css' : 'text/html') });
        res.end(data);
    });
});
server.listen(PORT, async () => {
    const chrome = cp.spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new', '--remote-debugging-port=9235', '--user-data-dir=C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_' + Date.now(), 'about:blank'
    ]);
    await new Promise(r => setTimeout(r, 1500));
    const list = await (await fetch('http://127.0.0.1:9235/json/list')).json();
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);

    ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.method === 'Runtime.consoleAPICalled') {
            console.log('[BROWSER LOG]', m.params.args.map(a => a.value || a.description).join(' '));
        }
        if (m.method === 'Runtime.exceptionThrown') {
            console.error('[BROWSER EXCEPTION]', m.params.exceptionDetails.text, m.params.exceptionDetails.exception);
        }
    };

    ws.onopen = async () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Page.navigate', params: { url: `http://127.0.0.1:${PORT}/index.html` } }));
        await new Promise(r => setTimeout(r, 3500));
        
        let id = 10;
        function evalExpr(expr) {
            return new Promise(res => {
                const reqId = id++;
                const h = (e) => {
                    const m = JSON.parse(e.data);
                    if (m.id === reqId) { ws.removeEventListener('message', h); res(m.result); }
                };
                ws.addEventListener('message', h);
                ws.send(JSON.stringify({ id: reqId, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
            });
        }
        const res = await evalExpr('Object.keys(window).filter(k => k.startsWith("populate"))');
        console.log('Populate keys:', res?.result?.value);
        const compFn = await evalExpr('typeof window.populateCompanyChecklist');
        console.log('populateCompanyChecklist:', compFn?.result?.value);
        const appLoaded = await evalExpr('typeof window.appData');
        console.log('appData:', appLoaded?.result?.value);
        
        ws.close();
        chrome.kill();
        server.close();
        process.exit(0);
    };
});
