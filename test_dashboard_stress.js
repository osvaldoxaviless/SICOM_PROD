// ============================================================================
// ADVERSARIAL STRESS TEST SUITE: PHASE 2 EXECUTIVE DASHBOARD & DRILL-DOWN
// SICOM SPA — Empirical Challenger 2 (Dashboard & Performance Specialist)
// ============================================================================

const fs = require('fs');
const path = require('path');

console.log('======================================================================');
console.log('ADVERSARIAL STRESS TEST SUITE: SICOM PHASE 2 EXECUTIVE DASHBOARD');
console.log('Target: app.js & index.html (Chart.js lifecycle, Matrix, Drill-Down)');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message, details = '') {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  [PASS] ${message}`);
    } else {
        failedTests++;
        console.error(`  [FAIL] ${message}`);
        if (details) console.error(`         -> Details: ${details}`);
        failures.push({ message, details });
    }
}

// ----------------------------------------------------------------------------
// 1. MOCK DOM & CHART.JS ENVIRONMENT SETUP
// ----------------------------------------------------------------------------

class MockClassList {
    constructor(element) {
        this.element = element;
        this.classes = new Set();
    }
    add(...cls) {
        cls.forEach(c => this.classes.add(c));
    }
    remove(...cls) {
        cls.forEach(c => this.classes.delete(c));
    }
    contains(c) {
        return this.classes.has(c);
    }
    toggle(c) {
        if (this.classes.has(c)) {
            this.classes.delete(c);
            return false;
        } else {
            this.classes.add(c);
            return true;
        }
    }
    toString() {
        return Array.from(this.classes).join(' ');
    }
}

class MockElement {
    constructor(id = '', tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.classList = new MockClassList(this);
        this._innerHTML = '';
        this._textContent = '';
        this._value = '';
        this.className = '';
        this.style = {};
        this.eventListeners = {};
    }

    get innerHTML() {
        return this._innerHTML;
    }
    set innerHTML(val) {
        this._innerHTML = String(val);
    }

    get textContent() {
        return this._textContent;
    }
    set textContent(val) {
        this._textContent = String(val);
    }

    get value() {
        return this._value;
    }
    set value(val) {
        this._value = String(val);
    }

    getContext(type) {
        if (type === '2d') {
            return {
                canvas: this,
                clearRect: () => {},
                fillRect: () => {},
                beginPath: () => {},
                arc: () => {},
                stroke: () => {},
                fill: () => {}
            };
        }
        return null;
    }

    addEventListener(evt, fn) {
        if (!this.eventListeners[evt]) this.eventListeners[evt] = [];
        this.eventListeners[evt].push(fn);
    }
}

class MockDocument {
    constructor() {
        this.elements = new Map();
        this.eventListeners = {};
    }

    register(id, element) {
        this.elements.set(id, element);
        return element;
    }

    getElementById(id) {
        if (!this.elements.has(id)) {
            // Auto-create to prevent null dereferences during testing
            const el = new MockElement(id);
            this.elements.set(id, el);
        }
        return this.elements.get(id);
    }

    querySelectorAll(selector) {
        const results = [];
        if (selector === '.exec-pill-btn') {
            for (const [id, el] of this.elements.entries()) {
                if (id.startsWith('execPill_')) results.push(el);
            }
        }
        return results;
    }

    addEventListener(evt, fn) {
        if (!this.eventListeners[evt]) this.eventListeners[evt] = [];
        this.eventListeners[evt].push(fn);
    }
}

class MockChart {
    static instances = new Map(); // canvas -> chart instance
    static activeInstances = new Set();
    static totalCreated = 0;
    static totalDestroyed = 0;
    static peakActive = 0;
    static canvasReuseErrors = 0;

    constructor(ctx, config) {
        const canvas = ctx ? ctx.canvas : null;
        if (!canvas) throw new Error('MockChart: ctx.canvas is missing');

        // Chart.js enforces: Cannot reuse a canvas if an existing chart is not destroyed
        if (MockChart.instances.has(canvas)) {
            MockChart.canvasReuseErrors++;
            const existing = MockChart.instances.get(canvas);
            throw new Error(`Canvas is already in use. Chart with id '${existing.id}' must be destroyed before the canvas can be reused.`);
        }

        MockChart.totalCreated++;
        this.id = 'chart_' + MockChart.totalCreated;
        this.canvas = canvas;
        this.config = config;
        this.destroyed = false;

        MockChart.instances.set(canvas, this);
        MockChart.activeInstances.add(this);
        if (MockChart.activeInstances.size > MockChart.peakActive) {
            MockChart.peakActive = MockChart.activeInstances.size;
        }
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        MockChart.totalDestroyed++;
        if (this.canvas) {
            MockChart.instances.delete(this.canvas);
        }
        MockChart.activeInstances.delete(this);
        this.canvas = null;
    }

    static getChart(canvas) {
        if (!canvas) return null;
        return MockChart.instances.get(canvas) || null;
    }

    static resetStats() {
        MockChart.instances.clear();
        MockChart.activeInstances.clear();
        MockChart.totalCreated = 0;
        MockChart.totalDestroyed = 0;
        MockChart.peakActive = 0;
        MockChart.canvasReuseErrors = 0;
    }
}

// ----------------------------------------------------------------------------
// 2. LOAD APPLICATION CODE UNDER TEST FROM APP.JS
// ----------------------------------------------------------------------------

const appJsPath = path.join(__dirname, 'app.js');
const appSource = fs.readFileSync(appJsPath, 'utf8');

// Extract escapeHtml
const escapeMatch = appSource.match(/const escapeHtml = [^\r\n]+;/);
if (!escapeMatch) throw new Error('Could not extract escapeHtml from app.js');

// Extract STGT_STATUS_CATALOG and normalizeProjectStatus
const catalogMatch = appSource.match(/window\.STGT_STATUS_CATALOG = \{[\s\S]+?\};\s+window\.normalizeProjectStatus = function\(status\) \{[\s\S]+?\};/);
if (!catalogMatch) throw new Error('Could not extract STGT_STATUS_CATALOG and normalizeProjectStatus from app.js');

// Extract Dashboard Module
const dashMarker = '// MÓDULO DASHBOARD EJECUTIVO & AUDITORÍA CON DRILL-DOWN (FASE 2)';
const dashIndex = appSource.indexOf(dashMarker);
if (dashIndex === -1) throw new Error('Could not locate Executive Dashboard module in app.js');
const calMarker = '// === CALENDARIO INTERACTIVO DE ENTREGAS';
const calIdx = appSource.indexOf(calMarker, dashIndex);
const dashboardModuleSource = calIdx !== -1 ? appSource.substring(dashIndex, calIdx) : appSource.substring(dashIndex);

// Setup Global Sandbox Environment
const mockDoc = new MockDocument();
// Pre-register standard dashboard elements
[
    'executiveDashboardModal',
    'btnTabExecCharts',
    'btnTabExecTables',
    'execSubtabCharts',
    'execSubtabTables',
    'execTotalReqCount',
    'execChartPaquetesCanvas',
    'execChartPropuestasCanvas',
    'execChartEstatusCanvas',
    'execStatusMiniTable',
    'execMatrixContainer',
    'execTableContainer',
    'execActiveDrillDownPill',
    'execActiveDrillDownText',
    'execSearchInput',
    'execPill_ALL',
    'execPill_retraso_stgt',
    'execPill_alta_dir',
    'execPill_stgt',
    'execPill_auditoria'
].forEach(id => mockDoc.register(id, new MockElement(id)));

// Global sandbox bindings
global.window = global;
global.window.addEventListener = () => {};
global.window.matchMedia = () => ({ matches: false });
global.document = mockDoc;
global.Chart = MockChart;
global.requestAnimationFrame = (fn) => fn();
global.lastSelectedNode = null;
global.window.selectNode = (type, id) => {
    global.lastSelectedNode = { type, id };
};
global.appData = { directProjects: [], modules: [] };

// Evaluate extracted modules into global sandbox
const executionScript = `
${escapeMatch[0]}
${catalogMatch[0]}
${dashboardModuleSource}
`;

try {
    eval(executionScript);
    console.log('✅ Dashboard code successfully bound into sandbox environment.\n');
} catch (err) {
    console.error('❌ Failed to evaluate dashboard code in sandbox:', err);
    process.exit(1);
}

// ============================================================================
// TEST SUITE 1: MATRIX & CHART AGGREGATIONS (MATHEMATICAL EXACTNESS)
// ============================================================================
console.log('----------------------------------------------------------------------');
console.log('SUITE 1: Matrix & Chart Aggregations & Mathematical Exactness');
console.log('----------------------------------------------------------------------');

// Test 1.1: Empty State (0 Projects)
console.log('\n[Scenario 1.1: 0 Projects / Empty State]');
appData = { directProjects: [], modules: [] };
window.clearExecutiveDrillDown();
window.renderExecutiveMatrixAndCharts();

const countBadge = mockDoc.getElementById('execTotalReqCount');
assert(countBadge.textContent === '0 Total', 'Total count badge reflects "0 Total" on empty dataset');

const paqInst = MockChart.getChart(mockDoc.getElementById('execChartPaquetesCanvas'));
const propInst = MockChart.getChart(mockDoc.getElementById('execChartPropuestasCanvas'));
const statInst = MockChart.getChart(mockDoc.getElementById('execChartEstatusCanvas'));

assert(paqInst && paqInst.config.data.datasets[0].data.every(v => v === 0), 'All Paquetes counts are 0 on empty state');
assert(propInst && propInst.config.data.datasets[0].data.every(v => v === 0), 'All Propuestas counts are 0 on empty state');
assert(statInst && statInst.config.data.datasets[0].data.every(v => v === 0), 'All Status counts are 0 on empty state');

const miniTableHtml = mockDoc.getElementById('execStatusMiniTable').innerHTML;
assert(!miniTableHtml.includes('NaN'), 'Mini-table percentages avoid division by zero / NaN on 0 projects');
assert(miniTableHtml.includes('0%'), 'Mini-table shows 0% across all statuses on 0 projects');

const matrixHtml = mockDoc.getElementById('execMatrixContainer').innerHTML;
assert(matrixHtml.includes('<td class="p-2 text-center bg-[#1d1a18] text-[#ee6018] text-xs font-bold">0</td>'), 'Matrix grand total cell displays exactly 0');
assert(matrixHtml.includes('Estatus STGT') && matrixHtml.includes('TOTAL POR EMPRESA'), 'Matrix headers and footer rendered correctly');

window.renderExecutiveTable();
const tableHtml = mockDoc.getElementById('execTableContainer').innerHTML;
assert(tableHtml.includes('No se encontraron requerimientos'), 'Executive table displays correct empty state placeholder message');


// Test 1.2: Scale Test (1,200 Synthetic Projects)
console.log('\n[Scenario 1.2: 1,200 Synthetic Projects at High Scale]');
const officialStatuses = Object.keys(window.STGT_STATUS_CATALOG);
const officialCompanies = ['AFR', 'ZIN', 'TEO', 'AVM', 'ODM', 'STGT', 'CETRAM', 'ODA', 'ACAM', 'SATEL', 'SIG', 'CSP', 'TDN', 'OVN', 'ORO', 'MOD', 'TMT', 'SGC', 'CGT', 'SLLP', 'CAE'];
const officialPackages = ['Paquete 1', 'Paquete 2', 'Paquete 3', 'Paquete 4', 'Sin paquete'];
const officialProposals = ['Mantenimiento', 'Servicio Administrado', 'Venta', 'Innovación'];

const syntheticProjects = [];
const directList = [];
const moduleList = [];

// Seed deterministic 1,200 projects
for (let i = 0; i < 1200; i++) {
    // Inject legacy statuses for every 10th item to test normalization
    let rawStatus;
    if (i % 20 === 0) rawStatus = 'Completado';
    else if (i % 20 === 1) rawStatus = 'En Progreso';
    else if (i % 20 === 2) rawStatus = 'Pendiente';
    else if (i % 20 === 3) rawStatus = 'No Iniciado';
    else rawStatus = officialStatuses[i % officialStatuses.length];

    const proj = {
        id: `proj_synth_${i}`,
        name: `Requerimiento Operativo #${i} - ${i % 2 === 0 ? 'ERP' : 'Core'}`,
        status: rawStatus,
        empresa: officialCompanies[i % officialCompanies.length],
        paquete: officialPackages[i % officialPackages.length],
        tipo_propuesta: officialProposals[i % officialProposals.length],
        area_solicitante: i % 15 === 0 ? 'Dir. General' : 'Sistemas',
        lider_proyecto: `Líder ${i % 5}`,
        consultor: `Consultor ${i % 8}`,
        tester: `Tester ${i % 4}`,
        programador: `Programador ${i % 6}`,
        es_relevante_alta_direccion: (i % 7 === 0),
        es_relevante_stgt: (i % 5 === 0),
        observacion_ejecutiva: `Observación crítica para el requerimiento #${i}`,
        docs: (i % 3 === 0) ? { doc1: { fecha_compromiso: '2026-11-15' } } : {}
    };

    if (i < 600) {
        directList.push(proj);
    } else {
        const modIdx = Math.floor((i - 600) / 60);
        if (!moduleList[modIdx]) {
            moduleList[modIdx] = {
                id: `mod_${modIdx}`,
                name: `Módulo de Gestión ${modIdx}`,
                color: '#3b82f6',
                projects: []
            };
        }
        moduleList[modIdx].projects.push(proj);
    }
    syntheticProjects.push(proj);
}

