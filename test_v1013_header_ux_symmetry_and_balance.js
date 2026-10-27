/**
 * TEST SUITE V1013: HEADER UX BALANCE, SIMETRÍA Y COMPACTACIÓN
 * - Lado Izquierdo: [ 🗺️ Mapa | 📅 Calendario | 📋 Rol & Prenómina ] agrupados en #mainViewSwitcher
 * - Eliminación de duplicidad: #btnViewModePriority oculto en el header superior (disponible en la sub-pestaña)
 * - Centro: [ EO/SA ] Centrado absoluto, sin solapamientos
 * - Lado Derecho: [ 🔍 Buscador & Filtro ] + [ 📊 Dashboard ] + [ ⚙️ Centro de Control / Perfil Compacto ]
 * - Pantalla dividida / Split-screen: Diseño equilibrado y balanceado de ambos lados
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('AUDITORÍA AUTOMATIZADA V1013: BALANCE, SIMETRÍA Y DISTRIBUCIÓN DEL HEADER');
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

// 1. Integridad de Sintaxis
runTest('1. app.js y sw.js son sintácticamente válidos', () => {
    assert.doesNotThrow(() => { new Function(app); }, 'app.js no debe tener errores de sintaxis');
    assert.doesNotThrow(() => { new Function(sw); }, 'sw.js no debe tener errores de sintaxis');
});

// 2. Agrupación izquierda: Mapa + Calendario + Rol & Prenómina
runTest('2. Lado Izquierdo: #mainViewSwitcher contiene Mapa, Calendario y Rol & Prenómina', () => {
    const switcherRegex = /<div id="mainViewSwitcher"[^>]*>([\s\S]*?)<\/div>/;
    const match = html.match(switcherRegex);
    assert(match, 'Contenedor #mainViewSwitcher encontrado');
    const switcherContent = match[1];

    assert(switcherContent.includes('id="btnViewModeMap"'), 'Mapa está dentro de #mainViewSwitcher');
    assert(switcherContent.includes('id="btnViewModeTimeline"'), 'Calendario está dentro de #mainViewSwitcher');
    assert(switcherContent.includes('id="btnTopAttendanceModal"'), 'Rol & Prenómina está dentro de #mainViewSwitcher');
    assert(switcherContent.includes('openAttendanceModal()'), 'Botón Rol & Prenómina llama a openAttendanceModal()');
});

// 3. No duplicidad: Prioridades está oculto en header para evitar colisión con sub-pestaña
runTest('3. No duplicidad: #btnViewModePriority oculto en header para evitar saturación y redundancia', () => {
    const switcherMatch = html.match(/<div id="mainViewSwitcher"[^>]*>([\s\S]*?)<\/div>/);
    assert(switcherMatch, 'mainViewSwitcher presente');
    const prioBtnRegex = /<button[^>]+id="btnViewModePriority"[^>]*>/;
    const prioMatch = switcherMatch[1].match(prioBtnRegex);
    assert(prioMatch, 'btnViewModePriority preservado en DOM para scripts');
    assert(prioMatch[0].includes('hidden'), 'btnViewModePriority tiene clase hidden');
    assert(prioMatch[0].includes('display:none !important;'), 'btnViewModePriority tiene display:none !important');

    // Comprobar que en app.js setActiveTabStyle mantiene hidden
    assert(app.includes("btnPrio.style.setProperty('display', 'none', 'important')"), 'app.js asegura que btnPrio permanezca invisible');
});

// 4. Branding central EO/SA centrado sin solapamientos
runTest('4. Centro: Branding EO/SA con centrado absoluto y libre de colisiones', () => {
    assert(html.includes('header-branding-center'), 'header-branding-center presente');
    assert(html.includes('mobile-branding-center header-branding-center z-10'), 'Branding central z-10');
    assert(html.includes('EO<span class="text-[#ee6018] font-black text-[17px] mx-0.5">/</span>SA'), 'Logo EO/SA completo');
});

// 5. Lado Derecho: Buscador, Dashboard y Centro de Control compacto
runTest('5. Lado Derecho: Buscador, Dashboard y Centro de Control / Perfil situados a la derecha de EO/SA', () => {
    const brandingIdx = html.indexOf('header-branding-center');
    const searchIdx = html.indexOf('desktop-search-cluster');
    const dashboardIdx = html.indexOf('id="btnTopExecutiveDashboard"');
    const profileIdx = html.indexOf('id="userProfilePillBtn"');

    assert(brandingIdx > -1, 'Branding central existe');
    assert(searchIdx > brandingIdx, 'Buscador (.desktop-search-cluster) está a la derecha del branding central');
    assert(dashboardIdx > searchIdx, 'Dashboard está a la derecha del buscador');
    assert(profileIdx > dashboardIdx, 'Centro de Control / Perfil está en el extremo derecho');

    assert(html.includes('id="desktopSearchInput"'), 'desktopSearchInput presente');
    assert(html.includes('id="btnTopFilterDrawer"'), 'btnTopFilterDrawer presente');
});

// 6. Centro de Control / Perfil compacto para soportar Split-Screen
runTest('6. Centro de Control / Perfil compacto y adaptativo para split-screen', () => {
    const profileBtnMatch = html.match(/<button[^>]+id="userProfilePillBtn"[^>]*>([\s\S]*?)<\/button>/);
    assert(profileBtnMatch, 'userProfilePillBtn encontrado');
    const btnHtml = profileBtnMatch[0];

    assert(btnHtml.includes('id="connectionStatusDot"'), 'Dot de conexión presente');
    assert(btnHtml.includes('id="userAvatarInitials"'), 'Avatar de usuario presente');
    assert(btnHtml.includes('hidden xl:inline'), 'Texto CONSULTOR oculto en pantallas split (<1280px)');
    assert(btnHtml.includes('hidden 2xl:inline'), 'Texto Control oculto en pantallas split (<1536px)');
});

// 7. Sincronización de versión v1013
runTest('7. Sincronización de versión 20261027_v1013 en index.html y sw.js', () => {
    assert(html.includes('app.js?v=20261027_v1013'), 'index.html apunta a app.js?v=20261027_v1013');
    assert(sw.includes("const SW_VERSION = '20261027_v1013';"), 'sw.js tiene SW_VERSION = 20261027_v1013');
});

console.log('\n========================================================================');
console.log('✅ TODAS LAS PRUEBAS V1013 PASARON EXITOSAMENTE CON 100% DE INTEGRIDAD.');
console.log('========================================================================');
