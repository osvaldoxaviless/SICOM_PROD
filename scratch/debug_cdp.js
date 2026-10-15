const cp = require('child_process');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = cp.spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--no-sandbox',
    '--disable-extensions',
    '--user-data-dir=C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_debug_' + Date.now(),
    'https://panel-control-sicom.netlify.app/'
  ]);

  let tabs = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9225/json/list');
      tabs = await res.json();
      if (tabs.length > 0 && tabs.some(t => t.type === 'page')) break;
    } catch(e) {}
  }

  const pageTab = tabs.find(t => t.type === 'page');
  console.log('Target Page Tab:', pageTab?.url, pageTab?.webSocketDebuggerUrl);

  if (pageTab) {
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, ':', msg.params.args.map(a => a.value || a.description).join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
      } else if (msg.method === 'Network.responseReceived') {
        const res = msg.params.response;
        if (res.status >= 400) {
          console.error(`[HTTP ${res.status}]:`, res.url);
        }
      }
    };
    await new Promise(r => ws.onopen = r);
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
    ws.send(JSON.stringify({ id: 3, method: 'Network.enable' }));

    // Reload page to catch all logs from beginning
    ws.send(JSON.stringify({ id: 4, method: 'Page.reload' }));

    // Let it run for 6 seconds
    await new Promise(r => setTimeout(r, 6000));

    // Eval state
    ws.send(JSON.stringify({
      id: 5,
      method: 'Runtime.evaluate',
      params: {
        expression: `({
          cloudLoaderDisplay: document.getElementById('cloudLoader')?.style?.display,
          cloudLoaderOpacity: document.getElementById('cloudLoader')?.style?.opacity,
          loginOverlayClass: document.getElementById('loginOverlay')?.className,
          isFirebaseReady: typeof isFirebaseReady !== 'undefined' ? isFirebaseReady : 'undef',
          localAuthor: typeof localAuthor !== 'undefined' ? localAuthor : 'undef'
        })`,
        returnByValue: true
      }
    }));

    await new Promise(r => {
      const orig = ws.onmessage;
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === 5) {
          console.log('[EVAL STATE]:', msg.result?.result?.value);
          r();
        } else {
          orig(e);
        }
      };
    });
  }

  proc.kill();
}

test().catch(console.error);
