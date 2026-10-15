const cp = require('child_process');

async function testBrowserDirectDigest() {
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
        const webhookUrl = 'https://chat.googleapis.com/v1/spaces/AAQAyNI0CRc/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=_iCQr9wsy0wvYbtRNBhbkQEbc9akwecjFXn8Hqg8v0c';
        const digest = window.generateMorningDigestText ? window.generateMorningDigestText() : 'Digest fallback test';
        const res = await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ text: digest })
        });
        return { success: true, type: res.type, length: digest.length };
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    })()
  `;

  // Wait 3 seconds for appData to load from Firestore
  await new Promise(r => setTimeout(r, 3000));

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: { expression: code, awaitPromise: true, returnByValue: true }
  }));

  const result = await evalPromise;
  console.log('Browser digest test result:', JSON.stringify(result));
  proc.kill();
}
testBrowserDirectDigest();
