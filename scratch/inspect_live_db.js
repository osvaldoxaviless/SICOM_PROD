const https = require('https');

function parseFirestoreValue(v) {
    if (v.stringValue !== undefined) return v.stringValue;
    if (v.integerValue !== undefined) return parseInt(v.integerValue);
    if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
    if (v.booleanValue !== undefined) return v.booleanValue;
    if (v.nullValue !== undefined) return null;
    if (v.mapValue !== undefined) {
        const out = {};
        const fields = v.mapValue.fields || {};
        for (const k in fields) {
            out[k] = parseFirestoreValue(fields[k]);
        }
        return out;
    }
    if (v.arrayValue !== undefined) {
        return (v.arrayValue.values || []).map(parseFirestoreValue);
    }
    return v;
}

const url = 'https://firestore.googleapis.com/v1/projects/sicom-stgt/databases/(default)/documents/artifacts/sicom-stgt/public/data/sicom_state/main';
https.get(url, res => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => {
        const json = JSON.parse(d);
        const data = {};
        for (const k in json.fields) {
            data[k] = parseFirestoreValue(json.fields[k]);
        }
        console.log("Firestore updateTime:", json.updateTime);
        const appData = data.appData || {};
        console.log("\n=== DIRECT PROJECTS ===");
        (appData.directProjects || []).forEach(p => {
            console.log(`- [${p.id}] ${p.name}`);
        });

        console.log("\n=== MODULES ===");
        (appData.modules || []).forEach(m => {
            console.log(`\nMÓDULO: [${m.id}] ${m.name} (color: ${m.color})`);
            const projs = m.projects || [];
            console.log(`  Proyectos (${projs.length}):`);
            projs.forEach(p => {
                console.log(`  - [${p.id}] ${p.name}`);
            });
        });
    });
});
