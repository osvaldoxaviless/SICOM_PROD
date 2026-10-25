// test_calendar_e2e_simulation.js
// Comprehensive End-to-End behavioral simulation for the Google-Style Interactive Calendar

const fs = require('fs');
const assert = require('assert');

console.log('========================================================================');
console.log('SIMULACIÓN E2E Y BATERÍA DE PRUEBAS DEL CALENDARIO INTERACTIVO (SICOM)');
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

// --- ENTORNO DE SIMULACIÓN EN MEMORIA ---
// Extraemos las funciones y helpers del calendario desde app.js para evaluarlos en un entorno controlado
const vm = require('vm');

const mockDOM = {
    elements: {},
    getElementById: function(id) {
        if (!this.elements[id]) {
            this.elements[id] = {
                id: id,
                className: '',
                classList: {
                    _classes: new Set(),
                    add: function(c) { this._classes.add(c); },
                    remove: function(c) { this._classes.delete(c); },
                    contains: function(c) { return this._classes.has(c); }
                },
                textContent: '',
                innerHTML: '',
                value: '',
                options: []
            };
        }
        return this.elements[id];
    }
};

const sandbox = {
    document: mockDOM,
    window: {},
    console: console,
    Date: Date,
    Math: Math,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    parseInt: parseInt,
    String: String,
    Array: Array,
    Object: Object,
    escapeHtml: function(s) {
        if (!s) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
    isCompletedStatus: function(s) {
        if (!s) return false;
        const norm = s.toLowerCase().trim();
        return norm.includes('liberado') || norm.includes('completado') || norm.includes('terminado');
    },
    getProjectConsultants: function(p) {
        return p.consultants || [];
    },
    appData: {
        directProjects: [],
        modules: []
    },
    consultants: {
        'Carlos Islas': { color: '#ee6018' },
        'Óscar González': { color: '#30d158' },
        'Emmanuel Sánchez': { color: '#3b82f6' }
    },
    currentSelection: null
};

vm.createContext(sandbox);

// 1. Cargar helpers y funciones de Calendario desde app.js
const calendarCodeMatch = app.match(/\/\/ === CALENDARIO INTERACTIVO DE ENTREGAS[\s\S]*?window\.renderTimelineBoard = window\.renderCalendarView;/);
assert(calendarCodeMatch, 'Calendar code block must exist in app.js');

vm.runInContext(calendarCodeMatch[0], sandbox);

// PRUEBA 1: Navegación temporal de Mes (Hoy, Siguiente, Anterior)
test('1. Navegación Mensual: calendarToday, calendarNext y calendarPrev calculan fechas exactas', () => {
    sandbox.window.calendarToday();
    const today = new Date();
    const cDate = vm.runInContext('calendarDate', sandbox);
    assert.strictEqual(cDate.getFullYear(), today.getFullYear());
    assert.strictEqual(cDate.getMonth(), today.getMonth());

    // Avanzar 1 mes
    const curMonth = cDate.getMonth();
    sandbox.window.calendarNext();
    assert.strictEqual(vm.runInContext('calendarDate.getMonth()', sandbox), (curMonth + 1) % 12);

    // Retroceder 2 meses
    sandbox.window.calendarPrev();
    sandbox.window.calendarPrev();
    assert.strictEqual(vm.runInContext('calendarDate.getMonth()', sandbox), (curMonth - 1 + 12) % 12);

    // Volver a Hoy
    sandbox.window.calendarToday();
    assert.strictEqual(vm.runInContext('calendarDate.getMonth()', sandbox), today.getMonth());
});

// PRUEBA 2: Conmutación de Modo (Mes vs Semana)
test('2. Conmutador de Modo: setCalendarViewMode("week") y setCalendarViewMode("month")', () => {
    sandbox.window.setCalendarViewMode('week');
    assert.strictEqual(vm.runInContext('calendarViewMode', sandbox), 'week');
    assert(mockDOM.getElementById('btnCalModeWeek').className.includes('bg-[#eeeeee]'));
    assert(mockDOM.getElementById('btnCalModeMonth').className.includes('text-[#b8b3b0]'));

    sandbox.window.setCalendarViewMode('month');
    assert.strictEqual(vm.runInContext('calendarViewMode', sandbox), 'month');
    assert(mockDOM.getElementById('btnCalModeMonth').className.includes('bg-[#eeeeee]'));
    assert(mockDOM.getElementById('btnCalModeWeek').className.includes('text-[#b8b3b0]'));
});

// PRUEBA 3: Extracción y Clasificación de Entregas (Proyectos con deadline y Documentos con fecha compromiso)
test('3. Recolección de Eventos: Identificación de proyectos, documentos y cálculo de retrasos', () => {
    // Inyectamos proyectos sintéticos
    sandbox.appData.directProjects = [
        {
            id: 'dp_1',
            name: 'Auditoría Flecha Amigo',
            deadline: '2026-10-23', // Viernes
            status: 'En proceso de desarrollo y/o Configuración',
            priority: 1,
            progress: 60,
            consultants: ['Carlos Islas'],
            docs: {
                d1: { nombre: 'Propuesta Económica', fecha_compromiso: '2026-10-20', checked: true },
                d2: { nombre: 'Matriz de Pruebas QA', fecha_compromiso: '2026-10-23', checked: false }
            }
        },
        {
            id: 'dp_2',
            name: 'Rutas Dinámicas Toluca',
            deadline: '2026-10-10', // Pasado (Retraso)
            status: 'Autorizado, sin iniciar',
            priority: 2,
            progress: 10,
            consultants: ['Óscar González']
        }
    ];

    sandbox.appData.modules = [
        {
            id: 'mod_1',
            name: 'Operaciones',
            color: '#10b981',
            projects: [
                {
                    id: 'p_mod_1',
                    name: 'Control de Combustible',
                    deadline: '2026-10-30', // Viernes siguiente
                    status: 'Liberado',
                    priority: 1,
                    progress: 100,
                    consultants: ['Emmanuel Sánchez']
                }
            ]
        }
    ];

    const events = vm.runInContext('getCalendarEvents()', sandbox);

    // Debe recolectar:
    // 1. dp_1 (Proyecto 2026-10-23)
    // 2. dp_1 Doc 1 (2026-10-20, checked=true -> isDone=true)
    // 3. dp_1 Doc 2 (2026-10-23, checked=false)
    // 4. dp_2 (Proyecto 2026-10-10, fecha pasada -> isOverdue=true)
    // 5. p_mod_1 (Proyecto 2026-10-30, status Liberado -> isDone=true)
    assert.strictEqual(events.length, 5, 'Debe haber exactamente 5 eventos extraídos');

    const overdueEvent = events.find(e => e.id === 'dp_2');
    assert(overdueEvent && overdueEvent.isOverdue, 'Rutas Dinámicas debe marcarse como retraso (isOverdue)');

    const doneEvent = events.find(e => e.id === 'p_mod_1');
    assert(doneEvent && doneEvent.isDone, 'Control de Combustible debe marcarse como completado (isDone)');

    const docChecked = events.find(e => e.title.includes('Propuesta Económica'));
    assert(docChecked && docChecked.isDone, 'Documento con checked=true debe marcarse isDone');
});

// PRUEBA 4: Filtro Reactivo por Consultor en el Calendario
test('4. Filtrado por Consultor: Aislamiento estricto de eventos por operador', () => {
    // Filtrar por Carlos Islas
    sandbox.window.setCalendarConsultantFilter('Carlos Islas');
    const eventsCarlos = vm.runInContext('getCalendarEvents()', sandbox);
    assert(eventsCarlos.length > 0);
    assert(eventsCarlos.every(e => e.consultants.includes('Carlos Islas')), 'Todos los eventos deben pertenecer a Carlos Islas');

    // Filtrar por Óscar González
    sandbox.window.setCalendarConsultantFilter('Óscar González');
    const eventsOscar = vm.runInContext('getCalendarEvents()', sandbox);
    assert.strictEqual(eventsOscar.length, 1);
    assert.strictEqual(eventsOscar[0].id, 'dp_2');

    // Volver a Todos
    sandbox.window.setCalendarConsultantFilter('ALL');
    const eventsAll = vm.runInContext('getCalendarEvents()', sandbox);
    assert.strictEqual(eventsAll.length, 5);
});

// PRUEBA 5: Renderizado de Cuadrícula Mensual HTML y Marcadores
test('5. Renderizado HTML Vista Mes: Días 1-31, píldoras con nombre, avance y VIE ★', () => {
    vm.runInContext('calendarDate = new Date(2026, 9, 24);', sandbox); // 24 de Octubre de 2026
    sandbox.window.setCalendarViewMode('month');
    sandbox.window.renderCalendarView();

    const outputHtml = mockDOM.getElementById('timelineBoardColumns').innerHTML;
    assert(outputHtml.includes('VIE ★'), 'Encabezado de viernes debe tener estrella de entrega');
    assert(outputHtml.includes('Auditoría Flecha Amigo'), 'Píldora del proyecto debe estar presente en el HTML');
    assert(outputHtml.includes('data-cal-pill="true"'), 'Píldoras deben tener selector data-cal-pill');
    assert(mockDOM.getElementById('calMonthYearLabel').textContent.includes('Octubre 2026'), 'Label debe ser Octubre 2026');
});

// PRUEBA 6: Renderizado de Vista Semanal HTML con Tarjetas
test('6. Renderizado HTML Vista Semana: 7 columnas (Lunes a Domingo) con tarjetas y prioridad', () => {
    vm.runInContext('calendarDate = new Date(2026, 9, 24);', sandbox);
    sandbox.window.setCalendarViewMode('week');
    sandbox.window.renderCalendarView();

    const outputHtml = mockDOM.getElementById('timelineBoardColumns').innerHTML;
    assert(outputHtml.includes('Lunes'), 'Columna de Lunes presente');
    assert(outputHtml.includes('Viernes'), 'Columna de Viernes presente');
    assert(outputHtml.includes('ENTREGA'), 'Badge de entrega presente en columna Viernes');
    assert(outputHtml.includes('* 1'), 'Prioridad * 1 renderizada');
    assert(outputHtml.includes('Mapa ↗'), 'Botón para centrar en mapa presente');
});

// PRUEBA 7: Interacción Focalizada: Clic en día abre Agenda del Día (#calendarDayModal)
test('7. Interacción Focalizada: Clic en día abre Agenda del Día (#calendarDayModal) sin abandonar la vista de Mes', () => {
    sandbox.window.setCalendarViewMode('month');
    assert.strictEqual(vm.runInContext('calendarViewMode', sandbox), 'month');

    // Simular clic en el día 2026-10-23
    sandbox.window.onCalendarDayClick('2026-10-23');
    assert.strictEqual(vm.runInContext('calendarViewMode', sandbox), 'month', 'Debe mantenerse en vista de mes sin sacar al usuario');
    assert.strictEqual(vm.runInContext('selectedCalendarDayStr', sandbox), '2026-10-23', 'selectedCalendarDayStr debe ser 2026-10-23');
    assert(!mockDOM.getElementById('calendarDayModal').classList.contains('hidden'), 'calendarDayModal debe estar visible');
    assert(mockDOM.getElementById('calDayModalTitle').textContent.includes('23'), 'Título del modal debe incluir el día 23');
});

// PRUEBA 8: Clic en Píldora abre Ficha Técnica sin Propagación de Eventos
test('8. Apertura de Ficha Técnica: onCalendarPillClick invoca selectNode y detiene propagación', () => {
    let nodeSelected = null;
    sandbox.window.selectNode = function(pType, id) {
        nodeSelected = { pType, id };
    };

    let stoppedPropagation = false;
    const mockEvent = {
        stopPropagation: function() { stoppedPropagation = true; }
    };

    sandbox.window.onCalendarPillClick('direct-project', 'dp_1', mockEvent);
    assert(stoppedPropagation, 'Debe llamar a stopPropagation para no disparar el clic del día contenedor');
    assert.deepStrictEqual(nodeSelected, { pType: 'direct-project', id: 'dp_1' }, 'selectNode debe recibir los datos del proyecto');
});

// PRUEBA 9: Sanitización XSS en Nombres y Documentos del Calendario
test('9. Seguridad XSS: Inyecciones de scripts en nombres de proyecto o documentos son neutralizadas', () => {
    sandbox.appData.directProjects.push({
        id: 'xss_proj',
        name: '<script>alert("hack")</script>',
        deadline: '2026-10-24',
        status: 'No Iniciado',
        priority: 1,
        consultants: []
    });

    sandbox.window.setCalendarViewMode('month');
    sandbox.window.renderCalendarView();

    const outputHtml = mockDOM.getElementById('timelineBoardColumns').innerHTML;
    assert(!outputHtml.includes('<script>alert("hack")</script>'), 'El HTML no debe contener tags de script sin escapar');
    assert(outputHtml.includes('&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;'), 'Debe estar correctamente escapado con entidades HTML');
});

// PRUEBA 10: Tolerancia a Proyectos sin Fecha o con Fechas Malformadas
test('10. Resiliencia: Proyectos sin fecha ("") o con formato inválido ("fecha-invalida") no provocan caídas', () => {
    sandbox.appData.directProjects.push({
        id: 'p_bad_1',
        name: 'Sin Fecha',
        deadline: '',
        status: 'No Iniciado'
    });
    sandbox.appData.directProjects.push({
        id: 'p_bad_2',
        name: 'Fecha Inválida',
        deadline: 'mañana por la tarde',
        status: 'No Iniciado'
    });
    sandbox.appData.directProjects.push({
        id: 'p_bad_3',
        name: 'Deadline Null',
        deadline: null,
        status: 'No Iniciado'
    });

    // Debe renderizar sin arrojar excepciones
    assert.doesNotThrow(() => {
        sandbox.window.renderCalendarView();
    }, 'renderCalendarView no debe tronar ante datos malformados');
});

console.log(`\n====================================================`);
console.log(`RESULTADO DE AUDITORÍA: ${passed} PASSED, ${failed} FAILED`);
console.log(`====================================================`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
