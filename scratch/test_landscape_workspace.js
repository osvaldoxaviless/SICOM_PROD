const cp = require('child_process');

async function testLandscapeLoggedIn() {
  const p = cp.spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9242',
    'https://tablerocontrolaplstgt.vercel.app/'
  ]);

  await new Promise(r => setTimeout(r, 1500));
  const tabs = await (await fetch('http://127.0.0.1:9242/json/list')).json();
  const pageTab = tabs.find(t => t.url.includes('tablerocontrolaplstgt'));
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'DOM.enable' }));

  // Emulate iPhone landscape: 844 x 390
  ws.send(JSON.stringify({
    id: 2,
    method: 'Emulation.setDeviceMetricsOverride',
    params: {
      width: 844,
      height: 390,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { type: 'landscapePrimary', angle: 90 }
    }
  }));

  await new Promise(r => setTimeout(r, 1000));

  // Log in as Supremo
  const loginCode = `
    (() => {
      localStorage.setItem('sicom_author', 'Osvaldo (STGT)');
      localStorage.setItem('sicom_role', 'Supremo');
      location.reload();
    })()
  `;

  ws.send(JSON.stringify({
    id: 3,
    method: 'Runtime.evaluate',
    params: { expression: loginCode }
  }));

  await new Promise(r => setTimeout(r, 3000));

  const evalPromise = new Promise(resolve => {
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id === 4) resolve(m.result);
    };
  });

  const checkWorkspace = `
    (() => {
      const header = document.querySelector('header');
      const hRect = header ? header.getBoundingClientRect() : null;
      const speedDial = document.getElementById('speedDial');
      const sdRect = speedDial ? speedDial.getBoundingClientRect() : null;
      const btnDaily = document.getElementById('btnDailyTasks');
      const bdRect = btnDaily ? btnDaily.getBoundingClientRect() : null;
      const btnManual = document.getElementById('btnManual');
      const bmRect = btnManual ? btnManual.getBoundingClientRect() : null;
      const mobileBtn = document.getElementById('mobileMenuBtn');
      const mbRect = mobileBtn ? mobileBtn.getBoundingClientRect() : null;

      // Select first project to trigger infoCard
      let infoCardData = null;
      const firstProjNode = document.querySelector('.project-node');
      if (firstProjNode) {
        firstProjNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        const card = document.getElementById('infoCard');
        if (card) {
          const cRect = card.getBoundingClientRect();
          infoCardData = {
            width: Math.round(cRect.width),
            height: Math.round(cRect.height),
            top: Math.round(cRect.top),
            bottom: Math.round(cRect.bottom),
            left: Math.round(cRect.left),
            right: Math.round(cRect.right),
            overlapsHeader: cRect.top < (hRect ? hRect.bottom : 0),
            clippedBottom: cRect.bottom > window.innerHeight
          };
        }
      }

      return {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        headerHeight: hRect ? Math.round(hRect.height) : 0,
        mobileMenuBtnVisible: mbRect ? (mbRect.width > 0 && mbRect.height > 0) : false,
        speedDialRight: sdRect ? Math.round(sdRect.right) : 0,
        speedDialBottom: sdRect ? Math.round(sdRect.bottom) : 0,
        btnDailyTop: bdRect ? Math.round(bdRect.top) : 0,
        infoCard: infoCardData
      };
    })()
  `;

  ws.send(JSON.stringify({
    id: 4,
    method: 'Runtime.evaluate',
    params: { expression: checkWorkspace, returnByValue: true }
  }));

  const res = await evalPromise;
  console.log('Workspace landscape check:', JSON.stringify(res.result?.value, null, 2));
  p.kill();
}
testLandscapeLoggedIn();
