const fs = require('fs');
const assert = require('assert');

console.log('====================================================');
console.log('AUDITORÍA DE LIMPIEZA DEL TABLERO DE PRIORIDADES & DRAWERS');
console.log('====================================================');

const index = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

let passed = 0;
function test(name, fn) {
    try {
        fn();
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } catch(e) {
        console.error(`❌ [FAIL] ${name}:`, e.message);
        process.exit(1);
    }
}

// 1. Drawers z-index
test('index.html: dailyDrawer tiene z-[70] para no traslaparse con controles flotantes', () => {
    assert(index.includes('id="dailyDrawer" class="fixed top-0 left-0 h-full max-h-screen w-full md:w-[420px] liquid-glass-panel z-[70]'));
});

test('index.html: priorityDrawer tiene z-[70]', () => {
    assert(index.includes('id="priorityDrawer" class="fixed top-0 right-0 h-full w-full md:w-[440px] liquid-glass-panel z-[70]'));
});

// 2. Priority board header controls
test('index.html: Botón de tareas diarias (#btnPriorityDailyTasks) y badge están en cabecera de prioridades', () => {
    assert(index.includes('id="btnPriorityDailyTasks"'));
    assert(index.includes('id="priorityDailyAlertsBadge"'));
});

test('index.html: Menú desplegable #priorityCreateMenu y gatillo #priorityCreateTrigger presentes en cabecera', () => {
    assert(index.includes('id="priorityCreateContainer"'));
    assert(index.includes('id="priorityCreateTrigger"'));
    assert(index.includes('id="priorityCreateMenu"'));
    assert(index.includes('openFastCreateProject()'));
    assert(index.includes('openProjectTaskModal()'));
    assert(index.includes('openFastDailyTaskModal()'));
});

test('index.html: Botón redundante "Mapa Mental ↗" removido de la cabecera del tablero', () => {
    // Debe existir en el conmutador superior general (#mainViewSwitcher), pero no en la sub-cabecera del tablero
    const subHeader = index.substring(index.indexOf('id="priorityBoardView"'), index.indexOf('id="priorityBoardColumns"'));
    assert(!subHeader.includes('Mapa Mental ↗'), 'No debe haber un segundo botón redundante de Mapa Mental en el sub-header');
});

// 3. Floating buttons hiding in priority board view
test('app.js: switchMainWorkspaceView(priority) oculta botones flotantes inferiores', () => {
    assert(app.includes('btnDaily.classList.add(\'hidden\')'));
    assert(app.includes('speedDial.classList.add(\'hidden\')'));
});

test('app.js: switchMainWorkspaceView(map) restaura botones flotantes inferiores', () => {
    assert(app.includes('btnDaily.classList.remove(\'hidden\')'));
    assert(app.includes('speedDial.classList.remove(\'hidden\')'));
});

// 4. Drawer opening hides canvas tools dock
test('app.js: toggleDailyDrawer oculta canvasToolsDock para que no se traslape con la lista de tareas', () => {
    assert(app.includes("if (dock) dock.classList.add('hidden')"));
});

// 5. Badge sync
test('app.js: renderDailyTasks sincroniza priorityDailyAlertsBadge', () => {
    assert(app.includes('pBadge.textContent = alertBadgeTotal'));
    assert(app.includes('pBadge.classList.remove(\'hidden\')'));
});

console.log('====================================================');
console.log(`RESULTADO FINAL: ${passed} de 9 pruebas superadas con éxito (0 fallos).`);
console.log('====================================================');