appData = { directProjects: directList, modules: moduleList };
assert(window.getAllProjectsFlat().length === 1200, 'getAllProjectsFlat returns exactly 1,200 projects');

window.renderExecutiveMatrixAndCharts();

const totalBadge1200 = mockDoc.getElementById('execTotalReqCount').textContent;
assert(totalBadge1200 === '1200 Total', `Total badge displays "1200 Total" (Observed: "${totalBadge1200}")`);

// Verify Chart totals sum up to exactly 1,200
const paqData = MockChart.getChart(mockDoc.getElementById('execChartPaquetesCanvas')).config.data.datasets[0].data;
const paqSum = paqData.reduce((a, b) => a + b, 0);
assert(paqSum === 1200, `Paquetes chart data sum equals 1,200 exactly (Sum: ${paqSum})`);

const propData = MockChart.getChart(mockDoc.getElementById('execChartPropuestasCanvas')).config.data.datasets[0].data;
const propSum = propData.reduce((a, b) => a + b, 0);
assert(propSum === 1200, `Propuestas chart data sum equals 1,200 exactly (Sum: ${propSum})`);

const statData = MockChart.getChart(mockDoc.getElementById('execChartEstatusCanvas')).config.data.datasets[0].data;
const statSum = statData.reduce((a, b) => a + b, 0);
assert(statSum === 1200, `Estatus doughnut chart data sum equals 1,200 exactly (Sum: ${statSum})`);

