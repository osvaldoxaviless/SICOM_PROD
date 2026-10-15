const cp = require('child_process');

async function inspect() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = cp.spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_inspect_profile_' + Date.now(),
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const data = await res.json();
      if (data && data.length > 0 && data[0].webSocketDebuggerUrl) {
        wsUrl = data[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('No wsUrl');
    proc.kill();
    return;
  }

  console.log('Connected to CDP');
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value !== undefined ? a.value : (a.description || JSON.stringify(a))).join(' ');
      console.log(`[CONSOLE ${msg.params.type.toUpperCase()}]:`, text);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[EXCEPTION]:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description || '', msg.params.exceptionDetails.stackTrace);
    } else if (msg.method === 'Network.responseReceived') {
      const res = msg.params.response;
      if (res.status >= 400) {
        console.error(`[HTTP ${res.status}]:`, res.url);
      }
    } else if (msg.method === 'Network.loadingFailed') {
      console.error(`[NET FAILED]:`, msg.params.errorText, msg.params.type);
    } else if (msg.id === 99) {
      console.log('[EVAL RESULT]:', msg.result?.result?.value);
    }
  };

  await new Promise(r => ws.onopen = r);

  ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 3, method: 'Network.enable' }));
  ws.send(JSON.stringify({ id: 4, method: 'Network.setCacheDisabled', params: { cacheDisabled: true } }));

  console.log('Navigating to Netlify...');
  ws.send(JSON.stringify({ id: 5, method: 'Page.navigate', params: { url: 'https://panel-control-sicom.netlify.app/' } }));

  // Wait 7 seconds
  await new Promise(r => setTimeout(r, 7000));

  ws.send(JSON.stringify({
    id: 99,
    method: 'Runtime.evaluate',
    params: {
      expression: `({
        cloudLoaderDisplay: document.getElementById('cloudLoader')?.style.display,
        cloudLoaderOpacity: document.getElementById('cloudLoader')?.style.opacity,
        loginOverlayClasses: document.getElementById('loginOverlay')?.className,
        loginCardOpacity: document.getElementById('loginCard')?.style.opacity,
        userSelectOptions: document.getElementById('loginUserSelect')?.options?.length
      })`,
      returnByValue: true
    }
  }));

  await new Promise(r => setTimeout(r, 1500));
  proc.kill();
  process.exit(0);
}

inspect().catch(e => { console.error(e); process.exit(1); });
