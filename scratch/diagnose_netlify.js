const cp = require('child_process');

async function test() {
  const p = cp.spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9233',
    '--no-sandbox',
    '--disable-extensions',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 600));
  const tabs = await (await fetch('http://127.0.0.1:9233/json/list')).json();
  const pageTab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') {
      console.error('🔥 [EXCEPTION THROWN]:', m.params.exceptionDetails.text, m.params.exceptionDetails.exception?.description || '', m.params.exceptionDetails.stackTrace?.callFrames);
    }
    if (m.method === 'Log.entryAdded') {
      console.log('📜 [LOG ENTRY]:', m.params.entry.level, m.params.entry.text);
    }
    if (m.method === 'Runtime.consoleAPICalled') {
      console.log('📢 [CONSOLE LOG]:', m.params.type, m.params.args.map(a => a.value || a.description).join(' '));
    }
    if (m.method === 'Network.responseReceived') {
      console.log('🌐 [NET RES]:', m.params.response.status, m.params.response.mimeType, m.params.response.url);
    }
    if (m.method === 'Network.loadingFailed') {
      console.error('🌐 [NET FAILED]:', m.params.errorText, m.params.type, m.params.requestId);
    }
    if (m.id === 10) {
      console.log('📊 [EVAL RESULT]:', JSON.stringify(m.result?.result?.value, null, 2));
      p.kill();
      process.exit(0);
    }
  };

  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
  ws.send(JSON.stringify({ id: 3, method: 'Network.enable' }));
  ws.send(JSON.stringify({ id: 4, method: 'Log.enable' }));

  console.log('Navigating to Netlify...');
  ws.send(JSON.stringify({ id: 5, method: 'Page.navigate', params: { url: 'https://panel-control-sicom.netlify.app/' } }));

  // Wait 12s
  await new Promise(r => setTimeout(r, 12000));

  const expr = `({
    appDataExists: typeof appData !== 'undefined',
    modulesCount: typeof appData !== 'undefined' ? appData.modules?.length : -1,
    defaultTestingDataExists: typeof defaultTestingData !== 'undefined',
    initDataCalled: typeof isFirebaseReady !== 'undefined',
    cloudLoaderStyle: document.getElementById('cloudLoader')?.getAttribute('style')
  })`;

  ws.send(JSON.stringify({ id: 10, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
}

test().catch(console.error);
