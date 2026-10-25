const fs = require('fs');
const assert = require('assert');

console.log('========================================================================');
console.log('AUDITORÍA AUTOMATIZADA: PWA INSTALLABILITY & SERVICE WORKER (SICOM)');
console.log('========================================================================\n');

let passed = 0;
function test(name, fn) {
    try {
        fn();
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } catch (e) {
        console.error(`❌ [FAIL] ${name}:`, e.message);
        process.exit(1);
    }
}

const manifestRaw = fs.readFileSync('manifest.json', 'utf8');
const manifest = JSON.parse(manifestRaw);
const sw = fs.readFileSync('sw.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

// 1. Manifest
test('1. manifest.json: es JSON válido con display standalone y start_url "/"', () => {
    assert.strictEqual(manifest.display, 'standalone');
    assert.strictEqual(manifest.start_url, '/');
    assert.strictEqual(manifest.id, '/');
});

test('2. manifest.json: posee íconos PNG requeridos (192px y 512px) y maskable', () => {
    assert(Array.isArray(manifest.icons) && manifest.icons.length >= 4, 'Debe tener al menos 4 íconos');
    const has192 = manifest.icons.some(i => i.sizes === '192x192' && i.type === 'image/png');
    const has512 = manifest.icons.some(i => i.sizes === '512x512' && i.type === 'image/png');
    const hasMaskable = manifest.icons.some(i => i.purpose && i.purpose.includes('maskable'));
    assert(has192, 'Debe incluir ícono PNG 192x192');
    assert(has512, 'Debe incluir ícono PNG 512x512');
    assert(hasMaskable, 'Debe incluir ícono maskable');
});

test('3. Archivos físicos de íconos: existen en disco y tienen tamaño mayor a 0 bytes', () => {
    const files = ['icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'icon.svg'];
    files.forEach(f => {
        assert(fs.existsSync(f), `Falta archivo ${f}`);
        assert(fs.statSync(f).size > 0, `Archivo ${f} está vacío`);
    });
});

// 2. Service Worker
test('4. sw.js: implementa listener "fetch" obligatorio para criterio de instalación Chromium', () => {
    assert(sw.includes("addEventListener('fetch'"), 'Falta listener fetch en sw.js');
    assert(sw.includes("caches.match"), 'Falta fallback caches.match en sw.js');
});

test('5. sw.js: implementa precaching de recursos esenciales y ciclo de vida (install/activate)', () => {
    assert(sw.includes("addEventListener('install'"), 'Falta install listener');
    assert(sw.includes("addEventListener('activate'"), 'Falta activate listener');
    assert(sw.includes("icon-192.png"), 'Falta icon-192 en precache');
    assert(sw.includes("icon-512.png"), 'Falta icon-512 en precache');
});

// 3. index.html
test('6. index.html: enlaza manifest.json, íconos PNG y apple-touch-icon', () => {
    assert(html.includes('<link rel="manifest" href="manifest.json">'), 'Falta link manifest');
    assert(html.includes('href="icon-192.png"'), 'Falta link icon-192');
    assert(html.includes('href="icon-512.png"'), 'Falta link icon-512');
    assert(html.includes('<link rel="apple-touch-icon" href="icon-192.png">'), 'Falta apple-touch-icon');
});

test('7. index.html: registra Service Worker de inmediato en el arranque', () => {
    assert(html.includes("navigator.serviceWorker.register('/sw.js'"), 'Falta registro temprano de SW');
});

test('8. index.html: posee botón de instalación en menú móvil y en pantalla de login', () => {
    assert(html.includes('id="mobileBtnInstallPwa"'), 'Falta botón de instalación en menú 3 puntos');
    assert(html.includes('id="loginPwaInstallContainer"'), 'Falta acceso rápido de instalación en login');
});

test('9. index.html: incluye modal de guía asistida #pwaInstallGuideModal para Android y iOS', () => {
    assert(html.includes('id="pwaInstallGuideModal"'), 'Falta modal de guía PWA');
    assert(html.includes('Google Chrome (Android)'), 'Falta guía Chrome Android');
    assert(html.includes('Safari (iPhone / iPad)'), 'Falta guía Safari iOS');
});

// 4. app.js
test('10. app.js: gestiona evento beforeinstallprompt, triggerPwaInstall y appinstalled', () => {
    assert(app.includes("addEventListener('beforeinstallprompt'"), 'Falta listener beforeinstallprompt');
    assert(app.includes("addEventListener('appinstalled'"), 'Falta listener appinstalled');
    assert(app.includes("window.triggerPwaInstall"), 'Falta window.triggerPwaInstall');
    assert(app.includes("window.openPwaInstallGuideModal"), 'Falta window.openPwaInstallGuideModal');
});

console.log(`\n====================================================`);
console.log(`RESULTADO DE AUDITORÍA: ${passed} PASSED, 0 FAILED`);
console.log(`====================================================`);
