const cp = require('child_process');

async function testLiveLogin() {
  console.log('Iniciando prueba E2E de inicio de sesión real en Netlify...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = cp.spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--no-sandbox',
    '--disable-extensions',
    '--user-data-dir=C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_e2e_' + Date.now(),
    'https://panel-control-sicom.netlify.app/'
  ]);

  let tabs = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9227/json/list');
      tabs = await res.json();
      if (tabs.length > 0 && tabs.some(t => t.type === 'page')) break;
    } catch(e) {}
  }

  const pageTab = tabs.find(t => t.type === 'page');
  console.log('Página conectada:', pageTab?.url);

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  const consoleLogs = [];
  const errors = [];

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const t = msg.params.args.map(a => a.value || a.description).join(' ');
      consoleLogs.push(`[${msg.params.type}] ${t}`);
      if (msg.params.type === 'error') errors.push(t);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const err = msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || '');
      errors.push(err);
      console.error('❌ EXCEPCIÓN DETECTADA:', err);
    }
  };

  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));

  // Esperar a que cargue la pantalla de login (2.5 segundos)
  await new Promise(r => setTimeout(r, 2500));

  console.log('Simulando ingreso de credenciales de Osvaldo Avilés...');

  // Ejecutar login
  const loginScript = `
    (function() {
      const sel = document.getElementById('loginUserSelect');
      sel.value = 'Osvaldo Avilés';
      window.handleLoginUserChange();
      const pass = document.getElementById('loginPasswordInput');
      pass.value = 'Sicom2026';
      window.attemptLogin();
      return { selected: sel.value, passFilled: !!pass.value };
    })()
  `;

  ws.send(JSON.stringify({
    id: 10,
    method: 'Runtime.evaluate',
    params: { expression: loginScript, returnByValue: true }
  }));

  // Esperar 2.5 segundos para render del mapa interactivo
  await new Promise(r => setTimeout(r, 2500));

  // Verificar estado del workspace
  const checkWorkspace = `
    (function() {
      const canvasGroup = document.getElementById('canvasGroup');
      const nodes = canvasGroup ? canvasGroup.querySelectorAll('g.node, g[data-id], g.mindmap-node, g').length : 0;
      const welcome = document.getElementById('topBarWelcome')?.textContent;
      const overlayHidden = document.getElementById('loginOverlay')?.classList.contains('hidden');
      const infoCard = document.getElementById('infoCard');
      const modules = typeof appData !== 'undefined' ? appData.modules?.length : 0;
      const directProjs = typeof appData !== 'undefined' ? appData.directProjects?.length : 0;
      const userRole = typeof currentUserRole !== 'undefined' ? currentUserRole : '';

      return {
        welcomeText: welcome,
        loginOverlayHidden: overlayHidden,
        modulesInAppData: modules,
        directProjectsInAppData: directProjs,
        svgNodesCount: nodes,
        currentUserRole: userRole,
        url: window.location.href
      };
    })()
  `;

  ws.send(JSON.stringify({
    id: 20,
    method: 'Runtime.evaluate',
    params: { expression: checkWorkspace, returnByValue: true }
  }));

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id === 20) {
      console.log('\n=========================================');
      console.log('📊 RESULTADO DE VERIFICACIÓN E2E EN VIVO:');
      console.log('=========================================');
      console.log('Mensaje de Bienvenida:', msg.result?.result?.value?.welcomeText);
      console.log('Login Ocultado (Entró al sistema):', msg.result?.result?.value?.loginOverlayHidden);
      console.log('Rol asignado:', msg.result?.result?.value?.currentUserRole);
      console.log('Módulos cargados en memoria:', msg.result?.result?.value?.modulesInAppData);
      console.log('Proyectos directos cargados:', msg.result?.result?.value?.directProjectsInAppData);
      console.log('Nodos SVG renderizados en pantalla:', msg.result?.result?.value?.svgNodesCount);
      console.log('Total Errores / Excepciones:', errors.length);
      console.log('=========================================\n');

      proc.kill();
      process.exit(errors.length === 0 ? 0 : 1);
    }
  };
}

testLiveLogin().catch(err => {
  console.error(err);
  process.exit(1);
});