// Verify Matrix 9x21 Mathematical Integrity
console.log('\n[Verifying Matrix 9x21 Cell-by-Cell & Marginals on 1,200 Projects]');
const matrixHtml1200 = mockDoc.getElementById('execMatrixContainer').innerHTML;

// Extract Grand Total from bottom-right corner
const grandTotalMatch = matrixHtml1200.match(/<td class="p-2 text-center bg-\[#1d1a18\] text-\[#ee6018\] text-xs font-bold">(\d+)<\/td>/);
assert(grandTotalMatch && parseInt(grandTotalMatch[1], 10) === 1200, `Matrix grand total cell is 1200 (Observed: ${grandTotalMatch ? grandTotalMatch[1] : 'null'})`);

// Verify that each cell in matrix matches mathematical count
let matrixCellCountSum = 0;
let cellDiscrepancyFound = false;

officialStatuses.forEach(stgtStatus => {
    officialCompanies.forEach(comp => {
        const expectedCount = syntheticProjects.filter(p => {
            const norm = window.normalizeProjectStatus(p.status);
            const matchesComp = (p.empresa === comp) || (Array.isArray(p.companies) && p.companies.includes(comp));
            return norm === stgtStatus && matchesComp;
        }).length;

        matrixCellCountSum += expectedCount;

        if (expectedCount > 0) {
            const expectedPattern = `onclick="window.setExecutiveDrillDown({ empresa: '${comp}', estado: '${stgtStatus}' })"`;
            if (!matrixHtml1200.includes(expectedPattern)) {
                cellDiscrepancyFound = true;
            }
        }
    });
});

