async function check() {
  const res = await fetch('https://panel-control-sicom.netlify.app/?t=' + Date.now(), {
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
  });
  const html = await res.text();
  const match = html.match(/app\.js\?v=([^\"]+)/);
  console.log('Cache buster on Netlify:', match ? match[0] : 'None');
}
check();
