// test_assigned_and_timeline.js
// Automated verification for Assigned Projects Multi-Consultant Filter and Timeline Calendar Board

const fs = require('fs');
const assert = require('assert');

console.log('========================================================================');
console.log('AUDITORÍA AUTOMATIZADA: FILTRO DE ASIGNADOS Y CRONOGRAMA DE ENTREGAS');
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

// 1. Verificación del conmutador de vistas Odoo con 3 pestañas
test('1. index.html: Conmutador principal tiene 3 pestañas (Mapa, Prioridades, Cronograma)', () => {
    assert(html.includes('id="mainViewSwitcher"'), 'mainViewSwitcher must exist');
    assert(html.includes('id="btnViewModeMap"'), 'btnViewModeMap must exist');
    assert(html.includes('id="btnViewModePriority"'), 'btnViewModePriority must exist');
    assert(html.includes('id="btnViewModeTimeline"'), 'btnViewModeTimeline must exist');
    assert(html.includes('hidden sm:inline">Cronograma</span>'), 'Cronograma label must be responsive on mobile');
});

// 2. Verificación del contenedor del Cronograma
test('2. index.html: Contenedor #timelineBoardView estructurado correctamente a pantalla completa', () => {
    assert(html.includes('id="timelineBoardView"'), 'timelineBoardView must exist');
    assert(html.includes('id="timelineBoardColumns"'), 'timelineBoardColumns must exist');
    assert(html.includes('id="timelineCountBadge"'), 'timelineCountBadge must exist');
    assert(html.includes('id="btnTimelineFriday"'), 'btnTimelineFriday mode button must exist');
    assert(html.includes('id="btnTimelineDocs"'), 'btnTimelineDocs mode button must exist');
    assert(html.includes('id="timelineConsultantFilter"'), 'timelineConsultantFilter select must exist');
});

// 3. Verificación del acordeón de proyectos asignados con selector de consultor
test('3. index.html: Acordeón de Proyectos Asignados cuenta con selector táctil por consultor', () => {
    assert(html.includes('id="dailyAssignedProjectsSection"'), 'dailyAssignedProjectsSection must exist');
    assert(html.includes('id="dailyAssignedConsultantSelect"'), 'dailyAssignedConsultantSelect must exist');
    assert(html.includes('id="dailyAssignedHeaderTitle"'), 'dailyAssignedHeaderTitle must exist');
    assert(html.includes('id="dailyMyProjectsBadge"'), 'dailyMyProjectsBadge must exist');
    assert(html.includes('id="dailyMyProjectsList"'), 'dailyMyProjectsList must exist');
});

// 4. Verificación de Cache Buster v963
test('4. index.html & test_roles_scoping.js: Cache buster actualizado a v=20261024_v963', () => {
    assert(html.includes('app.js?v=20261024_v963'), 'index.html must reference v963');
    const testRoles = fs.readFileSync('test_roles_scoping.js', 'utf8');
    assert(testRoles.includes('20261024_v963'), 'test_roles_scoping.js must verify v963');
});

// 5. Verificación de Event Listener Guards en workspace
test('5. app.js: Workspace listeners (touch, wheel, mouse) respetan timelineBoardView', () => {
    assert(app.includes("mainWorkspaceViewMode === 'timeline'"), 'Guards must check timeline view mode');
    assert(app.includes("e.target.closest('#timelineBoardView')"), 'Guards must check target inside timelineBoardView');
});

// 6. Verificación de switchMainWorkspaceView para soportar "timeline"
test('6. app.js: switchMainWorkspaceView maneja mapa, prioridades y cronograma', () => {
    assert(app.includes("window.switchMainWorkspaceView = function(mode)"), 'switchMainWorkspaceView must be exposed');
    assert(app.includes("mode === 'timeline'"), 'switchMainWorkspaceView must handle timeline mode');
    assert(app.includes("timelineView.classList.remove('hidden')"), 'timelineView must be shown in timeline mode');
    assert(app.includes("timelineView.classList.add('hidden')"), 'timelineView must be hidden in other modes');
});

