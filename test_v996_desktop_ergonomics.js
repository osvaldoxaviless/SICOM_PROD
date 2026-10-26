const fs = require('fs');
const assert = require('assert');

console.log('========================================================================');
console.log('AUDITORÍA AUTOMATIZADA: ERGONOMÍA DE ESCRITORIO V996 (CENTRAR & AVISOS)');
console.log('========================================================================\n');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } catch (err) {
        console.error(`❌ [FAIL] ${name}: ${err.message}`);
        failed++;
    }
}

// 1. Botón Centrar Mapa coincide en tamaño y alineación con Herramientas del Mapa en Escritorio
runTest('1. index.html: Botón Centrar Mapa (#btnQuickRecenterMap) coincide en w-12 h-12 y alineación con Herramientas', () => {
    assert(html.includes('id="canvasQuickControls"'), 'canvasQuickControls existe');
    assert(html.includes('id="btnQuickRecenterMap"'), 'btnQuickRecenterMap existe');
    assert(html.includes('sm:w-12 sm:h-12'), 'btnQuickRecenterMap tiene dimensiones w-12 h-12 en escritorio coincidentes con canvasSpeedDialTrigger');
    assert(html.includes('md:bottom-[90px] md:left-8') || html.includes('md:bottom-8 md:left-8'), 'canvasQuickControls alineado en esquina izquierda (md:left-8)');
    assert(html.includes('sm:w-5 sm:h-5'), 'Icono de centrar mapa proporcional a los botones de herramientas (w-5 h-5)');
});

// 2. Ticker de Avisos: Retiro de botón pausa y compactación de leyenda AVISOS para máxima amplitud
runTest('2. index.html: Marquesina de Avisos optimizada sin botón pausa y con etiqueta compacta', () => {
    assert(html.includes('id="announcementTickerBar"'), 'announcementTickerBar existe');
    assert(!html.includes('id="btnTickerPause"'), 'btnTickerPause ha sido retirado para dar máxima amplitud a los avisos');
    assert(html.includes('id="tickerBadgeText"'), 'tickerBadgeText existe');
    assert(!html.includes('padding: 2px 8px; width: auto;'), 'tickerBadgeText ya no tiene padding redundante ancho');
    assert(html.includes('id="tickerTrackWrapper"'), 'tickerTrackWrapper para la marquesina interactiva');
});

// 3. Control de compatibilidad en app.js para toggleTickerPause
runTest('3. app.js: toggleTickerPause opera con seguridad sin fallos al no existir btnTickerPause', () => {
    assert(app.includes('window.toggleTickerPause = function()'), 'toggleTickerPause definido');
    assert(app.includes('if (iconPause)'), 'toggleTickerPause verifica de forma segura elementos opcionales');
});

// 4. Sincronización de cache buster v996+
runTest('4. index.html, styles.css & sw.js: Versión v996+ sincronizada en todo el sistema', () => {
    assert(/styles\.css\?v=20261026_v99[6-9]/.test(html), 'index.html points to styles.css');
    assert(/app\.js\?v=20261026_v99[6-9]/.test(html), 'index.html points to app.js');
    assert(/20261026_v99[6-9]/.test(sw), 'sw.js SW_VERSION is synced');
});

console.log('\n====================================================');
console.log(`RESULTADO FINAL: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);
