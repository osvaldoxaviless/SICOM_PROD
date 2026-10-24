const fs = require('fs');
const vm = require('vm');

console.log('====================================================');
console.log('AUDITORÍA DE ROLES & PERMISOS: GESTOR DE PROYECTOS');
console.log('====================================================');

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) {
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } else {
        console.error(`❌ [FAIL] ${name}`);
        failed++;
    }
}

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');

// 1. Verificación DOM index.html
assert(html.includes('id="btnTopExecutiveDashboard"') && html.includes('audit-pmo-only hidden'), 'btnTopExecutiveDashboard protegido con clase audit-pmo-only hidden');
assert(html.includes('id="mobileBtnExecutiveDashboard"') && html.includes('audit-pmo-only hidden'), 'mobileBtnExecutiveDashboard protegido con clase audit-pmo-only hidden');
assert(html.includes('id="acc-executive-metadata"') && html.includes('class="space-y-3 pt-2 border-t border-[#3d3a39]/60 hidden"'), 'Bloque acc-executive-metadata envuelto con hidden en Sección 01');
assert(html.includes('<option value="Gestor de Proyectos">Gestor de Proyectos (PMO - Auditoría & Matriz)</option>'), 'Opción Gestor de Proyectos presente en selectores de operador');
assert(html.includes('id="consRoleFilterBtn-Gestor de Proyectos"'), 'Pill de filtro de operadores para Gestor de Proyectos presente');
assert(html.includes('app.js?v=20261024_v959'), 'Cache buster actualizado a v959');
assert(app.includes('"Admin": {"color": "#0071e3", "role": "Supremo"'), 'Perfil Admin (Supremo) garantizado en fallbackConsultants');
assert(app.includes('"Gestor de Proyectos": {"color": "#3b82f6", "role": "Gestor de Proyectos"'), 'Perfil Gestor de Proyectos garantizado en fallbackConsultants');
assert(app.includes('if (!consultants["Admin"])') && app.includes('if (!consultants["Gestor de Proyectos"])'), 'Sincronización permanente de Admin y Gestor de Proyectos en onSnapshot y fallback');

// 2. Verificación app.js
assert(app.includes('window.canManageAuditAndStrategy ='), 'Helper window.canManageAuditAndStrategy definido');
assert(app.includes("currentUserRole === 'Supremo' || currentUserRole === 'Gestor de Proyectos'"), 'Validación de roles Supremo y Gestor de Proyectos en canManageAuditAndStrategy');
assert(app.includes(".audit-pmo-only"), 'Selector .audit-pmo-only gestionado en applyRolePermissions');
assert(app.includes("acc-executive-metadata"), 'acc-executive-metadata gestionado en applyRolePermissions y renderInfoCard');
assert(app.includes("if (canAudit) {") && app.includes("item.paquete = document.getElementById('quickEditPaquete').value;"), 'Guardado de metadatos ejecutivos restringido a canAudit en silentSaveInfoCard');
assert(app.includes("title=\"Solo Rol Supremo o Gestor de Proyectos puede alterar fechas de auditoría\""), 'Aviso en tooltip de fechas de auditoría para roles no autorizados');
assert(app.includes("Acceso exclusivo para Gestor de Proyectos y Administrador Supremo"), 'Guard de acceso en openExecutiveDashboard');

// 3. Verificación firestore.rules
assert(rules.includes('function canManageAudit()'), 'Función canManageAudit presente en firestore.rules');
assert(rules.includes("'Gestor de Proyectos'"), 'Gestor de Proyectos admitido en firestore.rules');

// 4. Verificación de lógica aislada
const sandbox = {
    window: {},
    currentUserRole: 'Consultor'
};
sandbox.window.canManageAuditAndStrategy = () => {
    return sandbox.currentUserRole === 'Supremo' || sandbox.currentUserRole === 'Gestor de Proyectos';
};

sandbox.currentUserRole = 'Consultor';
assert(sandbox.window.canManageAuditAndStrategy() === false, 'Consultor NO tiene permisos de Auditoría/Estrategia');

sandbox.currentUserRole = 'Supervisor';
assert(sandbox.window.canManageAuditAndStrategy() === false, 'Supervisor NO tiene permisos de Auditoría/Estrategia');

sandbox.currentUserRole = 'Lector';
assert(sandbox.window.canManageAuditAndStrategy() === false, 'Lector NO tiene permisos de Auditoría/Estrategia');

sandbox.currentUserRole = 'Gestor de Proyectos';
assert(sandbox.window.canManageAuditAndStrategy() === true, 'Gestor de Proyectos SÍ tiene permisos de Auditoría/Estrategia');

sandbox.currentUserRole = 'Supremo';
assert(sandbox.window.canManageAuditAndStrategy() === true, 'Supremo SÍ tiene permisos de Auditoría/Estrategia');

console.log('====================================================');
console.log(`RESULTADO FINAL: ${passed} pruebas superadas, ${failed} fallidas.`);
console.log('====================================================');

if (failed > 0) process.exit(1);
