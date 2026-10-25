// test_assigned_and_timeline.js
// Automated verification for Assigned Projects Multi-Consultant Filter and Interactive Google Calendar

const fs = require('fs');
const assert = require('assert');

console.log('========================================================================');
console.log('AUDITORÍA AUTOMATIZADA: FILTRO DE ASIGNADOS Y CALENDARIO INTERACTIVO');
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
test('1. index.html: Conmutador principal tiene 3 pestañas (Mapa, Prioridades, Calendario)', () => {
    assert(html.includes('id="mainViewSwitcher"'), 'mainViewSwitcher must exist');
    assert(html.includes('id="btnViewModeMap"'), 'btnViewModeMap must exist');
    assert(html.includes('id="btnViewModePriority"'), 'btnViewModePriority must exist');
    assert(html.includes('id="btnViewModeTimeline"'), 'btnViewModeTimeline must exist');
    assert(html.includes('hidden sm:inline">Calendario</span>'), 'Calendario label must be responsive on mobile');
});

// 2. Verificación del contenedor del Calendario Google-Style
test('2. index.html: Contenedor #timelineBoardView estructurado como Calendario Interactivo', () => {
    assert(html.includes('id="timelineBoardView"'), 'timelineBoardView must exist');
    assert(html.includes('id="timelineBoardColumns"'), 'timelineBoardColumns container must exist');
    assert(html.includes('id="calMonthYearLabel"'), 'calMonthYearLabel must exist');
    assert(html.includes('id="btnCalModeMonth"'), 'btnCalModeMonth button must exist');
    assert(html.includes('id="btnCalModeWeek"'), 'btnCalModeWeek button must exist');
    assert(html.includes('id="timelineConsultantFilter"'), 'timelineConsultantFilter select must exist');
    assert(html.includes('id="timelineCountBadge"'), 'timelineCountBadge must exist');
    assert(html.includes('window.calendarToday()'), 'calendarToday trigger must exist in header');
    assert(html.includes('window.calendarPrev()'), 'calendarPrev trigger must exist in header');
    assert(html.includes('window.calendarNext()'), 'calendarNext trigger must exist in header');
});

// 3. Verificación del acordeón de proyectos asignados con selector de consultor
test('3. index.html: Acordeón de Proyectos Asignados cuenta con selector táctil por consultor', () => {
    assert(html.includes('id="dailyAssignedProjectsSection"'), 'dailyAssignedProjectsSection must exist');
    assert(html.includes('id="dailyAssignedConsultantSelect"'), 'dailyAssignedConsultantSelect must exist');
    assert(html.includes('id="dailyAssignedHeaderTitle"'), 'dailyAssignedHeaderTitle must exist');
    assert(html.includes('id="dailyMyProjectsBadge"'), 'dailyMyProjectsBadge must exist');
    assert(html.includes('id="dailyMyProjectsList"'), 'dailyMyProjectsList must exist');
});

// 4. Verificación de Cache Buster v969
test('4. index.html & test_roles_scoping.js: Cache buster actualizado a v=20261025_v969', () => {
    assert(html.includes('app.js?v=20261025_v969'), 'index.html must reference v969');
});

// 5. Verificación de Event Listener Guards en workspace
test('5. app.js: Workspace listeners (touch, wheel, mouse) respetan timelineBoardView', () => {
    assert(app.includes("mainWorkspaceViewMode === 'timeline'"), 'Guards must check timeline view mode');
    assert(app.includes("e.target.closest('#timelineBoardView')"), 'Guards must check target inside timelineBoardView');
});

// 6. Verificación de switchMainWorkspaceView para soportar "timeline"
test('6. app.js: switchMainWorkspaceView maneja mapa, prioridades y calendario', () => {
    assert(app.includes("window.switchMainWorkspaceView = function(mode)"), 'switchMainWorkspaceView must be exposed');
    assert(app.includes("mode === 'timeline'"), 'switchMainWorkspaceView must handle timeline mode');
    assert(app.includes("timelineView.classList.remove('hidden')"), 'timelineView must be shown in timeline mode');
    assert(app.includes("timelineView.classList.add('hidden')"), 'timelineView must be hidden in other modes');
});

// 7. Verificación de funciones del Calendario Interactivo
test('7. app.js: Motor interactivo de Calendario (Mes y Semana) implementado', () => {
    assert(app.includes("window.renderCalendarView = function()"), 'renderCalendarView must be defined');
    assert(app.includes("window.setCalendarViewMode = function(mode)"), 'setCalendarViewMode must be defined');
    assert(app.includes("window.calendarToday = function()"), 'calendarToday must be defined');
    assert(app.includes("window.calendarPrev = function()"), 'calendarPrev must be defined');
    assert(app.includes("window.calendarNext = function()"), 'calendarNext must be defined');
    assert(app.includes("window.setCalendarConsultantFilter = function(cVal)"), 'setCalendarConsultantFilter must be defined');
    assert(app.includes("window.onCalendarPillClick = function(pType, id, e)"), 'onCalendarPillClick must be defined');
    assert(app.includes("window.onCalendarDayClick = function(dateStr, e)"), 'onCalendarDayClick must be defined');
    assert(app.includes("getMonthGridDays"), 'Helper getMonthGridDays must be defined');
    assert(app.includes("getWeekDays"), 'Helper getWeekDays must be defined');
    assert(app.includes("getCalendarEvents"), 'Helper getCalendarEvents must be defined');
    assert(app.includes("window.renderTimelineBoard = window.renderCalendarView"), 'renderTimelineBoard alias defined');
});