assert(!cellDiscrepancyFound, 'All populated matrix cells have exact drill-down handlers for [empresa, estado]');
assert(matrixCellCountSum === 1200, `Sum of all matrix cells equals 1,200 exactly (Sum: ${matrixCellCountSum})`);


// Test 1.3: Projects with Multiple Companies in `companies` array
console.log('\n[Scenario 1.3: Projects with Multiple Companies]');
const multiCompProjects = [
    {
        id: 'multi_1',
        name: 'Sistema Multi-Empresa A',
        status: 'Liberado',
        empresa: 'AFR',
        companies: ['AFR', 'ZIN', 'TEO'],
        paquete: 'Paquete 1',
        tipo_propuesta: 'Mantenimiento'
    },
    {
        id: 'multi_2',
        name: 'Sistema Multi-Empresa B',
        status: 'Retraso STGT',
        empresa: '',
        companies: ['CETRAM', 'ODA'],
        paquete: 'Paquete 2',
        tipo_propuesta: 'Innovación'
    }
];

appData = { directProjects: multiCompProjects, modules: [] };
window.renderExecutiveMatrixAndCharts();

// In multi_1, companies are AFR, ZIN, TEO.
// Verify matrix shows 1 in AFR, 1 in ZIN, 1 in TEO under Liberado.
const matrixMultiHtml = mockDoc.getElementById('execMatrixContainer').innerHTML;
assert(matrixMultiHtml.includes("onclick=\"window.setExecutiveDrillDown({ empresa: 'AFR', estado: 'Liberado' })\""), 'Multi-company project appears in AFR column');
assert(matrixMultiHtml.includes("onclick=\"window.setExecutiveDrillDown({ empresa: 'ZIN', estado: 'Liberado' })\""), 'Multi-company project appears in ZIN column');
assert(matrixMultiHtml.includes("onclick=\"window.setExecutiveDrillDown({ empresa: 'TEO', estado: 'Liberado' })\""), 'Multi-company project appears in TEO column');
assert(!matrixMultiHtml.includes("onclick=\"window.setExecutiveDrillDown({ empresa: 'AVM', estado: 'Liberado' })\""), 'Multi-company project does NOT appear in non-member column (AVM)');

