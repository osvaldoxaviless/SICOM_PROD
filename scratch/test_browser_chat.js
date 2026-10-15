const cp = require('child_process');

async function testBrowserDirect() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = cp.spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\osvsa\\AppData\\Local\\Temp\\chrome_chat_test_' + Date.now(),
    'https://panel-control-sicom.netlify.app/'
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

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  const evalPromise = new Promise((resolve) => {
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) resolve(msg.result);
    };
  });

  const code = `
    (async () => {
      try {
        const url = 'https://chat.googleapis.com/v1/spaces/AAQAyNI0CRc/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=_iCQr9wsy0wvYbtRNBhbkQEbc9akwecjFXn8Hqg8v0c';
        const res = await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ text: '🔔 Test exitoso directo desde navegador Chrome' })
        });
        return { success: true, type: res.type };
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    })()
  `;

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: { expression: code, awaitPromise: true, returnByValue: true }
  }));

  const result = await evalPromise;
  console.log('Browser result:', JSON.stringify(result));
  proc.kill();
}
testBrowserDirect();
