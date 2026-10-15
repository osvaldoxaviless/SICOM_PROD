const cp = require('child_process');

async function testLoggedIn() {
  const p = cp.spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9234',
    '--no-sandbox',
    '--disable-extensions',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 600));
  const tabs = await (await fetch('http://127.0.0.1:9234/json/list')).json();
  const pageTab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  let errors = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') {
      errors.push(m.params.exceptionDetails);
      console.error('EXC:', m.params.exceptionDetails);
    }
  };

  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));

  // Set localStorage first by navigating to domain
  ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'https://panel-control-sicom.netlify.app/' } }));
  await new Promise(r => setTimeout(r, 2000));

  // Set credentials in localStorage
  ws.send(JSON.stringify({
    id: 4,
    method: 'Runtime.evaluate',
    params: {
      expression: `(function() {
        localStorage.setItem('sicom_author', 'Osvaldo Avilés');
        localStorage.setItem('sicom_role', 'Supremo');
      })()`
    }
  }));

  // Reload with saved session
  console.log('Recargando página con sesión guardada de Osvaldo Avilés...');
  
  let reloadDone = false;
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.loadEventFired') {
      reloadDone = true;
    }
  };

  ws.send(JSON.stringify({ id: 5, method: 'Page.reload' }));

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    if (reloadDone) break;
  }

  // Wait 3s for data rendering
  await new Promise(r => setTimeout(r, 3000));

  // Check state
  const expr = `({
    welcomeText: document.getElementById('topBarWelcome')?.textContent,
    cloudLoaderDisplay: document.getElementById('cloudLoader')?.style?.display,
    loginOverlayClasses: document.getElementById('loginOverlay')?.className,
    canvasSvgChildCount: document.getElementById('canvasGroup')?.children?.length
  })`;

  ws.send(JSON.stringify({ id: 10, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));

  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id === 10) {
      console.log('\n📊 ESTADO DE SESIÓN INICIADA AUTOMÁTICAMENTE:');
      console.log(JSON.stringify(m.result?.result?.value, null, 2));
      console.log('Total errores:', errors.length);
      p.kill();
      process.exit(errors.length === 0 ? 0 : 1);
    }
  };
}

testLoggedIn().catch(console.error);
