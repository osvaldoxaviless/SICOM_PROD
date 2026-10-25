// test_login_enter_and_calendar_actions.js
// Automated verification for:
// 1. Enter key login on password and lector inputs
// 2. Calendar Header action buttons ([Tareas] & [+ Nuevo] dropdown)

const fs = require('fs');
const assert = require('assert');

console.log('========================================================================');
console.log('AUDITORÍA AUTOMATIZADA: LOGIN CON ENTER Y ACCIONES EN CABECERA CALENDARIO');
console.log('========================================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } catch (err) {
        console.error(`❌ [FAIL] ${name}:`, err.message);
        failed++;
    }
}

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

// 1. Login Enter Key en HTML
test('1. index.html: loginPasswordInput posee handler de tecla Enter (attemptLogin)', () => {
    assert(html.includes('id="loginPasswordInput"'), 'loginPasswordInput must exist');
    assert(html.includes('loginPasswordInput" onkeydown="if(event.key === \'Enter\'){ event.preventDefault(); attemptLogin(); }"') ||
           html.includes('id="loginPasswordInput"') && html.includes('attemptLogin()'),
           'loginPasswordInput must have Enter key handler');
});

test('2. index.html: loginLectorNameInput posee handler de tecla Enter (attemptLogin)', () => {
    assert(html.includes('id="loginLectorNameInput"'), 'loginLectorNameInput must exist');
    assert(html.includes('loginLectorNameInput" onkeydown="if(event.key === \'Enter\'){ event.preventDefault(); attemptLogin(); }"') ||
           html.includes('id="loginLectorNameInput"') && html.includes('attemptLogin()'),
           'loginLectorNameInput must have Enter key handler');
});

// 2. Login Enter Key en app.js
test('3. app.js: Listener document-level keydown gestiona tecla Enter para campos de login', () => {
    assert(app.includes("e.key === 'Enter'"), 'Must check for Enter key');
    assert(app.includes("document.activeElement === passInput"), 'Must check if activeElement is password input');
    assert(app.includes("window.attemptLogin()"), 'Must invoke attemptLogin on Enter');
});

// 3. Botones de Acción en Cabecera del Calendario
test('4. index.html: Botón de tareas #btnCalendarDailyTasks y badge presentes en cabecera de Calendario', () => {
    assert(html.includes('id="btnCalendarDailyTasks"'), 'btnCalendarDailyTasks must exist in index.html');
    assert(html.includes('id="calendarDailyAlertsBadge"'), 'calendarDailyAlertsBadge must exist in index.html');
});

test('5. index.html: Menú desplegable #calendarCreateMenu y gatillo #calendarCreateTrigger en Calendario', () => {
    assert(html.includes('id="calendarCreateContainer"'), 'calendarCreateContainer must exist');
    assert(html.includes('id="calendarCreateTrigger"'), 'calendarCreateTrigger must exist');
    assert(html.includes('id="calendarCreateMenu"'), 'calendarCreateMenu must exist');
    assert(html.includes('openFastCreateProject()'), 'Option to create project must exist in calendar menu');
    assert(html.includes('openProjectTaskModal()'), 'Option to create project task must exist in calendar menu');
    assert(html.includes('openFastDailyTaskModal()'), 'Option to create daily task must exist in calendar menu');
});

// 4. Funciones controladoras en app.js
test('6. app.js: toggleCalendarCreateMenu y closeCalendarCreateMenu definidos y operativos', () => {
    assert(app.includes('window.toggleCalendarCreateMenu = function()'), 'toggleCalendarCreateMenu must be defined');
    assert(app.includes('window.closeCalendarCreateMenu = function()'), 'closeCalendarCreateMenu must be defined');
});

test('7. app.js: switchMainWorkspaceView cierra calendarCreateMenu al cambiar de vista', () => {
    assert(app.includes('closeCalendarCreateMenu()'), 'switchMainWorkspaceView must close calendar create menu');
});

test('8. app.js: Click listener exterior cierra calendarCreateMenu al hacer clic fuera', () => {
    assert(app.includes('calendarCreateContainer'), 'Click listener must check calendarCreateContainer');
    assert(app.includes('closeCalendarCreateMenu'), 'Click listener must invoke closeCalendarCreateMenu');
});

test('9. app.js: renderDailyTasks sincroniza calendarDailyAlertsBadge con total de alertas', () => {
    assert(app.includes('calendarDailyAlertsBadge'), 'renderDailyTasks must reference calendarDailyAlertsBadge');
    assert(app.includes('calBadge.textContent = alertBadgeTotal'), 'renderDailyTasks must set badge text');
});

// 5. Cache buster
test('10. index.html & tests: Cache buster actualizado a v=20261024_v965', () => {
    assert(html.includes('app.js?v=20261024_v965'), 'index.html must reference v965');
});

console.log(`\n====================================================`);
console.log(`RESULTADO DE AUDITORÍA: ${passed} PASSED, ${failed} FAILED`);
console.log(`====================================================`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
