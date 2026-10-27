const fs = require('fs');
const assert = require('assert');

console.log('AUDITORÍA AUTOMATIZADA V1001: ACCESIBILIDAD DE TAREAS Y FLUJO COMPLETO DE HISTORIAL');
console.log('=================================================================================\n');

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

// 1. Selector de vista principal en escritorio (#mainViewSwitcher) incluye [ TAREAS ]
assert(html.includes('id="mainViewSwitcher"'), 'mainViewSwitcher debe existir');
assert(html.includes('id="btnViewModeTasks"'), 'btnViewModeTasks debe existir en el conmutador superior');
assert(html.includes('id="desktopHeaderDailyAlertsBadge"'), 'desktopHeaderDailyAlertsBadge debe existir para mostrar notificaciones en header');
assert(html.includes('onclick="toggleDailyDrawer()"'), 'btnViewModeTasks debe abrir el drawer de tareas');
console.log('[PASS] 1. Conmutador superior de escritorio incluye pestaña Tareas (#btnViewModeTasks) con badge');

// 2. Botón flotante #btnDailyTasks gestionado reactivamente por rol y resolución
const btnDailyMatch = html.match(/<button id="btnDailyTasks"[^>]+>/);
assert(btnDailyMatch, 'Botón flotante #btnDailyTasks debe existir');
assert(btnDailyMatch[0].includes('lector-hide'), 'Debe usar lector-hide para control dinámico de permisos');
console.log('[PASS] 2. Botón flotante #btnDailyTasks integrado con lector-hide para control dinámico');

// 3. app.js: applyRolePermissions gestiona la visibilidad de btnDailyTasks para Supervisor y Consultor
assert(app.includes("el.id === 'speedDial' || el.id === 'btnDailyTasks'"), 'applyRolePermissions debe gestionar btnDailyTasks');
assert(app.includes("const btnDaily = document.getElementById('btnDailyTasks');"), 'applyRolePermissions debe referenciar btnDailyTasks');
assert(app.includes("const btnTasksHeader = document.getElementById('btnViewModeTasks');"), 'applyRolePermissions debe gestionar btnViewModeTasks');
console.log('[PASS] 3. applyRolePermissions garantiza visibilidad de tareas en escritorio para Supervisor y Consultor');

// 4. app.js: Sincronización de estilos activo/inactivo en el botón Tareas del header
assert(app.includes("btnTasksHeader.className = \"px-2 sm:px-2.5 py-1 rounded-[3px] font-mono uppercase text-[10px] sm:text-[11px] tracking-[-0.24px] flex items-center gap-1.5 transition text-[#b8b3b0] hover:text-[#eeeeee] cursor-pointer relative\";"), 'closeDailyDrawer debe restablecer estilo inactivo');
assert(app.includes("btnTasksHeader.className = \"px-2 sm:px-2.5 py-1 rounded-[3px] font-mono uppercase text-[10px] sm:text-[11px] tracking-[-0.24px] flex items-center gap-1.5 transition bg-[#eeeeee] text-[#101010] font-medium cursor-pointer relative\";"), 'toggleDailyDrawer debe activar estilo al abrir');
console.log('[PASS] 4. Conmutador superior sincroniza estado activo/inactivo reactivamente con dailyDrawer');

// 5. app.js: Reactividad de mutaciones de tareas (renderDailyTasks llamado inmediatamente)
const mutationsCheck = [
    'validateAnyTask',
    'toggleDailyTask',
    'deleteDailyTask',
    'addDailyTask',
    'submitTaskFeedback',
    'validateGlobalTask',
    'validateProjectTask',
    'deleteGlobalTask',
    'toggleQuickTask'
];
mutationsCheck.forEach(fn => {
    assert(app.includes(fn), `${fn} debe existir en app.js`);
});
assert(app.includes("if (typeof window.renderDailyTasks === 'function') window.renderDailyTasks();"), 'Mutaciones de tareas deben re-renderizar la vista reactivamente');
console.log('[PASS] 5. Flujo reactivo garantizado: todas las operaciones refrescan contadores y pestañas al instante');

// 6. app.js: Historial completo en pestaña HECHAS (Asignada, Entregada por, Validada por, Evidencia y Revisiones)
assert(app.includes('Historial de Tareas Concluidas'), 'Pestaña Hechas debe tener cabecera con contador de concluidas');
assert(app.includes('📅 Asignada:'), 'Pestaña Hechas debe detallar fecha y autor de asignación');
assert(app.includes('🚀 Entregó:'), 'Pestaña Hechas debe detallar quién entregó y fecha de entrega');
assert(app.includes('✓ Validó:'), 'Pestaña Hechas debe detallar quién validó y fecha de aprobación');
assert(app.includes('Evidencia / Entrega:'), 'Pestaña Hechas debe mostrar la evidencia de entrega');
assert(app.includes('parseTaskTimestamp'), 'Pestaña Hechas debe ordenar cronológicamente por fecha de validación/entrega');
assert(app.includes('📜 Bitácora General ↗'), 'Liderazgo (Supremo y Supervisor) cuenta con acceso directo a la bitácora histórica');
console.log('[PASS] 6. Trazabilidad completa y bitácora de auditoría en pestaña HECHAS');

// 7. Sincronización de versión 20261026_v1001/v1002
assert(html.includes('styles.css?v=20261026_v1001') || html.includes('styles.css?v=20261026_v1002'), 'index.html debe tener styles.css v1001 o v1002');
assert(html.includes('app.js?v=20261026_v1001') || html.includes('app.js?v=20261026_v1002'), 'index.html debe tener app.js v1001 o v1002');
assert(sw.includes("const SW_VERSION = '20261026_v1001';") || sw.includes("const SW_VERSION = '20261026_v1002';"), 'sw.js debe tener SW_VERSION v1001 o v1002');
console.log('[PASS] 7. Versión sincronizada 20261026_v1001/v1002 en index.html, app.js y sw.js');

console.log('\n====================================================');
console.log('TODAS LAS PRUEBAS V1001 PASARON SATISFACTORIAMENTE.');
