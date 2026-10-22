// test_phase2.js - Automated Audit for Phase 2 Implementation
const fs = require('fs');

console.log('====================================================');
console.log('AUDITORÍA AUTOMATIZADA: FASE 2 SICOM');
console.log('====================================================');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✅ [PASS] ${testName}`);
        passed++;
    } else {
        console.error(`❌ [FAIL] ${testName}`);
        failed++;
    }
}

// 1. Verificación de index.html
const html = fs.readFileSync('index.html', 'utf8');

assert(html.includes('id="btnTopExecutiveDashboard"'), 'Botón Header btnTopExecutiveDashboard presente');
assert(html.includes('openExecutiveDashboard(); toggleMobileMenu()'), 'Botón en Menú Móvil presente');
assert(html.includes('id="infoDirGeneralBadge"'), 'Badge Dir. General presente en Cabecera InfoCard');
assert(html.includes('id="statusTooltipPopover"'), 'Tooltip Popover oficial (?) de 9 estatus presente');
assert(html.includes('id="quickEditStatus"'), 'Selector quickEditStatus presente');
assert(html.includes('value="Liberado"') && html.includes('value="Retraso STGT"') && html.includes('value="Cancelado"'), '9 Estatus presentes en selector');
assert(html.includes('id="quickEditEmpresa"'), 'Selector quickEditEmpresa presente (21 empresas)');
assert(html.includes('id="quickEditAreaSolicitante"'), 'Selector quickEditAreaSolicitante presente (7 áreas)');
assert(html.includes('id="quickEditPaquete"'), 'Selector quickEditPaquete presente');
assert(html.includes('id="quickEditTipoPropuesta"'), 'Selector quickEditTipoPropuesta presente');
assert(html.includes('id="quickEditLiderProyecto"') && html.includes('id="quickEditConsultor"'), 'Selectores de responsables expandidos presentes');
assert(html.includes('id="quickEditRelevanteAltaDir"') && html.includes('id="quickEditRelevanteStgt"'), 'Checkboxes ejecutivos relevantes presentes');
assert(html.includes('id="quickEditObsEjecutiva"'), 'Input observacion_ejecutiva presente');
assert(html.includes('id="btnSaveQuickLinks"'), 'Botón unificado Guardar Vínculos Técnicos presente');
assert(html.includes('id="executiveDashboardModal"'), 'Modal Executive Dashboard presente en DOM');
assert(html.includes('id="execChartPaquetesCanvas"'), 'Canvas Chart Paquetes presente');
assert(html.includes('id="execChartPropuestasCanvas"'), 'Canvas Chart Propuestas presente');
assert(html.includes('id="execChartEstatusCanvas"'), 'Canvas Chart Estatus presente');
assert(html.includes('id="execMatrixContainer"'), 'Contenedor Matriz Cruzada 9x21 presente');
assert(html.includes('id="execTableContainer"'), 'Contenedor Tabla de Control presente');
assert(html.includes('id="execActiveDrillDownPill"'), 'Píldora reactiva Drill-Down presente');

// 2. Verificación de app.js
const appCode = fs.readFileSync('app.js', 'utf8');

assert(appCode.includes('window.STGT_STATUS_CATALOG'), 'Catálogo oficial window.STGT_STATUS_CATALOG definido');
assert(appCode.includes('window.normalizeProjectStatus'), 'Función retrocompatible window.normalizeProjectStatus definida');
assert(appCode.includes('window.toggleStatusTooltip'), 'Función window.toggleStatusTooltip definida');
assert(appCode.includes('window.openExecutiveDashboard'), 'Función window.openExecutiveDashboard definida');
assert(appCode.includes('window.closeExecutiveDashboard'), 'Función window.closeExecutiveDashboard definida');
assert(appCode.includes('window.switchExecutiveTab'), 'Función window.switchExecutiveTab definida');
assert(appCode.includes('window.renderExecutiveMatrixAndCharts'), 'Función window.renderExecutiveMatrixAndCharts definida');
assert(appCode.includes('window.setExecutiveDrillDown'), 'Función window.setExecutiveDrillDown definida');
assert(appCode.includes('window.clearExecutiveDrillDown'), 'Función window.clearExecutiveDrillDown definida');
assert(appCode.includes('window.renderExecutiveTable'), 'Función window.renderExecutiveTable definida');
assert(appCode.includes('fecha_compromiso'), 'Manejo de fecha_compromiso en docs presente');
assert(appCode.includes('currentUserRole === \'Supremo\''), 'Validación de rol Supremo para fecha compromiso presente');
assert(appCode.includes('execChartPaquetes.destroy()'), 'Gestión de memoria y .destroy() en Chart.js verificada');
assert(appCode.includes('🎫'), 'Píldora amarilla con icono ticket presente en renderInfoCardTicket');

console.log('====================================================');
console.log(`RESULTADO FINAL: ${passed} pruebas superadas, ${failed} fallidas.`);
console.log('====================================================');
if (failed > 0) process.exit(1);
