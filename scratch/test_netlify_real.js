const cp = require('child_process');

async function testNetlifyReal() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = cp.spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
    '--no-sandbox',
    '--disable-extensions',
    '--user-data-dir=C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_real_' + Date.now(),
    'about:blank'
  ]);

  let tabs = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9229/json/list');
      tabs = await res.json();
      if (tabs.length > 0 && tabs.some(t => t.type === 'page')) break;
    } catch(e) {}
  }

  const pageTab = tabs.find(t => t.type === 'page');
  console.log('Connecting to tab:', pageTab.url);

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  let pageLoaded = false;
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Page.loadEventFired') {
      pageLoaded = true;
      console.log('⚡ Page.loadEventFired received!');
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
    }
  };

  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));

  console.log('Navigating to Netlify...');
  ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'https://panel-control-sicom.netlify.app/' } }));

  // Wait 4 seconds for full boot
  await new Promise(r => setTimeout(r, 4000));

  // Check login dropdown
  ws.send(JSON.stringify({
    id: 10,
    method: 'Runtime.evaluate',
    params: {
      expression: `({
        url: window.location.href,
        loaderDisplay: document.getElementById('cloudLoader')?.style?.display,
        loaderOpacity: document.getElementById('cloudLoader')?.style?.opacity,
        optionsCount: document.getElementById('loginUserSelect')?.options?.length,
        optionsList: Array.from(document.getElementById('loginUserSelect')?.options || []).map(o => o.value)
      })`,
      returnByValue: true
    }
  }));

  await new Promise(r => {
    const prev = ws.onmessage;
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === 10) {
        console.log('ESTADO DE LA PÁGINA EN NETLIFY:', msg.result?.result?.value);
        r();
      } else {
        prev(e);
      }
    };
  });

  // Ahora ejecutamos el inicio de sesión
  console.log('\nEjecutando inicio de sesión con Osvaldo Avilés...');
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
        return { attempted: true };
      })()`,
      returnByValue: true
    }
  }));

  // Esperar 2.5s para que se anime y cargue el mapa
  await new Promise(r => setTimeout(r, 2500));

  // Verificar el estado post-login
  ws.send(JSON.stringify({
    id: 30,
    method: 'Runtime.evaluate',
    params: {
      expression: `({
        welcomeMessage: document.getElementById('topBarWelcome')?.textContent,
        loginOverlayHidden: document.getElementById('loginOverlay')?.classList.contains('hidden'),
        canvasSvgNodes: document.querySelectorAll('#canvasGroup g').length,
        modulesCount: document.querySelectorAll('.module-node').length,
        localStorageAuthor: localStorage.getItem('sicom_author'),
        localStorageRole: localStorage.getItem('sicom_role')
      })`,
      returnByValue: true
    }
  }));

  await new Promise(r => {
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === 30) {
        console.log('\n🎉 ESTADO DESPUÉS DE INICIAR SESIÓN EN VIVO:');
        console.log(JSON.stringify(msg.result?.result?.value, null, 2));
        r();
      }
    };
  });

  proc.kill();
  process.exit(0);
}

testNetlifyReal().catch(console.error);