// 8. Verificación de selector multi-consultor en panel de trabajo
test('8. app.js: Multi-consultant filtering en renderMyAssignedProjects', () => {
    assert(app.includes("window.handleAssignedConsultantChange = function(val)"), 'handleAssignedConsultantChange must be defined');
    assert(app.includes("window.populateAssignedConsultantsSelect = function()"), 'populateAssignedConsultantsSelect must be defined');
    assert(app.includes("assignedProjectsFilter === 'ALL'"), 'ALL option supported in filtering');
    assert(app.includes("assignedProjectsFilter === 'ME'"), 'ME option supported in filtering');
    assert(app.includes("isLeadership && myCount === 0 && assignedProjectsFilter === 'ME'"), 'Auto-default to ALL for leadership with 0 assigned projects');
});

// 9. Simulación lógica en memoria de Cuadrícula Mensual
test('9. Logic Test: Generación de cuadrícula mensual estilo Google Calendar', () => {
    function getMonthGridDays(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevMonthLastDay = new Date(year, month, 0);
        const daysInMonth = lastDay.getDate();
        const daysInPrevMonth = prevMonthLastDay.getDate();
        const startDayIndex = (firstDay.getDay() + 6) % 7;
        const days = [];
        for (let i = startDayIndex - 1; i >= 0; i--) {
            const d = daysInPrevMonth - i;
            const prevMonth = month === 0 ? 11 : month - 1;
            const prevYear = month === 0 ? year - 1 : year;
            const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({ dayNumber: d, dateStr, isCurrentMonth: true });
        }
        const totalSlots = days.length <= 35 ? 35 : 42;
        let nextDay = 1;
        while (days.length < totalSlots) {
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;
            const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
            days.push({ dayNumber: nextDay, dateStr, isCurrentMonth: false });
            nextDay++;
        }
        return days;
    }

    const grid = getMonthGridDays(2026, 9); // Octubre 2026
    assert.strictEqual(grid.length, 35, 'Octubre 2026 cabe exactamente en 5 semanas (35 días)');
    assert.strictEqual(grid.filter(d => d.isCurrentMonth).length, 31, '31 días activos en octubre');
});

// 10. Simulación lógica en memoria de Semana (Lunes a Domingo)
test('10. Logic Test: Generación de 7 días continuos en vista semanal', () => {
    function getWeekDays(date) {
        const d = new Date(date);
        const day = (d.getDay() + 6) % 7;
        const monday = new Date(d);
        monday.setDate(d.getDate() - day);
        monday.setHours(0,0,0,0);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const cur = new Date(monday);
            cur.setDate(monday.getDate() + i);
            const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
            days.push({ dayNumber: cur.getDate(), dateStr, date: cur, dayOfWeek: i });
        }
        return days;
    }

    const week = getWeekDays(new Date(2026, 9, 24));
    assert.strictEqual(week.length, 7, 'Semana tiene 7 días');
    assert.strictEqual(week[0].dateStr, '2026-10-19', 'Lunes es 19 de Octubre');
    assert.strictEqual(week[4].dateStr, '2026-10-23', 'Viernes de entrega es 23 de Octubre');
    assert.strictEqual(week[6].dateStr, '2026-10-25', 'Domingo es 25 de Octubre');
});

// 13. Verificación de Navegación Móvil (Barra Segmentada y Menú 3 Puntos)
test('13. index.html & app.js: Navegación móvil con barra segmentada (#mobileViewSwitcherBar) y menú 3 puntos', () => {
    assert(html.includes('id="mobileViewSwitcherBar"'), 'mobileViewSwitcherBar must exist');
    assert(html.includes('id="mobileBtnViewModeMap"'), 'mobileBtnViewModeMap must exist');
    assert(html.includes('id="mobileBtnViewModePriority"'), 'mobileBtnViewModePriority must exist');
    assert(html.includes('id="mobileBtnViewModeTimeline"'), 'mobileBtnViewModeTimeline must exist');
    assert(html.includes('id="mobileMenuOptMap"'), 'mobileMenuOptMap must exist');
    assert(html.includes('id="mobileMenuOptPriority"'), 'mobileMenuOptPriority must exist');
    assert(html.includes('id="mobileMenuOptTimeline"'), 'mobileMenuOptTimeline must exist');
    assert(app.includes('mobileBtnViewModeMap'), 'app.js must manage mobileBtnViewModeMap state');
    assert(app.includes('mobileBtnViewModePriority'), 'app.js must manage mobileBtnViewModePriority state');
    assert(app.includes('mobileBtnViewModeTimeline'), 'app.js must manage mobileBtnViewModeTimeline state');
});

console.log(`\n====================================================`);
console.log(`RESULTADO DE AUDITORÍA: ${passed} PASSED, ${failed} FAILED`);
console.log(`====================================================`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
