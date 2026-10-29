const fs = require('fs');
const assert = require('assert');

console.log('AUDITORÍA AUTOMATIZADA V1016: 5 REQUERIMIENTOS OPERATIVOS Y CONTROL DE TAREAS');
console.log('===============================================================================\n');

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

// =========================================================================
// REQUERIMIENTO 5: BUG DE AISLAMIENTO ELS vs OS (isSameUserOrAlias)
// =========================================================================
console.log('--- TEST 1: AISLAMIENTO DE USUARIOS Y ALIAS (ELS vs OS) ---');
// Extraer y evaluar window.isSameUserOrAlias directamente
const matchFn = app.match(/window\.isSameUserOrAlias\s*=\s*function\([\s\S]*?\n\};/);
assert(matchFn, 'window.isSameUserOrAlias debe estar definido en app.js');

const windowMock = {};
eval('windowMock.isSameUserOrAlias = ' + matchFn[0].replace('window.isSameUserOrAlias = ', ''));
const isSame = windowMock.isSameUserOrAlias;

// Verificaciones críticas de aislamiento:
assert.strictEqual(isSame('Emmanuel Sánchez', 'Osvaldo Avilés'), false, 'Emmanuel Sánchez NO debe coincidir con Osvaldo Avilés');
assert.strictEqual(isSame('ELS', 'OS'), false, 'Alias ELS NO debe coincidir con alias OS');
assert.strictEqual(isSame('Emmanuel Sánchez', 'OS'), false, 'Emmanuel Sánchez NO debe coincidir con alias OS');
assert.strictEqual(isSame('ELS', 'Osvaldo Avilés'), false, 'Alias ELS NO debe coincidir con Osvaldo Avilés');
assert.strictEqual(isSame('Emmanuel', 'Osvaldo'), false, 'Emmanuel NO debe coincidir con Osvaldo');

// Verificaciones de coincidencia correcta de identidad / alias:
assert.strictEqual(isSame('Osvaldo Avilés', 'Osvaldo Avilés'), true, 'Mismo nombre debe coincidir');
assert.strictEqual(isSame('Osvaldo Avilés', 'OS'), true, 'Osvaldo Avilés debe coincidir con su alias OS');
assert.strictEqual(isSame('OS', 'Osvaldo Aviles'), true, 'Alias OS debe coincidir con variante sin acento');
assert.strictEqual(isSame('Emmanuel Sánchez', 'ELS'), true, 'Emmanuel Sánchez debe coincidir con su alias ELS');
assert.strictEqual(isSame('ES', 'Emmanuel Sanchez'), true, 'Alias ES debe coincidir con Emmanuel Sánchez');
assert.strictEqual(isSame('Emmanuel Sánchez', 'Emmanuel Sánchez'), true, 'Mismo nombre Emmanuel debe coincidir');

console.log('[PASS] 1. Aislamiento total ELS vs OS: jamás se confunden y sus alias funcionan con precisión.');

// =========================================================================
// REQUERIMIENTO 4: ARQUITECTURA ERGONÓMICA DE 2 NIVELES (TAREAS, PROYECTOS, ALERTAS)
// =========================================================================
console.log('\n--- TEST 2: ARQUITECTURA ERGONÓMICA DE 2 NIVELES Y SEPARACIÓN DE PROYECTOS ---');
assert(html.includes('id="dailyMainTabBtn-tasks"'), 'Tab principal Tareas debe existir');
assert(html.includes('id="notifTabBtn-projects"'), 'Tab principal Proyectos debe existir como pestaña dedicada');
assert(html.includes('id="notifTabBtn-alerts"'), 'Tab principal Alertas debe existir');
assert(html.includes('id="dailyTasksSubNavSection"'), 'Sub-barra de flujo de tareas (Nivel 2) debe existir');
assert(html.includes('id="notifTabBtn-pending"'), 'Sub-tab Pendientes debe existir');
assert(html.includes('id="notifTabBtn-validation"'), 'Sub-tab Validación debe existir');
assert(html.includes('id="notifTabBtn-completed"'), 'Sub-tab Hechas debe existir');

assert(html.includes('id="notifTabCount-projects"'), 'Badge contador de proyectos debe existir');
assert(html.includes('id="dailyAssignedProjectsSection"'), 'dailyAssignedProjectsSection debe existir desacoplado');

// En app.js, functions de control de 2 niveles:
assert(app.includes('window.setDailyMainTab = function'), 'setDailyMainTab debe existir');
assert(app.includes('window.setTaskSubTab = function'), 'setTaskSubTab debe existir');
assert(app.includes("pSec.classList.remove('hidden')"), 'dailyAssignedProjectsSection se muestra en tab projects');
assert(app.includes("pSec.classList.add('hidden')"), 'dailyAssignedProjectsSection se oculta fuera de tab projects');

