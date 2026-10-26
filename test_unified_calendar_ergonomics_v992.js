/**
 * test_unified_calendar_ergonomics_v992.js
 * Auditoría Automatizada:
 * 1. Unificación de Prioridades dentro de Calendario (Sub-tabs en cabecera)
 * 2. Dock inferior móvil de 5 tabs: [ Mapa | Calendario | Explorar | Tareas | Rol ]
 * 3. Botón directo de "Centrar Mapa" flotante sobre el canvas (móvil y escritorio)
 * 4. Modo Enfoque integrado dentro de la herramienta "Explorar" (Filtros)
 * 5. Adaptación responsive para celulares en horizontal (landscape) sin saturación
 * 6. Limpieza de vistas redundantes en el menú móvil [ OA ]
 * 7. Sincronización de cache buster v992
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================================');
console.log('AUDITORÍA AUTOMATIZADA: UNIFICACIÓN CALENDARIO & ERGONOMÍA V992');
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

// 1. Dock inferior móvil de 5 pestañas
test('1. index.html: Dock inferior móvil posee los 5 accesos [ Mapa | Calendario | Explorar | Tareas | Rol ]', () => {
    assert(html.includes('id="mobileBottomDock"'), 'mobileBottomDock must exist');
    assert(html.includes('id="mobileBtnViewModeMap"'), 'mobileBtnViewModeMap must exist');
    assert(html.includes('id="mobileBtnViewModeTimeline"'), 'mobileBtnViewModeTimeline must exist');
    assert(html.includes('id="mobileBtnBottomExplore"'), 'mobileBtnBottomExplore must exist');
    assert(html.includes('id="mobileBtnBottomDailyTasks"'), 'mobileBtnBottomDailyTasks must exist');
    assert(html.includes('id="mobileBtnBottomAttendance"'), 'mobileBtnBottomAttendance must exist');
    // Anclas de compatibilidad
    assert(html.includes('id="mobileBtnViewModePriority"'), 'mobileBtnViewModePriority compatibility anchor must exist');
    assert(html.includes('id="mobileBtnBottomMetrics"'), 'mobileBtnBottomMetrics compatibility anchor must exist');
});

// 2. Unificación Calendario y Prioridades con sub-pestañas en ambas vistas
test('2. index.html: Sub-barra de conmutación [ Calendario | Prioridades ] en #timelineBoardView y #priorityBoardView', () => {
    const prioIdx = html.indexOf('id="priorityBoardView"');
    const prioEnd = html.indexOf('id="priorityBoardColumns"');
    const prioSection = html.substring(prioIdx, prioEnd);
    assert(prioSection.includes("switchMainWorkspaceView('timeline')"), 'priorityBoardView has toggle to timeline');
    assert(prioSection.includes("switchMainWorkspaceView('priority')"), 'priorityBoardView has toggle to priority');

    const calIdx = html.indexOf('id="timelineBoardView"');
    const calEnd = html.indexOf('id="timelineBoardColumns"');
    const calSection = html.substring(calIdx, calEnd);
    assert(calSection.includes("switchMainWorkspaceView('timeline')"), 'timelineBoardView has toggle to timeline');
    assert(calSection.includes("switchMainWorkspaceView('priority')"), 'timelineBoardView has toggle to priority');
});

// 3. Botón directo "Centrar Mapa" flotante sobre el canvas
test('3. index.html & app.js: Botón directo #btnQuickRecenterMap flotante sobre el lienzo', () => {
    assert(html.includes('id="canvasQuickControls"'), 'canvasQuickControls must exist inside workspace');
    assert(html.includes('id="btnQuickRecenterMap"'), 'btnQuickRecenterMap must exist');
    assert(html.includes('recenterCanvas('), 'btnQuickRecenterMap must call recenterCanvas');
    assert(app.includes('canvasQuickControls'), 'app.js toggles canvasQuickControls on view switch');
});

// 4. Modo Enfoque integrado dentro del cajón "Explorar" (Filtros)
test('4. index.html & app.js: Modo Enfoque y Buscador integrados en #filterDrawer', () => {
    const drawerIdx = html.indexOf('id="filterDrawer"');
    const drawerEnd = html.indexOf('id="configDrawer"');
    const drawerSection = html.substring(drawerIdx, drawerEnd);
    assert(drawerSection.includes('id="searchInput"'), 'searchInput inside filterDrawer');
    assert(drawerSection.includes('id="advFilterToggleFocusBtn"'), 'advFilterToggleFocusBtn inside filterDrawer');
    assert(drawerSection.includes('Modo Enfoque'), 'Modo Enfoque title in drawer');
    assert(app.includes('updateFocusModeBtnUI'), 'app.js implements updateFocusModeBtnUI');
});

// 5. Adaptación responsive para celulares en horizontal (landscape)
test('5. styles.css: Reglas de medios para orientación horizontal (max-height: 520px and orientation: landscape)', () => {
    assert(css.includes('@media screen and (max-height: 520px) and (orientation: landscape) and (max-width: 1023px)'), 'landscape media query exists');
    assert(css.includes('desktop-search-cluster'), 'desktop-search-cluster hidden on phone landscape');
});

// 6. Limpieza de vistas redundantes en el menú móvil [ OA ]
test('6. index.html: Menú móvil [ OA ] no muestra vistas redundantes de sistema ya presentes en dock', () => {
    const menuIdx = html.indexOf('id="mobileMenuDropdown"');
    const menuEnd = html.indexOf('id="userProfilePillBtn"');
    const menuSection = html.substring(menuIdx, menuEnd);
    // Deben estar envueltas en un bloque hidden para que no se muestren visualmente
    assert(menuSection.includes('class="hidden" aria-hidden="true"'), 'redundant system views are hidden in mobile menu dropdown');
});

// 7. Sincronización de cache buster
test('7. index.html, styles.css & sw.js: Cache buster actualizado y sincronizado', () => {
    assert(/app\.js\?v=20261026_v(99[2-9]|1000)/.test(html), 'index.html references app.js?v');
    assert(/styles\.css\?v=20261026_v(99[2-9]|1000)/.test(html), 'index.html references styles.css?v');
    assert(/20261026_v(99[2-9]|1000)/.test(sw), 'sw.js SW_VERSION is synced');
});

console.log(`\n====================================================`);
console.log(`RESULTADO FINAL: ${passed} PASSED, ${failed} FAILED`);
console.log(`====================================================`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
