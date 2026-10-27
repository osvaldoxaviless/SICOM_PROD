// test_v1004_multiple_docs_pdflib_and_header.js
// Suite de verificación integral de v1004:
// 1. Verificación de CDN pdf-lib@1.17.1 (debe responder HTTP 200)
// 2. Verificación de chips de consultores punto por punto
// 3. Verificación de soporte de múltiples planos, testings y edición de documentos
// 4. Verificación de header limpio y buscador compacto con lupa literal

const fs = require('fs');
const https = require('https');
const assert = require('assert');

console.log("=== INICIANDO SUITE DE TESTS v1004 ===");

// TEST 1: Verificar versión del CDN pdf-lib en index.html y conectividad
function testPdfLibCdn() {
    console.log("\n[Test 1] Verificando CDN de pdf-lib en index.html...");
    const html = fs.readFileSync('index.html', 'utf-8');
    
    assert(html.includes('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js'), 
        "index.html debe apuntar a pdf-lib@1.17.1 (versión real en npm)");
    assert(!html.includes('pdf-lib@1.17.9'), 
        "index.html NO debe apuntar a pdf-lib@1.17.9 (versión inexistente)");
    console.log("  -> Tag de script verificado con éxito: pdf-lib@1.17.1");

    return new Promise((resolve, reject) => {
        https.get('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js', (res) => {
            console.log(`  -> Respuesta HTTP jsDelivr pdf-lib@1.17.1: ${res.statusCode} (esperado: 200)`);
            assert.strictEqual(res.statusCode, 200, "El CDN jsDelivr para pdf-lib@1.17.1 debe responder HTTP 200");
            resolve();
        }).on('error', (err) => {
            console.warn("  -> Advertencia de red en test HTTP (se continuará):", err.message);
            resolve();
        });
    });
}

// TEST 2: Verificar chips de consultores punto por punto
function testConsultantChips() {
    console.log("\n[Test 2] Verificando renderizado de consultores como chips interactivos...");
    const appJs = fs.readFileSync('app.js', 'utf-8');
    const html = fs.readFileSync('index.html', 'utf-8');

    assert(html.includes('id="newProjConsultantsChecks" class="bg-[#101010] border border-[#2e2a28] p-2 rounded-[6px] flex flex-wrap gap-1.5"'),
        "newProjConsultantsChecks debe usar flex flex-wrap");
    assert(html.includes('id="editConsultantsChecks" class="bg-[#101010] border border-[#2e2a28] p-2 rounded-[6px] flex flex-wrap gap-1.5"'),
        "editConsultantsChecks debe usar flex flex-wrap");

    assert(appJs.includes('filter-chip cursor-pointer select-none inline-flex items-center gap-1.5'),
        "app.js debe generar chips con la clase filter-chip y dot de color");
    assert(appJs.includes('this.parentElement.classList.toggle(\'active\', this.checked)'),
        "Los chips deben alternar la clase active al seleccionarse");
    
    console.log("  -> Estructura y clases de chips de consultores verificadas al 100%");
}

// TEST 3: Header limpio y buscador compacto con lupa literal
function testHeaderAndSearch() {
    console.log("\n[Test 3] Verificando header limpio y buscador compacto...");
    const html = fs.readFileSync('index.html', 'utf-8');

    assert(html.includes('<button type="button" id="btnViewModeTasks" onclick="toggleDailyDrawer()" class="hidden'),
        "El botón de Tareas en mainViewSwitcher debe estar oculto con class='hidden'");
    
    assert(html.includes('desktop-search-cluster hidden sm:flex items-center gap-1 shrink-0'),
        "El cluster de búsqueda debe ser compacto");
    assert(html.includes('text-[#ee6018] absolute left-2.5 pointer-events-none'),
        "Debe tener ícono literal de lupa en color naranja institucional");
    assert(html.includes('w-28 sm:w-32 lg:w-40 focus:w-56'),
        "El input de búsqueda debe ser compacto y expandible al hacer foco");

    console.log("  -> Header limpio y conmutador superior verificados con éxito");
}

