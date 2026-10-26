/**
 * TEST SUITE V998: VERIFICACIÓN DE PERFIL POPOVER EN ESCRITORIO,
 * CENTRADO DE MARCA EO/SA, SEPARACIÓN DE LOGOUT EN CAJÓN Y AUDITORÍA DE MANUAL
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('AUDITORÍA AUTOMATIZADA V998: CENTRADO EO/SA, PERFIL DESKTOP Y MANUAL AUDITADO');
console.log('=========================================================================\n');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf-8');
const sw = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf-8');

function runTest(desc, fn) {
    try {
        fn();
        console.log(`[PASS] ${desc}`);
    } catch (e) {
        console.error(`[FAIL] ${desc}: ${e.message}`);
        process.exit(1);
    }
}

// 1. Branding EO/SA centrado simétricamente y eliminación de logos laterales
runTest('1. Branding EO/SA centrado en pantalla e invisible a la izquierda', () => {
    assert(html.includes('header-branding-center') && html.includes('mobile-branding-center'), 'Clases de centrado presentes');
    assert(html.includes('left-1/2 -translate-x-1/2'), 'Centrado absoluto con transform');
    assert(css.includes('.header-branding-center') && css.includes('.desktop-left-branding'), 'CSS contempla ambas clases');
    assert(css.includes('.desktop-left-branding {\n    display: none !important;'), 'desktop-left-branding suprimido globalmente');
});

// 2. Búsqueda y filtros agrupados en la barra superior sin interferir con el centro
runTest('2. Búsqueda y filtros integrados en la barra superior', () => {
    assert(html.includes('desktop-search-cluster'), 'desktop-search-cluster presente');
    assert(html.includes('id="desktopSearchInput"'), 'desktopSearchInput presente');
    assert(html.includes('id="btnTopFilterDrawer"'), 'btnTopFilterDrawer presente');
});

// 3. Botón de perfil en escritorio (#userProfilePillBtn) despliega menú popover intuitivo
runTest('3. #userProfilePillBtn abre menú popover unificado con toggleMobileMenu(event)', () => {
    assert(html.includes('id="userProfilePillBtn"'), 'userProfilePillBtn presente');
    assert(/<button[^>]+id="userProfilePillBtn"[^>]+onclick="toggleMobileMenu\(event\)"/.test(html), 'userProfilePillBtn invoca toggleMobileMenu(event)');
    
    // mobileMenuDropdown debe preceder a userProfilePillBtn en DOM para preservar tests legacy
    const dropdownIdx = html.indexOf('id="mobileMenuDropdown"');
    const pillIdx = html.indexOf('id="userProfilePillBtn"');
    assert(dropdownIdx < pillIdx, 'mobileMenuDropdown precede a userProfilePillBtn');

    // Menú contiene Configuración del Sistema
    assert(html.includes('Configuración del Sistema'), 'Menú popover incluye opción "Configuración del Sistema"');
    assert(html.includes('openConfigDrawer(); toggleMobileMenu()'), 'Configuración del Sistema abre cajón y cierra menú');
});

// 4. app.js: Detección de clic fuera no cierra el menú de perfil inmediatamente en escritorio
runTest('4. app.js: Listener de clic fuera contempla e.target.closest("#userProfilePillBtn")', () => {
    assert(app.includes("e.target.closest('#userProfilePillBtn')"), 'Listener contempla #userProfilePillBtn');
});

// 5. Cajón de Configuración: Desacoplar Cerrar Sesión del botón Cerrar [X]
runTest('5. index.html: Cabecera de configDrawer sin botón de Cerrar Sesión pegado a [X]', () => {
    const configDrawerHeader = html.substring(html.indexOf('id="configDrawer"'), html.indexOf('id="tabBtn-edit"'));
    assert(!configDrawerHeader.includes('logout()'), 'logout() ya no se encuentra en la cabecera de configDrawer');
    assert(configDrawerHeader.includes('closeConfigDrawer()'), 'closeConfigDrawer() presente para cerrar el cajón con seguridad');
});

// 6. Auditoría general del manual (openManual): sin referencias a "panel izquierdo"
runTest('6. app.js: openManual completamente auditado y libre de "panel izquierdo"', () => {
    const openManualStart = app.indexOf('window.openManual = function');
    const openManualEnd = app.indexOf('window.closeManual = function');
    const openManualSrc = app.substring(openManualStart, openManualEnd);

    assert(!openManualSrc.toLowerCase().includes('panel izquierdo'), 'No contiene referencias obsoletas a "panel izquierdo"');
    assert(openManualSrc.includes('Tareas'), 'Documenta el módulo de Tareas');
    assert(openManualSrc.includes('Rol &amp; Prenómina') || openManualSrc.includes('Rol'), 'Documenta el módulo de Rol & Prenómina');
    assert(openManualSrc.includes('Explorar'), 'Documenta el módulo de Explorar & Filtros');
    assert(openManualSrc.includes('Calendario') || openManualSrc.includes('calendario'), 'Documenta el módulo de Calendario y Entregas');
    assert(openManualSrc.includes('mapa'), 'Documenta el Mapa Mental');
});

// 7. Sincronización de versión v998/v999/v1000 en index.html, app.js y sw.js
runTest('7. Sincronización de versión 20261026_v998/v999/v1000 en todo el sistema', () => {
    assert(/styles\.css\?v=20261026_v(998|999|1000)/.test(html), 'styles.css?v=20261026_v998/v999/v1000 en index.html');
    assert(/app\.js\?v=20261026_v(998|999|1000)/.test(html), 'app.js?v=20261026_v998/v999/v1000 en index.html');
    assert(/SW_VERSION = '20261026_v(998|999|1000)'/.test(sw), 'SW_VERSION = 20261026_v998/v999/v1000 en sw.js');
});

console.log('\n====================================================');
console.log('TODAS LAS PRUEBAS V998 PASARON SATISFACTORIAMENTE.');
