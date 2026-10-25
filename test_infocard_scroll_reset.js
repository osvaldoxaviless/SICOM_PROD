const fs = require('fs');
const assert = require('assert');

console.log('====================================================');
console.log('AUDITORÍA DE RESETEO DE SCROLL EN INFOCARD Y HIGHLIGHT');
console.log('====================================================');

const app = fs.readFileSync('app.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

let passed = 0;
function test(name, fn) {
    try {
        fn();
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } catch(e) {
        console.error(`❌ [FAIL] ${name}:`, e.message);
        process.exit(1);
    }
}

test('app.js: showInfoCard resetea card.scrollTop = 0 al inicio', () => {
    assert(app.includes('card.scrollTop = 0;'));
    assert(app.includes('card.scrollTo({ top: 0, left: 0, behavior: \'instant\' })'));
});

test('app.js: showInfoCard resetea scroll de subcontenedores de tareas, notas y docs', () => {
    assert(app.includes('if (qTasks) qTasks.scrollTop = 0;'));
    assert(app.includes('if (qDocs) qDocs.scrollTop = 0;'));
    assert(app.includes('if (infoNotes) infoNotes.scrollTop = 0;'));
});

test('app.js: showInfoCard asegura scroll al tope en ciclo post-render (requestAnimationFrame / setTimeout)', () => {
    assert(app.includes('requestAnimationFrame(() => {'));
    assert(app.includes('if (card) card.scrollTop = 0;'));
});

test('app.js: window.highlightPriorityCard está definido', () => {
    assert(app.includes('window.highlightPriorityCard = function(id)'));
    assert(app.includes('priority-card-active'));
});

test('app.js: selectNode invoca window.highlightPriorityCard', () => {
    assert(app.includes('window.highlightPriorityCard(id);'));
});

test('app.js: renderPriorityBoard asigna data-node-id y evalúa isSelected para tarjeta activa', () => {
    assert(app.includes('data-node-id="${p.id}"'));
    assert(app.includes('const isSelected = currentSelection && currentSelection.id === p.id;'));
    assert(app.includes('priority-card-active'));
});

test('index.html: cache buster actualizado a v971', () => {
    assert(index.includes('app.js?v=20261025_v971'));
});

console.log('====================================================');
console.log(`RESULTADO FINAL: ${passed} de 7 pruebas superadas con éxito (0 fallos).`);
console.log('====================================================');
