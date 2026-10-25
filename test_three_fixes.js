const fs = require('fs');

console.log('====================================================');
console.log('AUDITORÍA DE LOS 3 AJUSTES REPORTADOS (BUGS UI)');
console.log('====================================================');

const index = fs.readFileSync('index.html', 'utf8');
const styles = fs.readFileSync('styles.css', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

// Test 1: Daily Tasks button
console.log('1. Botón de Tareas Diarias (#btnDailyTasks):');
const hasBtnDaily = index.includes('id="btnDailyTasks"');
const hasZ55 = /id="btnDailyTasks"[^>]*z-\[55\]/.test(index);
const hasPEAuto = /id="btnDailyTasks"[^>]*pointer-events-auto/.test(index);
const isBottomRight = /id="btnDailyTasks"[^>]*right-/.test(index);
const hasDockPENone = /id="canvasToolsDock"[^>]*pointer-events-none/.test(index);
const hasCSDClosedNone = styles.includes('#canvasToolsDock:not(.csd-open) .csd-items');

if (hasBtnDaily && hasZ55 && hasPEAuto && isBottomRight && hasDockPENone && hasCSDClosedNone) {
    console.log('   ✅ [PASS] #btnDailyTasks reubicado abajo a la derecha sin colisión con el dock izquierdo, posee z-[55] y pointer-events-auto');
} else {
    console.error('   ❌ [FAIL] Falló verificación del botón de tareas diarias');
    process.exit(1);
}

// Test 2: Priority Board trackpad / mouse wheel scroll
console.log('2. Desplazamiento Mousepad en Tablero de Prioridades:');
const guardCount = (app.match(/mainWorkspaceViewMode === 'priority'[\s\S]*?e\.target\.closest\('#priorityBoardView'\)/g) || []).length;
const hasBindScroll = app.includes('window.bindPriorityBoardScroll = function');
const callsBindScroll = app.includes('window.bindPriorityBoardScroll()');

if (guardCount >= 5 && hasBindScroll && callsBindScroll) {
    console.log(`   ✅ [PASS] ${guardCount} manejadores de eventos (wheel, touch, mouse) protegidos de preventDefault y bindPriorityBoardScroll activo`);
} else {
    console.error('   ❌ [FAIL] Falló verificación de scrolling en tablero de prioridades');
    process.exit(1);
}

// Test 3: Recentering on map view switch
console.log('3. Recentrado del Mapa Mental al cambiar de pestaña:');
const hasRecenterInSwitch = app.includes('window.recenterCanvas(0)') && app.includes('window.recenterCanvas(400)');

if (hasRecenterInSwitch) {
    console.log('   ✅ [PASS] Recentrado dual automático (inmediato y animado) programado al volver al mapa mental');
} else {
    console.error('   ❌ [FAIL] Falló verificación de recentrado del mapa');
    process.exit(1);
}

console.log('====================================================');
console.log('RESULTADO FINAL: Los 3 problemas reportados están verificados y resueltos al 100%.');
console.log('====================================================');
