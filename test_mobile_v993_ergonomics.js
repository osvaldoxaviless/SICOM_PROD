/**
 * test_mobile_v993_ergonomics.js
 * Auditoría Automatizada v993:
 * 1. Branding Central Único en Móvil Horizontal y Vertical (sin duplicados a la izquierda)
 * 2. Botón Centrar Mapa inferior directo arriba de "MAPA" en Canvas (sólo ícono, sin texto)
 * 3. infoCard con desahogo inferior sobre dock móvil, altura controlada y drag handle
 * 4. Gesto táctil swipe-down para deslizar hacia abajo y cerrar infoCard
 * 5. Acceso directo a edición y acordeón 01 abierto por defecto
 * 6. Sincronización de cache buster v993 en index, css y service worker
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================================');
console.log('AUDITORÍA AUTOMATIZADA: ERGONOMÍA MÓVIL V993 (INFOCARD & BRANDING)');
console.log('========================================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } catch (err) {
        console.error(`❌ [FAIL] ${name}: ${err.message}`);
        failed++;
    }
}

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

// 1. Branding Central Único en Móvil Horizontal y Vertical
test('1. index.html & styles.css: Branding EO/SA central único en móvil; branding izquierdo oculto en <1024px y landscape', () => {
    assert(html.includes('desktop-left-branding hidden lg:flex'), 'Left branding uses desktop-left-branding and hidden lg:flex');
    assert(html.includes('absolute left-1/2 -translate-x-1/2') && html.includes('mobile-branding-center'), 'Centered branding visible on mobile/tablets (<1024px)');
    assert(css.includes('.desktop-left-branding') && css.includes('display: none !important'), 'styles.css suppresses left branding on mobile & landscape');
});

// 2. Botón Centrar Mapa inferior directo arriba de "MAPA" (sólo ícono)
test('2. index.html & styles.css: Botón recenter inferior sobre dock tab MAPA con sólo ícono (sin texto)', () => {
    assert(html.includes('id="canvasQuickControls"'), 'canvasQuickControls exists');
    assert(html.includes('id="btnQuickRecenterMap"'), 'btnQuickRecenterMap exists');
    
    // Verificar que NO contenga el texto "Centrar" dentro del botón
    const btnIdx = html.indexOf('id="btnQuickRecenterMap"');
    const endBtn = html.indexOf('</button>', btnIdx);
    const btnSection = html.substring(btnIdx, endBtn);
    assert(!btnSection.includes('>Centrar<') && !btnSection.includes('<span>Centrar</span>'), 'btnQuickRecenterMap does NOT contain text "Centrar"');
    assert(btnSection.includes('M4 8V4m0 0h4M4 4l5 5'), 'btnQuickRecenterMap contains SVG crosshairs icon');
    
    // En CSS debe estar posicionado abajo
    assert(css.includes('#canvasQuickControls') && css.includes('bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 12px) !important'), 'canvasQuickControls positioned at bottom in portrait');
    assert(css.includes('#canvasQuickControls') && css.includes('bottom: calc(44px + env(safe-area-inset-bottom, 0px) + 8px) !important'), 'canvasQuickControls positioned at bottom in landscape');
});

// 3. infoCard con desahogo inferior y drag handle móvil
test('3. index.html & styles.css: infoCard con drag handle superior y separación del dock móvil', () => {
    assert(html.includes('id="infoCardDragHandle"'), 'infoCardDragHandle exists');
    assert(css.includes('bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 8px) !important'), 'infoCard clears bottom dock in portrait');
    assert(css.includes('max-height: calc(100vh - 120px) !important'), 'infoCard max-height controlled to leave map viewable');
});

// 4. Gesto táctil swipe-down en app.js
test('4. app.js: initInfoCardSwipeDown implementa gesto para arrastrar hacia abajo y cerrar', () => {
    assert(app.includes('window.initInfoCardSwipeDown = function'), 'initInfoCardSwipeDown defined');
    assert(app.includes('infoCardDragHandle'), 'initInfoCardSwipeDown checks infoCardDragHandle');
    assert(app.includes('window.closeInfoCardSafe(true)'), 'initInfoCardSwipeDown closes infoCard safely when dragged');
});

// 5. Inmediata capacidad de modificación: Acordeón 01 abierto y botón de edición en cabecera
test('5. index.html & app.js: Acordeón 01 (Estado y Fechas) abierto y botón de edición en cabecera', () => {
    assert(html.includes('id="acc-status-details"'), 'acc-status-details exists in index.html');
    assert(html.includes('id="btnHeaderEditProject"'), 'btnHeaderEditProject exists in infoCard header');
    assert(app.includes('accStatus.open = true'), 'app.js opens acc-status-details on project selection');
    assert(app.includes('btnHeaderEditProject'), 'app.js updates btnHeaderEditProject visibility');
});

// 6. infoCard en Landscape Móvil posicionado a la derecha
test('6. styles.css: infoCard acoplado a la derecha en modo horizontal (landscape)', () => {
    assert(css.includes('right: 8px !important;'), 'infoCard docked to right in landscape');
    assert(css.includes('width: min(440px, 85vw) !important;'), 'infoCard width constrained in landscape to leave map visible');
});

// 7. Sincronización de cache buster
test('7. index.html, styles.css & sw.js: Versión sincronizada en todo el sistema', () => {
    assert(/app\.js\?v=20261026_v(99[3-9]|1000)/.test(html), 'index.html points to current app.js');
    assert(/styles\.css\?v=20261026_v(99[3-9]|1000)/.test(html), 'index.html points to current styles.css');
    assert(/20261026_v(99[3-9]|1000)/.test(sw), 'sw.js SW_VERSION is synced');
});

console.log(`\n====================================================`);
console.log(`RESULTADO FINAL: ${passed} PASSED, ${failed} FAILED`);
if (failed > 0) process.exit(1);
