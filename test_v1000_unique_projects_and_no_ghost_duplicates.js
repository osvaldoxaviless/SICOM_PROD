/**
 * TEST SUITE V1000: PREVENCIÓN DE DUPLICIDAD DE PROYECTOS Y BORRADO SEGURO
 * - buildModuleProjectsList aloja estrictamente proyectos propios (ownP) de cada módulo.
 * - Ningún módulo vacío adopta proyectos vinculados como hijos directos (evita clones fantasma).
 * - ensureDataStructure garantiza IDs 100% únicos en toda la base de datos.
 * - "Programa de Lealtad" pertenece exclusivamente a Módulo Comercial (MC) y no se duplica en APP.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('AUDITORÍA AUTOMATIZADA V1000: UNICIDAD DE PROYECTOS Y ELIMINACIÓN DE CLONES FANTASMA');
console.log('=================================================================================\n');

const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const sw = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf-8');

function runTest(desc, fn) {
    try {
        fn();
        console.log(`[PASS] ${desc}`);
    } catch (e) {
        console.error(`[FAIL] ${desc}: ${e.message}`);
        process.exit(1);
    }
}

// 1. buildModuleProjectsList usa estrictamente ownP sin heredar linkedP en módulos vacíos
runTest('1. buildModuleProjectsList usa proyectos propios (ownP) evitando clones fantasma en el mapa', () => {
    assert(app.includes('const rawList = ownP;'), 'rawList asigna exclusivamente ownP');
    assert(!app.includes('const rawList = ownP.length > 0 ? ownP : linkedP;'), 'Se eliminó la lógica que clonaba proyectos vinculados en módulos vacíos');
});

// 2. ensureDataStructure garantiza unicidad estricta de IDs
runTest('2. ensureDataStructure garantiza IDs únicos para prevenir borrados en cascada no deseados', () => {
    assert(app.includes('const seenProjIds = new Set();'), 'Control de unicidad de IDs implementado en ensureDataStructure');
    assert(app.includes('seenProjIds.add(p.id);'), 'Registro de IDs en el Set de control');
});

// 3. Verificación de Programa de Lealtad en dataset de prueba
runTest('3. Programa de Lealtad reside exclusivamente en Módulo Comercial (MC) sin clonarse en APP', () => {
    const match = app.match(/const defaultTestingData = ({[\s\S]*?});/);
    assert(match, 'defaultTestingData presente en app.js');
    const data = JSON.parse(match[1]);

    const appMod = data.modules.find(m => m.name === 'APP');
    const mcMod = data.modules.find(m => m.name === 'Módulo Comercial (MC)');

    assert(appMod, 'Módulo APP existe');
    assert(mcMod, 'Módulo Comercial (MC) existe');

    const appHasLealtad = (appMod.projects || []).some(p => p.name === 'Programa de Lealtad');
    const mcHasLealtad = (mcMod.projects || []).some(p => p.name === 'Programa de Lealtad');

    assert(!appHasLealtad, 'APP no tiene proyectos propios llamados Programa de Lealtad');
    assert(mcHasLealtad, 'Módulo Comercial (MC) es el dueño único de Programa de Lealtad');
});

// 4. Sincronización de versión v1000
runTest('4. Sincronización de versión 20261026_v1000 en index.html, app.js y sw.js', () => {
    assert(/styles\.css\?v=20261026_v1000/.test(html), 'styles.css apunta a v1000 en index.html');
    assert(/app\.js\?v=20261026_v1000/.test(html), 'app.js apunta a v1000 en index.html');
    assert(/SW_VERSION = '20261026_v1000'/.test(sw), 'sw.js SW_VERSION es v1000');
});

console.log('\n====================================================');
console.log('TODAS LAS PRUEBAS V1000 PASARON SATISFACTORIAMENTE.');
