async function check() {
  const res = await fetch('https://tablerocontrolaplstgt.vercel.app/');
  console.log('Status:', res.status);
  const text = await res.text();
  const match = text.match(/app\.js\?v=([^"]+)/);
  console.log('Version:', match ? match[0] : 'None');

  const jsRes = await fetch('https://tablerocontrolaplstgt.vercel.app/app.js?v=20261015_08');
  const jsText = await jsRes.text();
  console.log('Tiene GOOGLE_CHAT_WEBHOOK_URL:', jsText.includes('GOOGLE_CHAT_WEBHOOK_URL'));
  console.log('Tiene triggerChatMorningDigest:', jsText.includes('triggerChatMorningDigest'));
}
check();
