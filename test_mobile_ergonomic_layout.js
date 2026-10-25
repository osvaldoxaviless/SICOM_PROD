/**
 * test_mobile_ergonomic_layout.js
 * Auditoría Automatizada: Diseño Móvil Ergonómico (Estilo Instagram), Reorganización de Controles,
 * Diferenciación de Íconos (Prioridades vs Tareas) y Supresión de Botones Flotantes en Móvil.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================================');
console.log('AUDITORÍA AUTOMATIZADA: DISEÑO MÓVIL ERGONÓMICO V972 (INSTAGRAM-STYLE)');
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

// 1. Dock Inferior Fijo de 5 Pestañas (Mapa, Prioridades, Calendario, Tareas, Métricas)
test('1. index.html: Dock inferior (#mobileBottomDock) con 5 pestañas de navegación con pulgar', () => {
    assert(html.includes('id="mobileBottomDock"'), 'mobileBottomDock must exist');
    assert(html.includes('id="mobileBtnViewModeMap"'), 'mobileBtnViewModeMap must exist');
    assert(html.includes('id="mobileBtnViewModePriority"'), 'mobileBtnViewModePriority must exist');
    assert(html.includes('id="mobileBtnViewModeTimeline"'), 'mobileBtnViewModeTimeline must exist');
    assert(html.includes('id="mobileBtnBottomDailyTasks"'), 'mobileBtnBottomDailyTasks must exist');
    assert(html.includes('id="mobileBtnBottomMetrics"'), 'mobileBtnBottomMetrics must exist');
});

// 2. Diferenciación visual de íconos: Prioridades (Rayo ⚡) vs Tareas (Checklist 📋)
test('2. index.html: Prioridades utiliza ícono de rayo (diferenciado de Tareas)', () => {
    // Prioridades en dock
    const prioIdx = html.indexOf('id="mobileBtnViewModePriority"');
    const prioSection = html.substring(prioIdx, prioIdx + 1000);
    assert(prioSection.includes('M13 10V3L4 14h7v7l9-11h-7z'), 'mobileBtnViewModePriority must use lightning bolt SVG');
    assert(!prioSection.includes('M9 5H7a2 2 0 00-2 2v12'), 'mobileBtnViewModePriority must NOT use clipboard checklist icon');

    // Tareas en dock
    const tasksIdx = html.indexOf('id="mobileBtnBottomDailyTasks"');
    const tasksSection = html.substring(tasksIdx, tasksIdx + 1000);
    assert(tasksSection.includes('M9 5H7a2 2 0 00-2 2v12'), 'mobileBtnBottomDailyTasks must use clipboard checklist icon');
    assert(tasksSection.includes('id="mobileBottomDailyAlertsBadge"'), 'mobileBottomDailyAlertsBadge must exist on tasks tab');
});

// 3. Cabecera Móvil Minimalista: Filtros al lado del buscador
test('3. index.html: Cabecera móvil tiene botón crear a la izquierda y filtros junto al buscador a la derecha', () => {
    assert(html.includes('id="mobileTopCreateTrigger"'), 'mobileTopCreateTrigger must exist');
    assert(html.includes('id="mobileTopCreateMenu"'), 'mobileTopCreateMenu dropdown must exist');
    assert(html.includes('id="btnTopFilterDrawer"'), 'btnTopFilterDrawer must exist');
    assert(html.includes('id="searchBtnIcon"'), 'searchBtnIcon must exist');
    assert(html.includes('id="mobileMenuBtn"'), 'mobileMenuBtn must exist');
    // Filtros no debe estar oculto en móvil (debe tener flex h-8 w-8 sm:w-auto)
    assert(html.includes('id="btnTopFilterDrawer" onclick="toggleFilterDrawer()" class="flex h-8 w-8 sm:w-auto'), 'btnTopFilterDrawer visible on mobile header');
});

// 4. Ocultamiento Absoluto de Botones Flotantes de Escritorio en Móvil
test('4. index.html & styles.css: Botones flotantes de escritorio (canvasToolsDock, btnDailyTasks, speedDial) ocultos en móvil', () => {
    assert(html.includes('id="btnDailyTasks"') && html.includes('hidden sm:flex fixed bottom-6'), 'btnDailyTasks has hidden sm:flex');
    assert(html.includes('id="canvasToolsDock"') && html.includes('hidden sm:flex fixed bottom-6'), 'canvasToolsDock has hidden sm:flex');
    assert(html.includes('id="speedDial"') && html.includes('hidden sm:flex fixed bottom-6'), 'speedDial has hidden sm:flex');
    
    // Regla de medios CSS
    assert(css.includes('#canvasToolsDock') && css.includes('#speedDial') && css.includes('display: none !important'), 'styles.css enforces display: none !important on max-width: 639px');
});

// 5. Desahogo Inferior para infoCard y pushPromptBanner
test('5. index.html: infoCard y pushPromptBanner despejan el dock inferior con bottom-16 en móvil', () => {
    assert(html.includes('id="infoCard" class="absolute bottom-16 left-3 right-3 sm:bottom-4'), 'infoCard sits above mobile dock');
    assert(html.includes('id="pushPromptBanner" class="hidden fixed bottom-16 sm:bottom-6'), 'pushPromptBanner sits above mobile dock');
});

// 6. Métricas & KPIs de Consultoría en app.js
test('6. app.js: window.openMetricsOrDashboard implementado y conectado a auditoría o dashboard', () => {
    assert(app.includes('window.openMetricsOrDashboard = function'), 'window.openMetricsOrDashboard defined');
    assert(app.includes('openExecutiveDashboard') && app.includes('switchTab(\'dashboard\')'), 'openMetricsOrDashboard handles both PMO and team KPIs');
});

// 7. Sincronización del Badge de Alertas en Dock Inferior
test('7. app.js: renderDailyTasks sincroniza el badge #mobileBottomDailyAlertsBadge', () => {
    assert(app.includes('mobileBottomDailyAlertsBadge'), 'renderDailyTasks references mobileBottomDailyAlertsBadge');
});

// 8. Protección de Botones Flotantes contra Desocultamiento en Móvil en JS
test('8. app.js: switchMainWorkspaceView y drawer handlers respetan ancho de pantalla (isDesktop) antes de mostrar herramientas', () => {
    assert(app.includes('isDesktopMap = window.innerWidth >= 640'), 'switchMainWorkspaceView checks isDesktopMap');
    assert(app.includes('isDeskToggle = window.innerWidth >= 640') || app.includes('isDesktop = window.innerWidth >= 640'), 'dailyDrawer handlers check isDesktop');
});

console.log(`\n====================================================`);
console.log(`RESULTADO FINAL: ${passed} PASSED, ${failed} FAILED`);
console.log(`====================================================`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
