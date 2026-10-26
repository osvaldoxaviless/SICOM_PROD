/**
 * TEST SUITE V999: ARQUITECTURA DE SIMETRÍA EN 3 ZONAS PARA BARRA SUPERIOR
 * - Zona Izquierda: [ Vistas Mapa | Prioridades | Calendario ] + [ Buscador (Ctrl+K) | Filtros ]
 * - Zona Centro: [ EO/SA ] Centrado absoluto, sin solapamientos, con amplio margen
 * - Zona Derecha: [ Dashboard & Auditoría ] + [ Rol & Prenómina ] + [ Perfil / Control ]
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('AUDITORÍA AUTOMATIZADA V999: SIMETRÍA DE 3 ZONAS EN BARRA SUPERIOR');
console.log('=================================================================\n');

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

// 1. Simetría de 3 Zonas: Buscador y Filtros a la izquierda del branding central
runTest('1. Simetría de 3 Zonas: Buscador y Filtros ubicados a la izquierda de EO/SA', () => {
    assert(html.includes('id="mainViewSwitcher"'), 'mainViewSwitcher presente');
    assert(html.includes('desktop-search-cluster'), 'desktop-search-cluster presente');
    assert(html.includes('id="desktopSearchInput"'), 'desktopSearchInput presente');
    assert(html.includes('id="btnTopFilterDrawer"'), 'btnTopFilterDrawer presente');

    const viewsIdx = html.indexOf('id="mainViewSwitcher"');
    const searchIdx = html.indexOf('desktop-search-cluster');
    const brandingIdx = html.indexOf('header-branding-center');

    assert(viewsIdx < searchIdx, 'Las vistas de mapa preceden al buscador en el bloque izquierdo');
    assert(searchIdx < brandingIdx, 'El buscador y filtros están a la izquierda de EO/SA (Cero solapamiento)');
});

// 2. Zona Centro: EO/SA centrado con amplio respiro
runTest('2. Zona Centro: Branding EO/SA con centrado absoluto y libre de elementos solapados', () => {
    assert(html.includes('header-branding-center'), 'header-branding-center presente');
    assert(html.includes('left-1/2 -translate-x-1/2'), 'Centrado 50% con transformación');
    assert(css.includes('.header-branding-center') && css.includes('.desktop-left-branding'), 'CSS define reglas de centrado');
});

// 3. Zona Derecha: Dashboard, Rol & Prenómina y Perfil a la derecha de EO/SA
runTest('3. Zona Derecha: Dashboard, Rol & Prenómina y Perfil situados a la derecha de EO/SA', () => {
    assert(html.includes('id="btnTopExecutiveDashboard"'), 'btnTopExecutiveDashboard presente');
    assert(html.includes('id="btnTopAttendanceModal"'), 'btnTopAttendanceModal presente');
    assert(html.includes('id="userProfilePillBtn"'), 'userProfilePillBtn presente');

    const brandingIdx = html.indexOf('header-branding-center');
    const dashboardIdx = html.indexOf('id="btnTopExecutiveDashboard"');
    const attendanceIdx = html.indexOf('id="btnTopAttendanceModal"');
    const profileIdx = html.indexOf('id="userProfilePillBtn"');

    assert(brandingIdx < dashboardIdx, 'Dashboard se sitúa a la derecha de EO/SA');
    assert(dashboardIdx < attendanceIdx, 'Rol & Prenómina se sitúa a la derecha de Dashboard');
    assert(attendanceIdx < profileIdx, 'Perfil se sitúa en el extremo derecho');
});

// 4. Perfil Popover unificado: Funciona en móvil y escritorio
runTest('4. Menú de Perfil Popover: accesible tanto en escritorio (#userProfilePillBtn) como en móvil', () => {
    assert(html.includes('id="mobileMenuDropdown"'), 'mobileMenuDropdown presente');
    assert(/<button[^>]+id="userProfilePillBtn"[^>]+onclick="toggleMobileMenu\(event\)"/.test(html), 'userProfilePillBtn invoca toggleMobileMenu(event)');
    assert(app.includes("e.target.closest('#userProfilePillBtn')"), 'app.js no cierra prematuramente al hacer click en el botón de perfil');
});

// 5. Sincronización de versión v999/v1000
runTest('5. Sincronización de versión 20261026_v999/v1000 en index.html y sw.js', () => {
    assert(/styles\.css\?v=20261026_v(999|1000)/.test(html), 'styles.css apunta a v999/v1000 en index.html');
    assert(/app\.js\?v=20261026_v(999|1000)/.test(html), 'app.js apunta a v999/v1000 en index.html');
    assert(/SW_VERSION = '20261026_v(999|1000)'/.test(sw), 'SW_VERSION es v999/v1000 en sw.js');
});

console.log('\n====================================================');
console.log('TODAS LAS PRUEBAS V999 PASARON SATISFACTORIAMENTE.');