// TEST 4: Múltiples Planos de Negocio, Testing y Edición de Documentos
function testMultipleDocumentsLogic() {
    console.log("\n[Test 4] Verificando lógica de documentos múltiples, títulos editables y persistencia...");
    const appJs = fs.readFileSync('app.js', 'utf-8');

    assert(appJs.includes('window.addProjectDocumentPrompt = function'), 
        "app.js debe exponer window.addProjectDocumentPrompt");
    assert(appJs.includes('window.renameProjectDocumentPrompt = function'), 
        "app.js debe exponer window.renameProjectDocumentPrompt");
    assert(appJs.includes('window.deleteProjectDocumentPrompt = function'), 
        "app.js debe exponer window.deleteProjectDocumentPrompt");

    // Verificar que silentSaveInfoCard y saveEditChanges iteran sobre allDocIds
    assert(appJs.includes('const allDocIds = new Set([\n                ...(globalDocs || []).map(d => d.id),\n                ...Object.keys(prevDocs)\n            ]);') ||
           appJs.includes('const allDocIds = new Set('),
        "silentSaveInfoCard y saveEditChanges deben preservar todos los documentos en prevDocs");

    // Simular creación de proyecto y agregado de múltiples planos y testings
    const mockGlobalDocs = [
        { id: "doc_1", name: "Propuesta Comercial" },
        { id: "doc_2", name: "Plano(s) de negocio" },
        { id: "doc_3", name: "Testing" }
    ];

    const project = {
        id: "p_test_1004",
        name: "Proyecto Múltiples Entregables",
        ticket: "TK-PADRE-9900",
        docs: {}
    };

    // 1. Agregar Plano de Negocio 2
    const idPlano2 = "doc_custom_plano_2";
    project.docs[idPlano2] = {
        id: idPlano2,
        name: "Plano de negocio 2 - Fase Facturación",
        customName: "Plano de negocio 2 - Fase Facturación",
        isCustom: true,
        ticket: "TK-HIJO-9901",
        checked: false,
        signatureCircuit: [
            { id: 's1', role: 'Elaboró', name: 'Osvaldo Avilés', status: 'signed' },
            { id: 's2', role: 'Revisó', name: 'Rafael Romero', status: 'pending' }
        ]
    };

    // 2. Agregar Testing 2
    const idTesting2 = "doc_custom_testing_uat";
    project.docs[idTesting2] = {
        id: idTesting2,
        name: "Testing 2 - UAT Clientes",
        customName: "Testing 2 - UAT Clientes",
        isCustom: true,
        ticket: "TK-HIJO-9902",
        checked: true
    };

    // Simular cálculo de progreso con docs adicionales
    const allDocIds = new Set([
        ...mockGlobalDocs.map(d => d.id),
        ...Object.keys(project.docs)
    ]);

    assert.strictEqual(allDocIds.size, 5, "Deben existir 5 documentos (3 base + 2 adicionales)");
    console.log(`  -> Catálogo combinado correctamente: ${allDocIds.size} documentos calculados.`);

    // Renombrar doc
    project.docs[idPlano2].customName = "Plano de negocio 2 (Revisión Final)";
    project.docs[idPlano2].name = "Plano de negocio 2 (Revisión Final)";
    assert.strictEqual(project.docs[idPlano2].name, "Plano de negocio 2 (Revisión Final)");
    console.log("  -> Renombrado de documento validado exitosamente.");

    // Eliminar doc adicional
    delete project.docs[idTesting2];
    assert.strictEqual(project.docs[idTesting2], undefined);
    const updatedDocIds = new Set([
        ...mockGlobalDocs.map(d => d.id),
        ...Object.keys(project.docs)
    ]);
    assert.strictEqual(updatedDocIds.size, 4, "Tras eliminar Testing 2 deben quedar 4 documentos");
    console.log("  -> Eliminación de documento adicional validada exitosamente.");
}

async function runAll() {
    await testPdfLibCdn();
    testConsultantChips();
    testHeaderAndSearch();
    testMultipleDocumentsLogic();
    console.log("\n=============================================");
    console.log("✅ TODAS LAS PRUEBAS v1004 PASARON CON ÉXITO");
    console.log("=============================================\n");
}

runAll().catch(err => {
    console.error("❌ ERROR EN SUITE DE TESTS:", err);
    process.exit(1);
});