// In multi_2, empresa is empty, but companies has CETRAM and ODA under Retraso STGT.
assert(matrixMultiHtml.includes("onclick=\"window.setExecutiveDrillDown({ empresa: 'CETRAM', estado: 'Retraso STGT' })\""), 'Multi-company project with empty empresa appears in CETRAM column');
assert(matrixMultiHtml.includes("onclick=\"window.setExecutiveDrillDown({ empresa: 'ODA', estado: 'Retraso STGT' })\""), 'Multi-company project with empty empresa appears in ODA column');

// Test 1.4: Extreme Distributions
console.log('\n[Scenario 1.4: Extreme Skew & Boundary Distributions]');
// Scenario A: 1,000 projects all in STGT
const allStgtProjects = [];
for (let i = 0; i < 1000; i++) {
    allStgtProjects.push({
        id: `stgt_${i}`,
        name: `STGT Project ${i}`,
        status: officialStatuses[i % officialStatuses.length],
        empresa: 'STGT',
        paquete: 'Paquete 1',
        tipo_propuesta: 'Mantenimiento'
    });
}
appData = { directProjects: allStgtProjects, modules: [] };
window.renderExecutiveMatrixAndCharts();

const matrixStgtHtml = mockDoc.getElementById('execMatrixContainer').innerHTML;
assert(matrixStgtHtml.includes("onclick=\"window.setExecutiveDrillDown({ empresa: 'STGT' })\" class=\"hover:text-[#ee6018] transition\">1000</button>"), 'STGT column total is exactly 1,000 when all projects belong to STGT');

// Scenario B: 1,000 projects all in Cancelado across companies
const allCanceladoProjects = [];
for (let i = 0; i < 1000; i++) {
    allCanceladoProjects.push({
        id: `canc_${i}`,
        name: `Cancelado Project ${i}`,
        status: 'Cancelado',
        empresa: officialCompanies[i % officialCompanies.length],
        paquete: 'Sin paquete',
        tipo_propuesta: 'Venta'
    });
}
appData = { directProjects: allCanceladoProjects, modules: [] };
window.renderExecutiveMatrixAndCharts();

const statCanceladoData = MockChart.getChart(mockDoc.getElementById('execChartEstatusCanvas')).config.data.datasets[0].data;
const canceladoIndex = officialStatuses.indexOf('Cancelado');
assert(statCanceladoData[canceladoIndex] === 1000, 'Cancelado count is exactly 1,000 in status chart');
const otherStatusesSum = statCanceladoData.filter((_, idx) => idx !== canceladoIndex).reduce((a, b) => a + b, 0);
assert(otherStatusesSum === 0, 'All other 8 statuses have exactly 0 count');

const miniTableCanc = mockDoc.getElementById('execStatusMiniTable').innerHTML;
assert(miniTableCanc.includes('100%') && miniTableCanc.includes('Cancelado'), 'Cancelado reflects 100% in mini-table');


// ============================================================================
// TEST SUITE 2: MEMORY & CANVAS LIFECYCLE (100 CONSECUTIVE CYCLES)
// ============================================================================
console.log('\n----------------------------------------------------------------------');
console.log('SUITE 2: Memory & Canvas Lifecycle (100 Consecutive Cycles)');
console.log('----------------------------------------------------------------------');

window.closeExecutiveDashboard();
MockChart.resetStats();
let lifecycleErrors = [];

console.log('Executing 100 stress cycles: openExecutiveDashboard -> render -> switch tabs -> closeExecutiveDashboard...');
const startMemCycle = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

for (let cycle = 1; cycle <= 100; cycle++) {
    try {
        window.openExecutiveDashboard('charts');
        window.renderExecutiveMatrixAndCharts();
        window.switchExecutiveTab('tables');
        window.switchExecutiveTab('charts');
        window.closeExecutiveDashboard();
    } catch (err) {
        lifecycleErrors.push({ cycle, error: err.message });
    }
}

const endMemCycle = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

