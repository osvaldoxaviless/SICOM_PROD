const fs = require('fs');
const assert = require('assert');

console.log('========================================================================');
console.log('AUDITORÍA AUTOMATIZADA V997: LIMPIEZA DE MENÚ, HERRAMIENTAS Y MANUAL');
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

// 1. Integración de Estructura del Mapa (Expandir / Colapsar) dentro de Filtros (#filterDrawer)
runTest('1. index.html & app.js: Estructura del mapa en drawer de filtros con sincronización reactiva', () => {
    assert(html.includes('id="advFilterToggleCollapseBtn"'), 'advFilterToggleCollapseBtn existe');
    assert(html.includes('id="advFilterCollapseText"'), 'advFilterCollapseText existe');
    assert(html.includes('onclick="toggleAllModulesCollapse()"'), 'Botón invoca toggleAllModulesCollapse()');
    assert(app.includes('advTxt = document.getElementById(\'advFilterCollapseText\')'), 'app.js localiza advFilterCollapseText');
    assert(app.includes('advBtn = document.getElementById(\'advFilterToggleCollapseBtn\')'), 'app.js localiza advFilterToggleCollapseBtn');
});

// 2. Speed dial izquierdo (#canvasToolsDock) retirado del lienzo y recenter reposicionado en esquina
runTest('2. index.html & app.js: canvasToolsDock oculto y botón centrar reposicionado a md:bottom-8 md:left-8', () => {
    assert(html.includes('id="canvasToolsDock" class="hidden'), 'canvasToolsDock tiene clase hidden');
    assert(html.includes('md:bottom-8 md:left-8'), 'canvasQuickControls reposicionado en esquina inferior izquierda en escritorio');
    assert(html.includes('id="btnQuickRecenterMap"'), 'btnQuickRecenterMap disponible en lienzo');
});

// 3. Menú de perfil móvil (#mobileMenuDropdown) sin duplicados y con Manual y Guía
runTest('3. index.html: Menú de perfil móvil limpio con Manual y Guía de Uso prominente', () => {
    assert(html.includes('id="mobileMenuBtnManual"'), 'mobileMenuBtnManual presente');
    assert(html.includes('openManual(); toggleMobileMenu()'), 'mobileMenuBtnManual invoca openManual()');
    assert(html.includes('Manual y Guía de Uso</span>'), 'Etiqueta legible de Manual y Guía de Uso');
    
    // Validar que las opciones duplicadas no están en el menú visible
    const visibleMenuPart = html.substring(html.indexOf('id="mobileMenuDropdown"'), html.indexOf('id="userProfilePillBtn"'));
    const hiddenBlock = visibleMenuPart.substring(visibleMenuPart.indexOf('class="hidden" aria-hidden="true"'), visibleMenuPart.indexOf('<!-- MANUAL Y GUÍA DE OPERACIÓN -->'));
    assert(hiddenBlock.includes('Centrar Mapa') && hiddenBlock.includes('Colapsar Módulos') && hiddenBlock.includes('Rol & Prenómina'), 'Elementos duplicados confinados al bloque aria-hidden para compatibilidad');
});

// 4. Panel de configuración (#configDrawer) con acceso directo al manual en escritorio
runTest('4. index.html: configDrawer cuenta con botón de Manual y Guía de Operación', () => {
    assert(html.includes('id="btnDrawerManual"'), 'btnDrawerManual presente en configDrawer');
    assert(html.includes('openManual()') && html.includes('title="Manual y Guía de Operación"'), 'btnDrawerManual invoca openManual()');
});

// 5. Contenido del manual actualizado con arquitectura v9 y navegación
runTest('5. app.js: openManual actualizado con filtros unificados, gestos móviles y dock de 5 accesos', () => {
    assert(app.includes('Explorar, Filtros y Modo Enfoque'), 'openManual documenta panel Explorar con filtros integrados');
    assert(app.includes('Estructura del Mapa'), 'openManual documenta colapso/expansión de módulos');
    assert(app.includes('Gestos Móviles & Centrar Mapa'), 'openManual documenta gestos Samsung/Android y botón de recenter');
});

// 6. Versión sincronizada en todo el sistema (v997)
runTest('6. Versión sincronizada 20261026_v997 en index.html, app.js y sw.js', () => {
    assert(html.includes('styles.css?v=20261026_v997'), 'index.html points to styles.css?v=20261026_v997');
    assert(html.includes('app.js?v=20261026_v997'), 'index.html points to app.js?v=20261026_v997');
    assert(sw.includes("SW_VERSION = '20261026_v997'"), 'sw.js SW_VERSION is 20261026_v997');
});

console.log('\n====================================================');
console.log(`RESULTADO FINAL: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);
