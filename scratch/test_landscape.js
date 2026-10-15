const cp = require('child_process');

async function testLandscape() {
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

  // Emulate iPhone in landscape: 844 x 390
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

  const evalPromise = new Promise(resolve => {
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id === 3) resolve(m.result);
    };
  });

  const checkCode = `
    (() => {
      const card = document.getElementById('loginCard');
      const rect = card ? card.getBoundingClientRect() : null;
      const speedDial = document.getElementById('speedDial');
      const sdRect = speedDial ? speedDial.getBoundingClientRect() : null;
      const header = document.querySelector('header');
      const hRect = header ? header.getBoundingClientRect() : null;

      return {
        windowHeight: window.innerHeight,
        windowWidth: window.innerWidth,
        cardHeight: rect ? Math.round(rect.height) : 0,
        cardTop: rect ? Math.round(rect.top) : 0,
        cardBottom: rect ? Math.round(rect.bottom) : 0,
        cardClipped: rect ? (rect.bottom > window.innerHeight || rect.top < 0) : false,
        headerHeight: hRect ? Math.round(hRect.height) : 0,
        speedDialTop: sdRect ? Math.round(sdRect.top) : 0,
        speedDialBottom: sdRect ? Math.round(sdRect.bottom) : 0
      };
    })()
  `;

  ws.send(JSON.stringify({
    id: 3,
    method: 'Runtime.evaluate',
    params: { expression: checkCode, returnByValue: true }
  }));

  const res = await evalPromise;
  console.log('Landscape check:', JSON.stringify(res.result.value, null, 2));
  p.kill();
}
testLandscape();