assert(lifecycleErrors.length === 0, `100 consecutive lifecycle cycles executed with zero exceptions (Errors: ${lifecycleErrors.length})`);
assert(MockChart.canvasReuseErrors === 0, `Zero "Canvas is already in use" errors detected during 100 cycles (Canvas reuse errors: ${MockChart.canvasReuseErrors})`);
assert(MockChart.activeInstances.size === 0, `Zero chart instances leaked in registry after 100 cycles (Active: ${MockChart.activeInstances.size})`);
assert(MockChart.peakActive === 3, `Peak active chart count never exceeded 3 (Peak: ${MockChart.peakActive})`);
assert(MockChart.totalCreated === MockChart.totalDestroyed, `All created charts were destroyed: created=${MockChart.totalCreated}, destroyed=${MockChart.totalDestroyed}`);


// Test 2.2: Double Render / Tab Thrashing Without Close
console.log('\n[Scenario 2.2: Rapid Tab Thrashing / Re-render Without Closing Modal]');
MockChart.resetStats();
window.openExecutiveDashboard('charts');

for (let i = 0; i < 20; i++) {
    // Calling render without closing modal must cleanly destroy previous charts
    window.renderExecutiveMatrixAndCharts();
}
assert(MockChart.canvasReuseErrors === 0, 'Zero canvas reuse errors during 20 rapid re-renders without close');
assert(MockChart.activeInstances.size === 3, `Active instances after rapid re-renders is exactly 3 (Observed: ${MockChart.activeInstances.size})`);
window.closeExecutiveDashboard();
assert(MockChart.activeInstances.size === 0, 'Active instances cleaned to 0 upon modal close');


// ============================================================================
// TEST SUITE 3: REACTIVE DRILL-DOWN COMPOUND FILTERING & REVERSIBILITY
// ============================================================================
console.log('\n----------------------------------------------------------------------');
console.log('SUITE 3: Reactive Drill-Down Compound Filtering & Reversibility');
console.log('----------------------------------------------------------------------');

// Restore synthetic projects dataset
appData = { directProjects: directList, modules: moduleList };

// Test 3.1: Drill-down from Matrix Cell (Empresa + Estado)
console.log('\n[Scenario 3.1: Matrix Cell Drill-Down]');
window.clearExecutiveDrillDown();
window.setExecutiveDrillDown({ empresa: 'AFR', estado: 'Liberado' });

const pillTextEl = mockDoc.getElementById('execActiveDrillDownText');
const pillContEl = mockDoc.getElementById('execActiveDrillDownPill');
assert(pillTextEl.textContent === 'Filtro: AFR + Liberado', `Pill displays compounded filter text (Observed: "${pillTextEl.textContent}")`);
assert(!pillContEl.classList.contains('hidden'), 'Pill container is visible (does not have "hidden")');

window.renderExecutiveTable();
const tableCellFiltered = mockDoc.getElementById('execTableContainer').innerHTML;
assert(!tableCellFiltered.includes('No se encontraron'), 'Filtered table contains matching records');
assert(!tableCellFiltered.includes('Retraso STGT'), 'Filtered table excludes non-matching statuses (e.g. Retraso STGT)');

// Test 3.2: 4-Way Compounding (Empresa + Estado + Paquete + Tipo Propuesta)
console.log('\n[Scenario 3.2: 4-Way Compounded Filter]');
window.setExecutiveDrillDown({ paquete: 'Paquete 1', tipo_propuesta: 'Mantenimiento' });
assert(pillTextEl.textContent === 'Filtro: AFR + Liberado + Paquete 1 + Mantenimiento', `Pill reflects 4-way filter compounding: "${pillTextEl.textContent}"`);

// Test 3.3: Preset Pills Compounding
console.log('\n[Scenario 3.3: Preset Pills Compounding]');
// Clear to test presets cleanly
window.clearExecutiveDrillDown();

// Test preset: retraso_stgt
window.setExecutivePreset('retraso_stgt');
const tableRetrasoHtml = mockDoc.getElementById('execTableContainer').innerHTML;
assert(!tableRetrasoHtml.includes('Liberado'), 'Preset "Retraso STGT" excludes Liberado projects');

// Test preset: alta_dir
window.setExecutivePreset('alta_dir');
const tableAltaDirHtml = mockDoc.getElementById('execTableContainer').innerHTML;
assert(tableAltaDirHtml.includes('Relevante Alta Dir'), 'Preset "alta_dir" displays relevant Alta Dirección items');

// Test preset: stgt
window.setExecutivePreset('stgt');
const tableStgtHtml = mockDoc.getElementById('execTableContainer').innerHTML;
assert(tableStgtHtml.includes('Relevante STGT'), 'Preset "stgt" displays relevant STGT items');

