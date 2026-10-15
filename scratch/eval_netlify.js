const cp = require('child_process');

async function test() {
  const p = cp.spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9231',
    '--no-sandbox',
    '--disable-extensions',
    'about:blank'
  ]);

  let tabs = [];
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      tabs = await (await fetch('http://127.0.0.1:9231/json/list')).json();
      if (tabs.some(t => t.url.includes('panel-control-sicom'))) break;
    } catch(e) {}
  }

  const targetTab = tabs.find(t => t.url.includes('panel-control-sicom')) || tabs.find(t => t.type === 'page');
  console.log('Connecting to real tab:', targetTab.url);
  const ws = new WebSocket(targetTab.webSocketDebuggerUrl);

  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id === 10) {
      console.log('EVAL RESULT:', JSON.stringify(m.result?.result?.value, null, 2));
      p.kill();
      process.exit(0);
    }
    if (m.method === 'Runtime.exceptionThrown') {
      console.error('EXC:', m.params.exceptionDetails.text, m.params.exceptionDetails.exception?.description);
    }
    if (m.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE:', m.params.type, m.params.args.map(a => a.value || a.description).join(' '));
    }
  };

  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
  ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'https://panel-control-sicom.netlify.app/' } }));

  await new Promise(r => setTimeout(r, 5000));

  const expr = `({
    fnType: typeof window.populateLoginDropdown,
    loginSelectHTML: document.getElementById('loginUserSelect')?.outerHTML,
    cloudLoaderStyle: document.getElementById('cloudLoader')?.getAttribute('style'),
    loginOverlayClass: document.getElementById('loginOverlay')?.className,
    scripts: Array.from(document.querySelectorAll('script')).map(s => s.src)
  })`;

  ws.send(JSON.stringify({ id: 10, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
}

test().catch(console.error);