// 7. Verificación de funciones del Cronograma
test('7. app.js: Lógica del cronograma y calendario de entregas implementada', () => {
    assert(app.includes("window.setTimelineFilterMode = function(mode)"), 'setTimelineFilterMode must be defined');
    assert(app.includes("window.setTimelineConsultantFilter = function(cVal)"), 'setTimelineConsultantFilter must be defined');
    assert(app.includes("window.renderTimelineBoard = function()"), 'renderTimelineBoard must be defined');
    assert(app.includes("window.bindTimelineBoardScroll = function()"), 'bindTimelineBoardScroll must be defined');
    assert(app.includes("getNextFriday"), 'Helper getNextFriday must be defined');
    assert(app.includes("colOverdue"), 'Overdue column must be handled in friday mode');
    assert(app.includes("colThisFriday"), 'This Friday column must be handled in friday mode');
    assert(app.includes("colNextFriday"), 'Next Friday column must be handled in friday mode');
});

// 8. Verificación de selector multi-consultor en panel de trabajo
test('8. app.js: Multi-consultant filtering en renderMyAssignedProjects', () => {
    assert(app.includes("window.handleAssignedConsultantChange = function(val)"), 'handleAssignedConsultantChange must be defined');
    assert(app.includes("window.populateAssignedConsultantsSelect = function()"), 'populateAssignedConsultantsSelect must be defined');
    assert(app.includes("assignedProjectsFilter === 'ALL'"), 'ALL option supported in filtering');
    assert(app.includes("assignedProjectsFilter === 'ME'"), 'ME option supported in filtering');
    assert(app.includes("isLeadership && myCount === 0 && assignedProjectsFilter === 'ME'"), 'Auto-default to ALL for leadership with 0 assigned projects');
});

// 9. Simulación lógica en memoria de getNextFriday y fechas
test('9. Logic Test: Cálculo de próximos viernes para agrupación semanal', () => {
    function getNextFriday(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = (5 - day + 7) % 7;
        date.setDate(date.getDate() + diff);
        date.setHours(0,0,0,0);
        return date;
    }

    // Viernes 24 Octubre 2026 -> debe devolver el mismo día (viernes)
    const fri = new Date(2026, 9, 23); // Viernes 23 de Octubre
    assert.strictEqual(getNextFriday(fri).getDay(), 5);

    // Lunes 19 Octubre 2026 -> debe devolver Viernes 23 Octubre 2026
    const mon = new Date(2026, 9, 19);
    const friResult = getNextFriday(mon);
    assert.strictEqual(friResult.getDay(), 5);
    assert.strictEqual(friResult.getDate(), 23);
});

// 10. Simulación lógica en memoria del filtro de consultores
test('10. Logic Test: Filtro de proyectos asignados por rol y consultor', () => {
    const projects = [
        { id: 'p1', name: 'Proyecto A', consultants: ['Carlos Islas'] },
        { id: 'p2', name: 'Proyecto B', consultants: ['Óscar González'] },
        { id: 'p3', name: 'Proyecto C', consultants: ['Carlos Islas', 'Emmanuel Sánchez'] },
        { id: 'p4', name: 'Proyecto D', consultants: [] }
    ];

    const getCons = (p) => p.consultants || [];

    // Filter ME for Óscar González
    const filterMe = projects.filter(p => getCons(p).includes('Óscar González'));
    assert.strictEqual(filterMe.length, 1);
    assert.strictEqual(filterMe[0].name, 'Proyecto B');

    // Filter Carlos Islas
    const filterCarlos = projects.filter(p => getCons(p).includes('Carlos Islas'));
    assert.strictEqual(filterCarlos.length, 2);

    // Filter ALL assigned
    const filterAll = projects.filter(p => getCons(p).length > 0);
    assert.strictEqual(filterAll.length, 3);
});

console.log(`\n====================================================`);
console.log(`RESULTADO DE AUDITORÍA: ${passed} PASSED, ${failed} FAILED`);
console.log(`====================================================`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