// Test preset: auditoria
window.setExecutivePreset('auditoria');
const tableAuditHtml = mockDoc.getElementById('execTableContainer').innerHTML;
assert(!tableAuditHtml.includes('No se encontraron'), 'Preset "auditoria" successfully filters projects with fecha_compromiso docs');

// Test 3.4: Live Search Compounding
console.log('\n[Scenario 3.4: Live Search Compounding]');
window.setExecutivePreset('ALL');
window.handleExecutiveSearch('erp');
const tableSearchHtml = mockDoc.getElementById('execTableContainer').innerHTML;
assert(!tableSearchHtml.includes('No se encontraron'), 'Search for "erp" returns matching records');

// Compound search with drill-down
window.setExecutiveDrillDown({ empresa: 'CETRAM' });
const tableCompoundedSearch = mockDoc.getElementById('execTableContainer').innerHTML;
assert(!tableCompoundedSearch.includes('No se encontraron') && tableCompoundedSearch.includes('CETRAM'), 'Compounded search successfully filters by both search term and drill-down empresa');

// Test 3.5: Full Reversibility on clearExecutiveDrillDown()
console.log('\n[Scenario 3.5: Full Reversibility on Clear Drill-Down]');
window.clearExecutiveDrillDown();

assert(mockDoc.getElementById('execActiveDrillDownPill').classList.contains('hidden'), 'Pill is hidden after clear');
assert(mockDoc.getElementById('execSearchInput').value === '', 'Search input is cleared');