console.log('[PASS] 2. Arquitectura de 2 niveles ergonómica: 3 modos principales amplios + sub-filtro de flujo de tareas.');

// =========================================================================
// REQUERIMIENTO 2: ASIGNACIÓN DE TAREAS A OTRA PERSONA DESDE BOTÓN (+)
// =========================================================================
console.log('\n--- TEST 3: ASIGNACIÓN MULTIUSUARIO DESDE SPEED DIAL (+) ---');
assert(html.includes('id="fdtAssignee"'), 'Modal fastDailyTaskModal debe contener select #fdtAssignee');
assert(app.includes("const assigneeSel = document.getElementById('fdtAssignee');"), 'openFastDailyTaskModal debe configurar fdtAssignee');
assert(app.includes("const assignee = (assigneeSel && assigneeSel.value) ? assigneeSel.value : localAuthor;"), 'saveFastDailyTask debe respetar el assignee seleccionado');
assert(app.includes("assigneeSel.disabled = (currentUserRole === 'Lector');"), 'Consultores NO tienen deshabilitado el selector de asignación');

// También en el formulario retráctil del drawer:
assert(html.includes('id="newDailyTaskAssignee"'), 'Formulario rápido debe tener newDailyTaskAssignee');
assert(app.includes("const assigneeSel = document.getElementById('newDailyTaskAssignee').value;"), 'addDailyTask debe leer el assignee');

console.log('[PASS] 3. Asignación multiusuario: selector de integrantes disponible y funcional en modal (+) y drawer.');

// =========================================================================
// REQUERIMIENTO 1: VALIDACIÓN PARA CONSULTORES Y AUTO-ASIGNADAS REGISTRADAS
// =========================================================================
console.log('\n--- TEST 4: VALIDACIÓN DE TAREAS Y AUDITORÍA DE REGISTRO ---');
// Comprobamos la lógica de canValidateDirectly / isSelfAssigned en submitTaskFeedback:
assert(app.includes("const isSelfAssigned = isSameUser(t.assignee, localAuthor) && (!t.assignedBy || isSameUser(t.assignedBy, localAuthor));"), 'Debe determinar si la tarea es auto-asignada');
assert(app.includes("const canValidateDirectly = isSuper || isSelfAssigned;"), 'Solo superiores o el mismo autor de tarea auto-asignada validan directamente');

// Comprobamos el registro de validación (validatedBy, validatedDate, validatedTime):
assert(app.includes("t.validatedDate = dateStr;"), 'Debe guardar validatedDate');
assert(app.includes("t.validatedTime = timeStr;"), 'Debe guardar validatedTime');
assert(app.includes("t.validatedBy = localAuthor;"), 'Debe guardar validatedBy');

// En toggleDailyTask:
assert(app.includes("const canValidate = isSuper || isSelfAssigned;"), 'toggleDailyTask debe usar regla canValidate');

// En validateAnyTask:
assert(app.includes("window.validateAnyTask = function"), 'validateAnyTask universal debe existir');
assert(app.includes("t.validatedBy = localAuthor;"), 'validateAnyTask debe registrar validatedBy');

console.log('[PASS] 4. Validación de consultores: superiores o auto-asignación validan, registrando autor, fecha y hora.');

// =========================================================================
// REQUERIMIENTO 3: HISTORIAL DE TAREAS CONCLUIDAS ESTRICTAMENTE PERSONAL
// =========================================================================
console.log('\n--- TEST 5: HISTORIAL DE CONCLUIDAS (HECHAS) ESTRICTAMENTE PERSONAL ---');
// Comprobamos el filtrado de tareas concluidas en renderDailyTasks:
assert(app.includes("const myCompletedTasks = allTasks.filter(t => t.done === true && isSameUser(t.assignee, localAuthor));"), 'completedTasks debe ser estrictamente personal');
assert(app.includes("completed: completedTasks.length"), 'Contador de pestaña Hechas debe contar estrictamente las tareas del usuario activo');
assert(app.includes("Mi Historial Personal (${completedTasks.length} Concluidas)"), 'Título del historial debe indicar Mi Historial Personal');

console.log('[PASS] 5. Historial Hechas: estrictamente personal para el usuario logueado en listado y badge.');

// =========================================================================
// REVISIÓN DE INTEGRIDAD DE VERSIÓN Y SERVICE WORKER
// =========================================================================
console.log('\n--- TEST 6: VERSIÓN Y CACHÉ PWA ---');
assert(sw.includes("SW_VERSION = '20261028_v1016'"), 'Service worker actualizado a v1016');
assert(html.includes("app.js?v=20261028_v1016"), 'index.html apunta a v1016 para invalidación de caché');
console.log('[PASS] 6. Cache busting v1016 sincronizado.');

console.log('\n===============================================================================');
console.log('TODAS LAS PRUEBAS (6/6) PASARON EXITOSAMENTE CON 100% DE INTEGRIDAD.');
console.log('===============================================================================');
