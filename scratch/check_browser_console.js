const http = require('http');
const cp = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const proc = cp.spawn(chromePath, [
  '--headless',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-sandbox',
  'https://panel-control-sicom.netlify.app/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const tabs = await listRes.json();
    console.log('Tabs:', tabs.map(t => ({ title: t.title, url: t.url, ws: t.webSocketDebuggerUrl })));
    
    if (tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
      const WebSocket = require('ws'); // may not be installed, check first
    }
  } catch (e) {
    console.error('Error querying CDP:', e);
  } finally {
    proc.kill();
  }
}, 3000);
