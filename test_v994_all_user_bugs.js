/**
 * test_v994_all_user_bugs.js
 * Auditoría Automatizada v994:
 * 1. Calendario: Fit completo de cuadrícula mensual (sin corte de días 26-31) y desahogo de cabecera en móvil
 * 2. Supresión absoluta de la pastilla de filtro (#activeFilterPill) en Calendario y Prioridades
 * 3. Dock Inferior Móvil Permanente (z-[100000]) visible siempre en Mapa, Calendario, Explorar, Tareas y Rol
 * 4. Cajones y Modal de Rol con desahogo superior al Dock móvil en portrait y landscape
 * 5. Matriz General de Asistencia: nombres de equipo compactados en móvil para visibilidad de los días
 * 6. Sincronización de cache buster v994 en index, css y service worker
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================================');
console.log('AUDITORÍA AUTOMATIZADA: ERGONOMÍA INTEGRAL V994 (DOCK & CALENDARIO)');
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

// 1. Calendario: Desahogo inferior y distribución de cuadrícula mensual
test('1. styles.css & app.js: #timelineBoardView tiene desahogo inferior sobre el dock y filas distribuidas', () => {
    assert(css.includes('#timelineBoardView') && css.includes('bottom: calc(56px + env(safe-area-inset-bottom, 0px)) !important'), 'timelineBoardView clears bottom dock in portrait');
    assert(css.includes('#timelineBoardView') && css.includes('bottom: calc(44px + env(safe-area-inset-bottom, 0px)) !important'), 'timelineBoardView clears bottom dock in landscape');
    assert(app.includes('grid-template-rows: repeat(${numRows}, minmax(0, 1fr))'), 'Calendar month grid distributes rows equally');
});

// 2. Cabecera de Calendario: Fit en móvil sin desbordes ni botones redundantes
test('2. index.html: Cabecera de Calendario optimizada para móvil sin saturación', () => {
    const calHdrIdx = html.indexOf('id="timelineBoardView"');
    const calHdrEnd = html.indexOf('id="timelineBoardColumns"');
    const calHdr = html.substring(calHdrIdx, calHdrEnd);

    assert(calHdr.includes('id="btnCalendarDailyTasks"') && calHdr.includes('hidden sm:flex'), 'btnCalendarDailyTasks hidden on mobile calendar');
    assert(calHdr.includes('id="calendarCreateContainer"') && calHdr.includes('hidden sm:block'), 'calendarCreateContainer hidden on mobile calendar');
    assert(calHdr.includes('id="calMonthYearLabel"'), 'calMonthYearLabel exists');
    assert(calHdr.includes('id="timelineConsultantFilter"'), 'timelineConsultantFilter exists');
});

// 3. Supresión de pastilla de filtro en Calendario y Prioridades
test('3. app.js & styles.css: #activeFilterPill se oculta estrictamente en Calendario y Prioridades', () => {
    assert(css.includes('body:has(#timelineBoardView:not(.hidden)) #activeFilterPill') && css.includes('display: none !important'), 'CSS hides activeFilterPill when timelineBoardView is open');
    assert(css.includes('body:has(#priorityBoardView:not(.hidden)) #activeFilterPill') && css.includes('display: none !important'), 'CSS hides activeFilterPill when priorityBoardView is open');
    assert(app.includes("mainWorkspaceViewMode !== 'map'"), 'updateActiveFilterPill checks mainWorkspaceViewMode is map');
});

// 4. Dock Inferior Móvil Permanente en Explorar, Tareas y Rol
test('4. index.html & styles.css: #mobileBottomDock con z-[100000] y visible sobre cajones y modales', () => {
    assert(html.includes('id="mobileBottomDock"') && html.includes('z-[100000]'), 'index.html gives mobileBottomDock z-[100000]');
    assert(css.includes('#mobileBottomDock') && css.includes('z-index: 100000 !important'), 'styles.css gives mobileBottomDock z-index: 100000');
    assert(css.includes('#dailyDrawer') && css.includes('bottom: calc(56px + env(safe-area-inset-bottom, 0px)) !important'), 'dailyDrawer clears mobile dock');
    assert(css.includes('#filterDrawer') && css.includes('bottom: calc(56px + env(safe-area-inset-bottom, 0px)) !important'), 'filterDrawer clears mobile dock');
    assert(css.includes('#attendanceModal') && css.includes('bottom: calc(56px + env(safe-area-inset-bottom, 0px)) !important'), 'attendanceModal clears mobile dock');
});

// 5. app.js: syncMobileDockState coordina el estado activo del dock
test('5. app.js: window.syncMobileDockState actualiza las 5 pestañas del dock en cualquier flujo', () => {
    assert(app.includes('window.syncMobileDockState = function'), 'syncMobileDockState defined');
    assert(app.includes("syncMobileDockState('tasks')"), 'syncMobileDockState called for tasks');
    assert(app.includes("syncMobileDockState('explore')"), 'syncMobileDockState called for explore');
    assert(app.includes("syncMobileDockState('attendance')"), 'syncMobileDockState called for attendance');
});

// 6. Matriz General de Asistencia: nombres compactos en móvil
test('6. app.js: renderAttendanceMatrixView compacta nombres de equipo en pantallas pequeñas', () => {
    assert(app.includes('shortName'), 'renderAttendanceMatrixView computes shortName');
    assert(app.includes('max-w-[85px] sm:max-w-none'), 'renderAttendanceMatrixView limits width on mobile');
    assert(app.includes('hidden sm:block') && app.includes('jobTitle'), 'renderAttendanceMatrixView hides secondary title on mobile');
});

// 7. Sincronización de cache buster v994/v995
test('7. index.html, styles.css & sw.js: Versión v994/v995 sincronizada en todo el sistema', () => {
    assert(/app\.js\?v=20261026_v99[4-9]/.test(html), 'index.html points to app.js');
    assert(/styles\.css\?v=20261026_v99[4-9]/.test(html), 'index.html points to styles.css');
    assert(/20261026_v99[4-9]/.test(sw), 'sw.js SW_VERSION is synced');
});

console.log(`\n====================================================`);
console.log(`RESULTADO FINAL: ${passed} PASSED, ${failed} FAILED`);
if (failed > 0) process.exit(1);
