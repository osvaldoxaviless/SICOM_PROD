const cp = require('child_process');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = cp.spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--no-sandbox',
    '--disable-extensions',
    '--user-data-dir=C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_test_e2e_' + Date.now(),
    'https://panel-control-sicom.netlify.app/'
  ]);

  let tabs = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9228/json/list');
      tabs = await res.json();
      if (tabs.length > 0 && tabs.some(t => t.type === 'page')) break;
    } catch(e) {}
  }

  const pageTab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id) {
      console.log(`[MSG ID ${msg.id} RESULT]:`, JSON.stringify(msg.result));
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', msg.params.type, ':', msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
    }
  };

  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));

  // Wait 3s for initial page load
  await new Promise(r => setTimeout(r, 3000));

  // Check login elements
  ws.send(JSON.stringify({
    id: 10,
    method: 'Runtime.evaluate',
    params: {
      expression: `({
        selectOptions: Array.from(document.getElementById('loginUserSelect')?.options || []).map(o => o.value),
        currentValue: document.getElementById('loginUserSelect')?.value
      })`,
      returnByValue: true
    }
  }));

  await new Promise(r => setTimeout(r, 1000));

  // Try login
  ws.send(JSON.stringify({
    id: 20,
    method: 'Runtime.evaluate',
    params: {
      expression: `(function() {
        const sel = document.getElementById('loginUserSelect');
        sel.value = 'Osvaldo Avilés';
        window.handleLoginUserChange();
        const pass = document.getElementById('loginPasswordInput');
        pass.value = 'Sicom2026';
        window.attemptLogin();
        return { attempted: true, author: localStorage.getItem('sicom_author') };
      })()`,
      returnByValue: true
    }
  }));

  await new Promise(r => setTimeout(r, 2000));

  // Check post-login DOM
  ws.send(JSON.stringify({
    id: 30,
    method: 'Runtime.evaluate',
    params: {
      expression: `({
        topBarWelcome: document.getElementById('topBarWelcome')?.textContent,
        loginOverlayDisplay: document.getElementById('loginOverlay')?.classList.contains('hidden'),
        canvasGroupChildren: document.getElementById('canvasGroup')?.children?.length,
        svgContentLength: document.getElementById('mindmapCanvas')?.innerHTML?.length
      })`,
      returnByValue: true
    }
  }));

  await new Promise(r => setTimeout(r, 2000));
  proc.kill();
  process.exit(0);
}

test().catch(console.error);
