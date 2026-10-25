/**
 * test_mobile_ergonomic_layout.js
 * Auditoría Automatizada: Diseño Móvil Ergonómico (Estilo Instagram) y Corrección de Scroll en Prioridades
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================================');
console.log('AUDITORÍA AUTOMATIZADA: DISEÑO MÓVIL ERGONÓMICO & CORRECCIÓN DE SCROLL');
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

// 1. Dock Inferior Fijo de 5 Pestañas
test('1. index.html: Dock inferior (#mobileBottomDock) con 5 pestañas de navegación con pulgar', () => {
    assert(html.includes('id="mobileBottomDock"'), 'mobileBottomDock must exist');
    assert(html.includes('id="mobileBtnViewModeMap"'), 'mobileBtnViewModeMap must exist');
    assert(html.includes('id="mobileBtnViewModePriority"'), 'mobileBtnViewModePriority must exist');
    assert(html.includes('id="mobileBtnViewModeTimeline"'), 'mobileBtnViewModeTimeline must exist');
    assert(html.includes('id="mobileBtnBottomFilters"'), 'mobileBtnBottomFilters must exist');
    assert(html.includes('id="mobileBtnBottomProfile"'), 'mobileBtnBottomProfile must exist');
});

// 2. Cabecera Móvil Minimalista (Estilo Instagram)
test('2. index.html: Cabecera móvil con botón crear a la izquierda y acciones a la derecha', () => {
    assert(html.includes('id="mobileTopCreateTrigger"'), 'mobileTopCreateTrigger must exist');
    assert(html.includes('id="mobileTopCreateMenu"'), 'mobileTopCreateMenu dropdown must exist');
    assert(html.includes('id="btnMobileTopDailyTasks"'), 'btnMobileTopDailyTasks must exist');
    assert(html.includes('id="mobileTopDailyAlertsBadge"'), 'mobileTopDailyAlertsBadge must exist');
    assert(html.includes('id="searchBtnIcon"'), 'searchBtnIcon must exist');
    assert(html.includes('id="mobileMenuBtn"'), 'mobileMenuBtn must exist');
});

// 3. Ocultamiento de Elementos Flotantes de Escritorio en Móvil
test('3. index.html: Botones flotantes de escritorio ocultos en pantalla móvil (hidden sm:flex)', () => {
    assert(html.includes('id="btnDailyTasks"') && html.includes('hidden sm:flex fixed bottom-6'), 'btnDailyTasks hidden on mobile');
    assert(html.includes('id="canvasToolsDock"') && html.includes('hidden sm:flex fixed bottom-6'), 'canvasToolsDock hidden on mobile');
    assert(html.includes('id="userProfilePillBtn"') && html.includes('class="hidden sm:flex h-8 items-center'), 'userProfilePillBtn hidden on mobile');
});

// 4. Corrección de Scroll en Tablero de Prioridades
test('4. index.html & app.js: Padding inferior suficiente (pb-32) para evitar corte de tarjetas en móvil', () => {
    assert(html.includes('id="priorityBoardColumns"') && html.includes('pb-20 sm:pb-6'), 'priorityBoardColumns has bottom padding pb-20');
    assert(app.includes('pb-32 sm:pb-3'), 'Column cards container in renderPriorityBoard has pb-32 to clear dock');
});

// 5. Corrección de Scroll en Vista Semanal de Calendario
test('5. app.js: Calendario semanal cuenta con padding inferior seguro (pb-28)', () => {
    assert(app.includes('pb-28 sm:pb-2.5'), 'Week days container in renderTimelineWeek has pb-28');
});

// 6. Funcionalidad de Creación Rápida Móvil en app.js
test('6. app.js: Métodos toggleMobileTopCreateMenu y closeMobileTopCreateMenu implementados', () => {
    assert(app.includes('toggleMobileTopCreateMenu'), 'toggleMobileTopCreateMenu defined');
    assert(app.includes('closeMobileTopCreateMenu'), 'closeMobileTopCreateMenu defined');
    assert(app.includes('window.toggleMobileTopCreateMenu = function'), 'toggleMobileTopCreateMenu exported to window');
});

// 7. Sincronización de Estado en Dock Inferior y Badges
test('7. app.js: switchMainWorkspaceView y renderDailyTasks sincronizan estado activo del dock móvil y alertas', () => {
    assert(app.includes('mobileDockIndicatorMap'), 'switchMainWorkspaceView updates mobileDockIndicatorMap');
    assert(app.includes('mobileDockIndicatorPriority'), 'switchMainWorkspaceView updates mobileDockIndicatorPriority');
    assert(app.includes('mobileDockIndicatorTimeline'), 'switchMainWorkspaceView updates mobileDockIndicatorTimeline');
    assert(app.includes('mobileTopDailyAlertsBadge'), 'renderDailyTasks updates mobileTopDailyAlertsBadge');
    assert(app.includes('mobileUserAvatarInitials'), 'updateUserProfilePill updates mobileUserAvatarInitials');
});

// 8. Reglas CSS y Safe-area para Dispositivos Móviles
test('8. styles.css: Reglas de pb-safe y dock inferior presentes', () => {
    assert(css.includes('pb-safe') || html.includes('pb-safe'), 'Safe area bottom support present');
    assert(css.includes('#mobileBottomDock'), 'mobileBottomDock styles defined in CSS');
});

console.log(`\n====================================================`);
console.log(`RESULTADO FINAL: ${passed} PASSED, ${failed} FAILED`);
console.log(`====================================================`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
