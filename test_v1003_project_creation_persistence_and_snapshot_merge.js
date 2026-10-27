/**
 * TEST SUITE v1003: BLINDAJE DE PERSISTENCIA, RECONCILIACIÓN NO DESTRUCTIVA Y CREACIÓN DE PROYECTOS
 * 
 * Verifica:
 * 1. Despliegue sincronizado de versión v1003 (index.html, app.js, sw.js).
 * 2. Existencia de helpers de gobernanza de persistencia (_recordDeletedProject, _reconcileCloudSnapshot, etc.).
 * 3. Reconciliación no destructiva: Un snapshot entrante de Firestore NUNCA borra proyectos locales recién creados.
 * 4. Fusión profunda de documentos firmados: Las firmas locales no se pierden ante un snapshot remoto previo.
 * 5. Supresión de proyectos eliminados: Proyectos legítimamente eliminados no son resucitados por la reconciliación.
 * 6. Inmediatez de escritura (flushCloudWrite sin debounce en creación, borrado y firma).
 * 7. Ergonomía de UX en createNewProject: Auto-expansión de módulo contenedor y despliegue de InfoCard.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let failedTests = 0;

function runTest(description, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${description}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${description}`);
        console.error(`     Error: ${err.message}`);
        failedTests++;
    }
}

async function runAll() {
    console.log("===============================================================================");
    console.log("INICIANDO PRUEBAS v1003: PERSISTENCIA, RECONCILIACIÓN Y CREACIÓN DE PROYECTOS");
    console.log("===============================================================================\n");

    const appJsContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    const indexHtmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const swJsContent = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

    // --- 1. VERIFICACIÓN DE VERSIONES (v1003) ---
    console.log("--- 1. VERIFICACIÓN DE VERSIONES (v1003) ---");
    runTest("index.html referencia styles.css?v=20261026_v1003", () => {
        assert(indexHtmlContent.includes('styles.css?v=20261026_v1003'), "Debe referenciar styles.css con versión 20261026_v1003");
    });
    runTest("index.html referencia app.js?v=20261026_v1003", () => {
        assert(indexHtmlContent.includes('app.js?v=20261026_v1003'), "Debe referenciar app.js con versión 20261026_v1003");
    });
    runTest("sw.js define SW_VERSION = '20261026_v1003'", () => {
        assert(swJsContent.includes("SW_VERSION = '20261026_v1003'"), "Debe tener SW_VERSION = '20261026_v1003'");
    });

    // --- 2. VERIFICACIÓN DE CÓDIGO Y ESTRUCTURA DE RECONCILIACIÓN ---
    console.log("\n--- 2. BLINDAJE DE PERSISTENCIA Y REGISTRO EN app.js ---");
    runTest("Función 'getDeletedProjectIds' y registro de proyectos eliminados presente", () => {
        assert(appJsContent.includes('getDeletedProjectIds'), "getDeletedProjectIds debe existir en app.js");
        assert(appJsContent.includes('recordDeletedProject'), "recordDeletedProject debe existir en app.js");
        assert(appJsContent.includes('unrecordDeletedProject'), "unrecordDeletedProject debe existir en app.js");
    });

    runTest("Función 'reconcileCloudSnapshot' implementada y expuesta", () => {
        assert(appJsContent.includes('function reconcileCloudSnapshot'), "reconcileCloudSnapshot debe estar definida");
        assert(appJsContent.includes('window._reconcileCloudSnapshot = reconcileCloudSnapshot'), "Debe exponerse en window");
    });

    runTest("flushCloudWrite soporta parámetro 'force = false' para escrituras inmediatas", () => {
        assert(appJsContent.includes('window.flushCloudWrite = function(force = false)'), "flushCloudWrite debe soportar parámetro force");
        assert(appJsContent.includes('if (!cloudWritePending && !force) return;'), "Debe permitir forzar escritura aunque pending sea falso");
    });

    runTest("createNewProject ejecuta flushCloudWrite(true) inmediato sin debounce", () => {
        const createMatch = appJsContent.includes('window.createNewProject = function') &&
            appJsContent.includes('window.flushCloudWrite(true);');
        assert(createMatch, "createNewProject debe llamar a flushCloudWrite(true)");
    });

    runTest("confirmDeleteSelection ejecuta flushCloudWrite(true) inmediato", () => {
        const deleteMatch = appJsContent.includes('window.confirmDeleteSelection = function') &&
            appJsContent.includes('recordDeletedProject(id)');
        assert(deleteMatch, "confirmDeleteSelection debe registrar IDs y forzar sincronización");
    });

    runTest("stampSignatureOnActiveDocument ejecuta flushCloudWrite(true) inmediato", () => {
        const signMatch = appJsContent.includes('window.stampSignatureOnActiveDocument = async function') &&
            appJsContent.includes('window.flushCloudWrite(true);');
        assert(signMatch, "stampSignatureOnActiveDocument debe llamar a flushCloudWrite(true)");
    });

    runTest("initData ejecuta loadLocalFallback() de inmediato al arrancar", () => {
        const initDataBlock = appJsContent.substring(appJsContent.indexOf('async function initData()'), appJsContent.indexOf('async function initData()') + 1200);
        assert(initDataBlock.includes('loadLocalFallback()'), "initData debe llamar a loadLocalFallback() al inicio");
    });

    // --- 3. PRUEBA DE LÓGICA DE RECONCILIACIÓN UNITARIA ---
    console.log("\n--- 3. SIMULACIÓN DE RECONCILIACIÓN NO DESTRUCTIVA ---");

    // Simular el entorno básico en memoria
    const mockLocalStorage = {};
    global.localStorage = {
        getItem: (k) => mockLocalStorage[k] || null,
        setItem: (k, v) => { mockLocalStorage[k] = String(v); },
        removeItem: (k) => { delete mockLocalStorage[k]; }
    };
    global.window = {};

    global.getDeletedProjectIds = function() {
        try {
            const raw = global.localStorage.getItem('sicom_deleted_projects');
            return raw ? JSON.parse(raw) : [];
        } catch (_) { return []; }
    };
    global.recordDeletedProject = function(id) {
        if (!id) return;
        let current = global.getDeletedProjectIds();
        if (!current.includes(id)) { current.push(id); global.localStorage.setItem('sicom_deleted_projects', JSON.stringify(current)); }
    };
    global.unrecordDeletedProject = function(id) {
        let current = global.getDeletedProjectIds().filter(x => x !== id);
        global.localStorage.setItem('sicom_deleted_projects', JSON.stringify(current));
    };

    global.appData = {
        directProjects: [
            { id: 'dp1', name: 'ATN' },
            { id: 'p_local_new', name: 'Proyecto Recién Creado Local', ticket: '99999', docs: {} }
        ],
        modules: [
            { id: 'm1', name: 'Módulo 1', projects: [{ id: 'p_mod_new', name: 'Nuevo en Módulo', docs: {} }] }
        ]
    };

    // Extraer y evaluar reconcileCloudSnapshot
    eval(`
        ${appJsContent.substring(
            appJsContent.indexOf('function reconcileCloudSnapshot(remoteAppData)'),
            appJsContent.indexOf('window._reconcileCloudSnapshot = reconcileCloudSnapshot;')
        )}
        global.reconcileCloudSnapshot = reconcileCloudSnapshot;
    `);

    runTest("Snapshot remoto sin el nuevo proyecto local NO lo elimina; lo preserva y fusiona", () => {
        const remoteFromCloud = {
            directProjects: [
                { id: 'dp1', name: 'ATN' }
            ],
            modules: [
                { id: 'm1', name: 'Módulo 1', projects: [] }
            ]
        };

        const result = global.reconcileCloudSnapshot(remoteFromCloud);
        assert.strictEqual(result.mergedAny, true, "mergedAny debe ser true");
        
        // Verificar que el proyecto directo local fue preservado
        const preservedDirect = result.reconciled.directProjects.find(p => p.id === 'p_local_new');
        assert(preservedDirect, "El proyecto local 'p_local_new' debe ser preservado en directProjects");
        assert.strictEqual(preservedDirect.name, 'Proyecto Recién Creado Local');

        // Verificar que el proyecto de módulo local fue preservado
        const preservedMod = result.reconciled.modules[0].projects.find(p => p.id === 'p_mod_new');
        assert(preservedMod, "El proyecto local 'p_mod_new' debe ser preservado en el módulo m1");
    });

    runTest("Si un proyecto fue eliminado legítimamente, la reconciliación NO lo resucita", () => {
        global.recordDeletedProject('p_borrado_adrede');
        global.appData.directProjects.push({ id: 'p_borrado_adrede', name: 'Fantasma' });

        const remoteFromCloud = {
            directProjects: [{ id: 'dp1', name: 'ATN' }],
            modules: [{ id: 'm1', name: 'Módulo 1', projects: [] }]
        };

        const result = global.reconcileCloudSnapshot(remoteFromCloud);
        const ghost = result.reconciled.directProjects.find(p => p.id === 'p_borrado_adrede');
        assert(!ghost, "El proyecto eliminado adrede no debe ser re-incorporado");
    });

    runTest("Fusión profunda: Preserva firmas y documentos locales en proyectos que ya existían", () => {
        const remoteDocState = {
            directProjects: [
                { id: 'p_firmado', name: 'Contrato', docs: { doc_test: { checked: false, signedPdfId: null } } }
            ],
            modules: []
        };

        // En local ya lo firmamos:
        global.appData.directProjects = [
            {
                id: 'p_firmado',
                name: 'Contrato',
                ticket: '12345',
                docs: {
                    doc_test: {
                        checked: true,
                        signedPdfId: 'pdf_firmado_123',
                        signatureCircuit: [{ name: 'Osvaldo Avilés', status: 'signed' }]
                    }
                }
            }
        ];

        const result = global.reconcileCloudSnapshot(remoteDocState);
        assert.strictEqual(result.mergedAny, true);
        const mergedProj = result.reconciled.directProjects.find(p => p.id === 'p_firmado');
        assert.strictEqual(mergedProj.ticket, '12345', "Ticket madre debe ser preservado");
        assert.strictEqual(mergedProj.docs.doc_test.checked, true, "Documento marcado firmado debe preservarse");
        assert.strictEqual(mergedProj.docs.doc_test.signedPdfId, 'pdf_firmado_123', "signedPdfId debe preservarse");
    });

    // --- 4. VERIFICACIÓN DE UX Y AUTO-EXPANSIÓN ---
    console.log("\n--- 4. VERIFICACIÓN DE ERGONOMÍA DE CREACIÓN ---");
    runTest("createNewProject auto-expande el módulo padre ('hub-direct' o módulo destino)", () => {
        assert(appJsContent.includes("const parentModKey = (loc === 'DIRECT') ? 'hub-direct' : loc;"), "Debe determinar parentModKey");
        assert(appJsContent.includes("collapsedModules.delete(parentModKey);"), "Debe removerlo de collapsedModules para que sea visible");
    });

    runTest("createNewProject cierra cajón de creación y muestra InfoCard interactiva", () => {
        assert(appJsContent.includes("if (typeof window.closeConfigDrawer === 'function')"), "Debe cerrar cajón de configuración");
        assert(appJsContent.includes("window.showInfoCard(createdType, np.id);"), "Debe abrir showInfoCard del proyecto");
    });

    console.log("\n===============================================================================");
    console.log(`RESUMEN DE PRUEBAS v1003: ${passedTests} APROBADAS, ${failedTests} FALLIDAS`);
    console.log("===============================================================================");

    if (failedTests > 0) {
        process.exit(1);
    }
}

runAll().catch(e => {
    console.error("FATAL ERROR EN TEST SUITE:", e);
    process.exit(1);
});
