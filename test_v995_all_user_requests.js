const fs = require('fs');
const assert = require('assert');

console.log('========================================================================');
console.log('AUDITORÍA AUTOMATIZADA: REQUERIMIENTOS V995 (EXPLORAR, GESTOS, ROL & PWA)');
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

// 1. Explorar: 2 botones en el footer (Limpiar filtros a la izq, Buscar a la der que regresa al mapa)
runTest('1. index.html & app.js: Explorar tiene 2 botones (Limpiar Filtros y Buscar) y applyFiltersAndGoToMap', () => {
    assert(html.includes('resetAdvFilters()') && html.includes('Limpiar Filtros'), 'Botón Limpiar Filtros presente');
    assert(html.includes('btnFilterApplyAndSearch') && html.includes('window.applyFiltersAndGoToMap()'), 'Botón Buscar presente en filterDrawer');
    assert(html.includes('Buscar</span>'), 'Texto Buscar en botón primario');
    assert(app.includes('window.applyFiltersAndGoToMap = function()'), 'applyFiltersAndGoToMap expuesto en app.js');
    assert(app.includes("window.switchMainWorkspaceView('map')"), 'applyFiltersAndGoToMap conmuta a vista de mapa');
    assert(app.includes('window.closeFilterDrawer()'), 'applyFiltersAndGoToMap cierra el drawer');
});

// 2. Gestos Android / Samsung S24 Ultra & History API
runTest('2. app.js: Gestión de gestos Android (Samsung S24 Ultra) con pushNavigationState y popstate', () => {
    assert(app.includes('window.pushNavigationState = function(stateName)'), 'pushNavigationState definido');
    assert(app.includes('window.initNavigationGestures = function()'), 'initNavigationGestures definido');
    assert(app.includes("window.addEventListener('popstate'"), 'popstate listener configurado');
    assert(app.includes('closeFilterDrawer()') && app.includes('closeDailyDrawer()') && app.includes('closeConfigDrawer()'), 'popstate cierra cajones');
    assert(app.includes('closeAttendanceModal()'), 'popstate cierra modal de asistencia');
    assert(app.includes('closeInfoCardSafe()'), 'popstate cierra ficha infoCard');
    assert(app.includes("switchMainWorkspaceView('map')"), 'popstate regresa a mapa desde calendario/prioridades');
});

// 3. Integración de pushNavigationState en flujos clave
runTest('3. app.js: pushNavigationState invocado al abrir cajones, modales y cambiar de vista', () => {
    assert(app.includes("window.pushNavigationState('filterDrawer')"), 'pushNavigationState en filterDrawer');
    assert(app.includes("window.pushNavigationState('dailyDrawer')"), 'pushNavigationState en dailyDrawer');
    assert(app.includes("window.pushNavigationState('configDrawer')"), 'pushNavigationState en configDrawer');
    assert(app.includes("window.pushNavigationState('attendanceModal')"), 'pushNavigationState en attendanceModal');
    assert(app.includes("window.pushNavigationState('infoCard')"), 'pushNavigationState en infoCard');
    assert(app.includes("window.pushNavigationState('view_' + mode)"), 'pushNavigationState en switchMainWorkspaceView');
});

// 4. Modal de Rol & Prenómina: Fit vertical perfecto sin cortes en cabecera ni pie
runTest('4. styles.css & index.html: Rol & Prenómina no se corta arriba ni abajo y muestra validación', () => {
    assert(css.includes('#attendanceModal {') && css.includes('bottom: calc(56px + env(safe-area-inset-bottom, 0px)) !important;'), 'attendanceModal fijado sobre dock');
    assert(css.includes('align-items: stretch !important;'), 'attendanceModal estirado verticalmente sin desplazar cabecera');
    assert(css.includes('#attendanceModal > div') && css.includes('height: 100% !important;'), 'attendanceModal div ocupa 100%');
    assert(html.includes('id="attPermNotice"'), 'attPermNotice presente en index.html');
    assert(!html.includes('attPermNotice" class="text-[#8a8380] text-[9.5px] truncate"'), 'attPermNotice ya no sufre truncate agresivo en móvil');
    assert(html.includes('scrollbar-none whitespace-nowrap'), 'Leyenda de asistencia en tira desplazable sin ocupar 3 filas');
});

// 5. Persistencia de vista en recargas y defensas en Calendario y Prioridades
runTest('5. app.js & index.html: Persistencia de vista en sessionStorage y render defensivo', () => {
    assert(html.includes("sessionStorage.setItem('sicom_active_view_mode', mainWorkspaceViewMode)"), 'controllerchange guarda la vista activa');
    assert(app.includes("sessionStorage.setItem('sicom_active_view_mode', mode)"), 'switchMainWorkspaceView guarda modo en sessionStorage');
    assert(app.includes('restorePreviousViewMode'), 'app.js restaura vista previa en arranque');
    assert(app.includes('window.renderPriorityBoard = function()') && app.includes('try {'), 'renderPriorityBoard envuelto en try/catch');
    assert(app.includes('window.renderCalendarView = function()') && app.includes('try {'), 'renderCalendarView envuelto en try/catch');
});

// 6. Dock Móvil: Sigue visible permanentemente en todas las pantallas
runTest('6. styles.css & index.html: Dock inferior móvil z-[100000] y despejes garantizados', () => {
    assert(css.includes('#mobileBottomDock {\n    z-index: 100000 !important;\n}'), 'Dock móvil en z-100000');
    assert(css.includes('#timelineBoardView,\n    #priorityBoardView {\n        bottom: calc(56px + env(safe-area-inset-bottom, 0px)) !important;'), 'Vistas de entrega despejan el dock');
});

// 7. Versión v995 sincronizada en todo el sistema
runTest('7. Versión v995 sincronizada en index.html, styles.css, app.js y sw.js', () => {
    assert(html.includes('styles.css?v=20261026_v995'), 'index.html points to styles.css v995');
    assert(html.includes('app.js?v=20261026_v995'), 'index.html points to app.js v995');
    assert(sw.includes("SW_VERSION = '20261026_v995'"), 'sw.js SW_VERSION is 20261026_v995');
});

console.log('\n====================================================');
console.log(`RESULTADO FINAL: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);