window.renderExecutiveTable();
const restoredTableHtml = mockDoc.getElementById('execTableContainer').innerHTML;
// Count rows rendered in table
const rowCount = (restoredTableHtml.match(/<tr onclick="window\.selectExecutiveTableRow/g) || []).length;
assert(rowCount === 1200, `Table returns to full dataset of 1,200 records on clear (Count: ${rowCount})`);


// Test 3.6: Table Row Selection & InfoCard Reveal
console.log('\n[Scenario 3.6: Non-Destructive Table Row Selection]');
global.lastSelectedNode = null;
const modalEl = mockDoc.getElementById('executiveDashboardModal');
window.openExecutiveDashboard('tables');
assert(!modalEl.classList.contains('hidden'), 'Modal is open before row selection');

window.selectExecutiveTableRow('proj_synth_42', 'direct-project');
assert(global.lastSelectedNode && global.lastSelectedNode.type === 'direct-project' && global.lastSelectedNode.id === 'proj_synth_42', 'selectExecutiveTableRow calls selectNode with correct (type, id)');
assert(modalEl.classList.contains('opacity-0'), 'Modal begins closing (opacity-0 applied) to reveal InfoCard beneath');


// ============================================================================
// TEST SUITE 4: ADVERSARIAL EDGE CASES & SECURITY SANITIZATION
// ============================================================================
console.log('\n----------------------------------------------------------------------');
console.log('SUITE 4: Adversarial Edge Cases & Security Sanitization');
console.log('----------------------------------------------------------------------');

// Test 4.1: Projects with Malformed / Missing Fields
console.log('\n[Scenario 4.1: Malformed & Missing Fields]');
const malformedProjects = [
    { id: 'mal_1' }, // completely empty project
    { id: 'mal_2', name: null, status: null, empresa: null, companies: null, docs: null },
    { id: 'mal_3', status: 'STATUS_INEXISTENTE_XYZ', empresa: 'EMPRESA_DESCONOCIDA_123' }
];

appData = { directProjects: malformedProjects, modules: [] };
let malformedError = null;

try {
    window.renderExecutiveMatrixAndCharts();
    window.renderExecutiveTable();
} catch (err) {
    malformedError = err;
}

assert(malformedError === null, `Malformed projects handled gracefully without throwing unhandled exceptions (Error: ${malformedError ? malformedError.message : 'none'})`);

// Test 4.2: XSS & HTML Injection Attack Vectors
console.log('\n[Scenario 4.2: XSS & HTML Injection Sanitization in Table]');
const xssProjects = [
    {
        id: 'xss_1',
        name: '<script>alert("pwned_name")</script>',
        empresa: '<b onmouseover=alert("xss_emp")>AFR</b>',
        observacion_ejecutiva: '<img src=x onerror=alert("xss_obs")>',
        lider_proyecto: '<svg onload=alert("xss_lead")>',
        ticket: '123"><script>alert(1)</script>'
    }
];

appData = { directProjects: xssProjects, modules: [] };
window.renderExecutiveTable();

const xssTableHtml = mockDoc.getElementById('execTableContainer').innerHTML;
assert(!xssTableHtml.includes('<script>alert("pwned_name")</script>'), 'Project name script tag is sanitized with escapeHtml');
assert(xssTableHtml.includes('&lt;script&gt;alert(&quot;pwned_name&quot;)&lt;/script&gt;'), 'Project name has proper HTML entity escaping');
assert(!xssTableHtml.includes('<img src=x onerror='), 'Observation img onerror tag is sanitized');
assert(!xssTableHtml.includes('<svg onload='), 'Leader svg onload tag is sanitized');

// Test 4.3: Search Domain Surface & Blindspot Audit
console.log('\n[Scenario 4.3: Search Domain Surface & Blindspot Audit]');
const searchAuditProjs = [
    {
        id: 'search_audit_1',
        name: 'Plataforma Fiscal Integral',
        empresa: 'AFR',
        companies: ['AFR', 'ZIN'],
        status: 'Liberado',
        ticket: '99881',
        area_solicitante: 'Finanzas Corporativas',
        lider_proyecto: 'Carlos Lead',
        consultor: 'Ana Consultora',
        tester: 'Pedro QA',
        programador: 'Luis Dev',
        observacion_ejecutiva: 'Obs Especial Alpha'
    }
];
appData = { directProjects: [], modules: [{ id: 'mod_fin', name: 'Finanzas', color: '#3b82f6', projects: searchAuditProjs }] };

// Supported search fields
window.handleExecutiveSearch('Plataforma');
assert(mockDoc.getElementById('execTableContainer').innerHTML.includes('Plataforma Fiscal'), 'Search finds project by name');

window.handleExecutiveSearch('Finanzas');
assert(mockDoc.getElementById('execTableContainer').innerHTML.includes('Plataforma Fiscal'), 'Search finds project by moduleName');

window.handleExecutiveSearch('Liberado');
assert(mockDoc.getElementById('execTableContainer').innerHTML.includes('Plataforma Fiscal'), 'Search finds project by status');

window.handleExecutiveSearch('Carlos Lead');
assert(mockDoc.getElementById('execTableContainer').innerHTML.includes('Plataforma Fiscal'), 'Search finds project by lider_proyecto');

window.handleExecutiveSearch('Ana Consultora');
assert(mockDoc.getElementById('execTableContainer').innerHTML.includes('Plataforma Fiscal'), 'Search finds project by consultor');

window.handleExecutiveSearch('Pedro QA');
assert(mockDoc.getElementById('execTableContainer').innerHTML.includes('Plataforma Fiscal'), 'Search finds project by tester');

window.handleExecutiveSearch('Luis Dev');
assert(mockDoc.getElementById('execTableContainer').innerHTML.includes('Plataforma Fiscal'), 'Search finds project by programador');

window.handleExecutiveSearch('Alpha');
assert(mockDoc.getElementById('execTableContainer').innerHTML.includes('Plataforma Fiscal'), 'Search finds project by observacion_ejecutiva');

// Edge case analysis: secondary company search vs primary
window.handleExecutiveSearch('ZIN');
const secondaryMatch = mockDoc.getElementById('execTableContainer').innerHTML.includes('Plataforma Fiscal');
// In app.js line 13738: pEmp = p.empresa || p.companies[0]. Since empresa is 'AFR', 'ZIN' is not in pEmp.
// textToSearch does not include p.companies. Record empirical observation.
console.log(`    [Adversarial Probe] Search by secondary company ('ZIN') match result: ${secondaryMatch}`);

// Test 4.4: Modal Animation & Fast Close/Open Transition Safety
console.log('\n[Scenario 4.4: Modal Animation & Rapid Re-open Safety]');
window.closeExecutiveDashboard();
const modalCloseCheck = mockDoc.getElementById('executiveDashboardModal');
assert(modalCloseCheck.classList.contains('opacity-0'), 'Modal receives opacity-0 immediately on close');

window.openExecutiveDashboard('charts');
assert(!modalCloseCheck.classList.contains('hidden') && !modalCloseCheck.classList.contains('opacity-0'), 'openExecutiveDashboard immediately removes hidden and opacity-0');
window.closeExecutiveDashboard();


// ============================================================================
// FINAL SUMMARY & RESULTS
// ============================================================================
console.log('\n======================================================================');
console.log(`STRESS TEST VERIFICATION SUMMARY:`);
console.log(`Total Assertions Run: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log('======================================================================\n');

if (failedTests > 0) {
    console.error(`VERDICT: REJECT (${failedTests} test failures detected)`);
    process.exit(1);
} else {
    console.log('VERDICT: APPROVE (100% of adversarial stress tests passed cleanly)');
    process.exit(0);
}
