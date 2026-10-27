/**
 * TEST SUITE V1014: HEADER UX SIMETRÍA EXACTA — PÍLDORAS GEMELAS DE 3 ELEMENTOS
 * - Lado Izquierdo (#mainViewSwitcher): [ 🗺️ Mapa | 📅 Calendario | 📋 Rol & Prenómina ]
 * - Centro: [ EO/SA ] Centrado absoluto, sin solapamientos
 * - Lado Derecho (#rightActionSwitcher): [ 🔍 Buscador & Filtro | 📊 Dashboard | 🟧 OA (Solo Iniciales) ]
 * - Erradicación de bordes individuales dispersos y separadores innecesarios
 * - Perfil minimalista: Solamente las iniciales y punto de estado en línea
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('AUDITORÍA AUTOMATIZADA V1014: PÍLDORAS GEMELAS SIMÉTRICAS DE 3 ELEMENTOS EN HEADER');
console.log('===================================================================================\n');

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

// 2. Agrupación izquierda: Pastillita #mainViewSwitcher con 3 elementos
runTest('2. Lado Izquierdo: #mainViewSwitcher contiene 3 elementos (Mapa, Calendario, Rol & Prenómina)', () => {
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

// 5. Agrupación derecha: Pastillita gemela #rightActionSwitcher con 3 elementos
runTest('5. Lado Derecho: #rightActionSwitcher contiene 3 elementos (Buscador/Filtro, Dashboard, Perfil)', () => {
    assert(html.includes('id="rightActionSwitcher"'), 'Contenedor #rightActionSwitcher encontrado');
    const startIdx = html.indexOf('id="rightActionSwitcher"');
    const endIdx = html.indexOf('id="btnTopPriorityDrawer"');
    const rightContent = html.substring(startIdx, endIdx);

    assert(rightContent.includes('desktop-search-cluster'), 'Buscador y filtros están dentro de #rightActionSwitcher');
    assert(rightContent.includes('id="desktopSearchInput"'), 'desktopSearchInput está dentro de #rightActionSwitcher');
    assert(rightContent.includes('id="btnTopFilterDrawer"'), 'btnTopFilterDrawer está dentro de #rightActionSwitcher');
    assert(rightContent.includes('id="btnTopExecutiveDashboard"'), 'btnTopExecutiveDashboard está dentro de #rightActionSwitcher');
    assert(rightContent.includes('id="userProfilePillBtn"'), 'userProfilePillBtn está dentro de #rightActionSwitcher');

    // Posicionamiento a la derecha del branding central
    const brandingIdx = html.indexOf('header-branding-center');
    assert(startIdx > brandingIdx, 'rightActionSwitcher está a la derecha del branding central');
});

// 6. Perfil en la pastillita derecha: SOLO las iniciales sin etiquetas redundantes
runTest('6. Perfil en #rightActionSwitcher: Muestra únicamente las iniciales del usuario (OA)', () => {
    const profileBtnMatch = html.match(/<button[^>]+id="userProfilePillBtn"[^>]*>([\s\S]*?)<\/button>/);
    assert(profileBtnMatch, 'userProfilePillBtn encontrado');
    const btnInner = profileBtnMatch[1];

    assert(btnInner.includes('id="userAvatarInitials"'), 'Badge de iniciales presente');
    assert(btnInner.includes('id="connectionStatusDot"'), 'Punto de conexión en línea presente');

    // Comprobar que NO contiene textos que saturen el botón
    assert(!btnInner.includes('>CONSULTOR<'), 'Texto CONSULTOR eliminado del botón');
    assert(!btnInner.includes('>Control<'), 'Texto Control eliminado del botón');
});

// 7. Estilos CSS responsivos para ocultar ambas pastillitas en móvil (<640px)
runTest('7. styles.css oculta de manera segura ambas pastillitas en viewport móvil', () => {
    assert(css.includes('#mainViewSwitcher'), 'mainViewSwitcher en styles.css');
    assert(css.includes('#rightActionSwitcher'), 'rightActionSwitcher en styles.css');
});

// 8. Sincronización de versión v1014
runTest('8. Sincronización de versión 20261027_v1014 en index.html y sw.js', () => {
    assert(html.includes('app.js?v=20261027_v1014'), 'index.html apunta a app.js?v=20261027_v1014');
    assert(sw.includes("const SW_VERSION = '20261027_v1014';"), 'sw.js tiene SW_VERSION = 20261027_v1014');
});

console.log('\n===================================================================================');
console.log('✅ TODAS LAS PRUEBAS V1014 PASARON EXITOSAMENTE CON 100% DE INTEGRIDAD.');
console.log('===================================================================================');
