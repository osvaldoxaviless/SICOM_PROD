const cp = require('child_process');

async function test() {
  const p = cp.spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9232',
    '--no-sandbox',
    '--disable-extensions',
    'https://panel-control-sicom.netlify.app/'
  ]);

  await new Promise(r => setTimeout(r, 1000));
  const tabs = await (await fetch('http://127.0.0.1:9232/json/list')).json();
  const pageTab = tabs.find(t => t.url.includes('panel-control-sicom'));
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id === 10) {
      console.log('EVAL:', JSON.stringify(m.result?.result?.value, null, 2));
      p.kill();
      process.exit(0);
    }
  };

  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

  // Wait 6s
  await new Promise(r => setTimeout(r, 6000));

  const expr = `({
    readyState: document.readyState,
    bodyLength: document.body.innerHTML.length,
    allScripts: Array.from(document.scripts).map(s => s.src || 'inline'),
    cloudLoaderDisplay: document.getElementById('cloudLoader')?.style.display,
    loginOverlayClasses: document.getElementById('loginOverlay')?.className
  })`;

  ws.send(JSON.stringify({ id: 10, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
}

test().catch(console.error);
