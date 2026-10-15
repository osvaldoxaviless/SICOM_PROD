const https = require('https');

function check() {
    const url = 'https://tablerocontrolaplstgt.vercel.app/index.html?t=' + Date.now();
    https.get(url, res => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => {
            const hasNewVersion = d.includes('20261015_17');
            console.log(new Date().toLocaleTimeString(), 'Vercel status:', res.statusCode, 'Has v=20261015_17:', hasNewVersion);
            if (!hasNewVersion) {
                setTimeout(check, 3000);
            } else {
                console.log('DEPLOY COMPLETE AND LIVE ON VERCEL!');
                process.exit(0);
            }
        });
    }).on('error', e => {
        console.error(e);
        setTimeout(check, 3000);
    });
}

check();
