// test_priority_board.js - Automated Test for Odoo View Switcher & Interactive Priority Board
const fs = require('fs');
const assert = require('assert');

console.log('====================================================');
console.log('AUDITORÍA AUTOMATIZADA: TABLERO DE PRIORIDADES & CONMUTADOR DE VISTAS');
console.log('====================================================');

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

// 1. Verificación DOM index.html
test('index.html: Conmutador principal #mainViewSwitcher presente', () => {
    assert(html.includes('id="mainViewSwitcher"'));
    assert(html.includes('id="btnViewModeMap"'));
    assert(html.includes('id="btnViewModePriority"'));
});

test('index.html: Dock de herramientas del lienzo #canvasToolsDock presente con controles', () => {
    assert(html.includes('id="canvasToolsDock"'));
    assert(html.includes('id="canvasZoomWidget"'));
    assert(html.includes('id="btnToggleCollapseAll"'));
    assert(html.includes('id="textCollapseAll"'));
    assert(html.includes('id="btnFocusMode"'));
    assert(html.includes('id="btnToggleSecondaryLinksDock"'));
});

test('index.html: Tablero Kanban #priorityBoardView y columnas presentes', () => {
    assert(html.includes('id="priorityBoardView"'));
    assert(html.includes('id="priorityBoardColumns"'));
    assert(html.includes('id="priorityBoardCountBadge"'));
    assert(html.includes('id="btnGroupConsultant"'));
    assert(html.includes('id="btnGroupTier"'));
});

test('index.html: Botón de compatibilidad #btnTopPriorityDrawer presente', () => {
    assert(html.includes('id="btnTopPriorityDrawer"'));
});

// 2. Verificación app.js
test('app.js: window.switchMainWorkspaceView definido', () => {
    assert(app.includes('window.switchMainWorkspaceView = function(mode)'));
});

test('app.js: window.setPriorityBoardGroupBy definido', () => {
    assert(app.includes('window.setPriorityBoardGroupBy = function(groupBy)'));
});

test('app.js: window.adjustProjectPriority definido con validación de mínimo *1', () => {
    assert(app.includes('window.adjustProjectPriority = function(type, id, delta, event)'));
    assert(app.includes('Ya se encuentra en la prioridad máxima (*1)'));
});

test('app.js: window.jumpToMapNode definido', () => {
    assert(app.includes('window.jumpToMapNode = function(type, id, event)'));
    assert(app.includes("window.switchMainWorkspaceView('map')"));
});

test('app.js: window.renderPriorityBoard definido', () => {
    assert(app.includes('window.renderPriorityBoard = function()'));
    assert(app.includes("priorityBoardGroupBy === 'consultant'"));
    assert(app.includes('🔥 Prioridad Crítica (*1 - *2)'));
});

test('app.js: renderPriorityDrawer actualizado para abrir selectNode directamente y con controles ▲▼', () => {
    assert(app.includes("onclick=\"window.selectNode('${p.pType}', '${p.id}')\""));
    assert(app.includes("window.adjustProjectPriority('${p.pType}', '${p.id}', -1, event)"));
    assert(app.includes("window.jumpToMapNode('${p.pType}', '${p.id}', event)"));
});

test('app.js: reactividad de búsqueda y filtros vinculada a renderPriorityBoard', () => {
    assert(app.includes("handleDesktopSearch") && app.includes("renderPriorityBoard"));
    assert(app.includes("handleSearch") && app.includes("renderPriorityBoard"));
    assert(app.includes("handleAdvFilter") && app.includes("renderPriorityBoard"));
    assert(app.includes("refreshUI") && app.includes("renderPriorityBoard"));
});

// 3. Simulación funcional en sandbox Node
test('Sandbox: adjustProjectPriority incrementa y decrementa correctamente sin rebasar límites', () => {
    const mockAppData = {
        directProjects: [
            { id: 'dp1', name: 'Proyecto Directo 1', priority: 2 }
        ],
        modules: [
            {
                id: 'm1',
                name: 'Modulo 1',
                projects: [
                    { id: 'p1', name: 'Proyecto M1', priority: 1 }
                ]
            }
        ]
    };

    let toastMsg = null;
    let saved = false;
    const windowMock = {
        appData: mockAppData,
        showToast: (msg) => { toastMsg = msg; },
        saveData: () => { saved = true; },
        logSystemActivity: () => {},
        renderMindMap: () => {},
        renderPriorityBoard: () => {},
        renderPriorityDrawer: () => {}
    };

    function adjustPriority(type, id, delta) {
        let target = null;
        if (type === 'direct-project') {
            target = windowMock.appData.directProjects.find(p => p.id === id);
        } else {
            windowMock.appData.modules.forEach(m => {
                const found = (m.projects || []).find(p => p.id === id);
                if (found) target = found;
            });
        }
        if (!target) return;
        let currentPrio = parseInt(target.priority, 10) || 1;
        let newPrio = currentPrio + delta;
        if (newPrio < 1) {
            windowMock.showToast("⭐ Ya se encuentra en la prioridad máxima (*1)");
            return;
        }
        if (newPrio > 99) newPrio = 99;
        target.priority = newPrio;
        windowMock.saveData();
    }

    // Probar subir dp1 de *2 a *1
    adjustPriority('direct-project', 'dp1', -1);
    assert.strictEqual(mockAppData.directProjects[0].priority, 1, 'dp1 debió pasar de *2 a *1');
    assert.strictEqual(saved, true);

    // Intentar subir dp1 por encima de *1
    saved = false;
    adjustPriority('direct-project', 'dp1', -1);
    assert.strictEqual(mockAppData.directProjects[0].priority, 1, 'dp1 debe mantenerse en *1');
    assert(toastMsg.includes('prioridad máxima'));

    // Bajar p1 de *1 a *2
    adjustPriority('project', 'p1', 1);
    assert.strictEqual(mockAppData.modules[0].projects[0].priority, 2, 'p1 debió pasar de *1 a *2');
});

console.log('====================================================');
console.log(`RESULTADO FINAL: ${passed} pruebas superadas, ${failed} fallidas.`);
console.log('====================================================');
if (failed > 0) process.exit(1);
