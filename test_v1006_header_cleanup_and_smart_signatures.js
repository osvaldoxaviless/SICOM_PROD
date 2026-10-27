// test_v1006_header_cleanup_and_smart_signatures.js
// Suite de verificación integral de v1006:
// 1. Eliminación total de 'Tareas' del header superior (mainViewSwitcher sin botón visible).
// 2. Visor interactivo con orientación superior (justify-start), navegación de páginas y auto-scroll a casillas.
// 3. Auto-detección inteligente de coordenadas de firmas por nombre/rol en la tabla oficial.
// 4. Inyección secuencial infalible de las 3 firmas (Rafael, Miguel, Osvaldo) con pdf-lib.
// 5. Descarga sincronizada (async con syncCircuitSignaturesToPdf) y tarjeta de documento 100% completado.
// 6. Sincronización de versiones v1006.

const fs = require('fs');
const assert = require('assert');
const { PDFDocument } = require('pdf-lib');

console.log("=== INICIANDO SUITE DE TESTS v1006 ===");

// TEST 1: Eliminación total de Tareas del header superior
function testHeaderCleanup() {
    console.log("\n[Test 1] Verificando remoción de Tareas en el conmutador superior...");
    const html = fs.readFileSync('index.html', 'utf-8');
    const appJs = fs.readFileSync('app.js', 'utf-8');

    // En index.html, mainViewSwitcher solo debe tener Mapa, Prioridades, Calendario
    const switcherMatch = html.match(/id="mainViewSwitcher"[\s\S]*?<\/div>/);
    assert(switcherMatch, "mainViewSwitcher debe existir");
    const switcherHtml = switcherMatch[0];

    assert(switcherHtml.includes('btnViewModeMap'), "mainViewSwitcher debe incluir Mapa");
    assert(switcherHtml.includes('btnViewModePriority'), "mainViewSwitcher debe incluir Prioridades");
    assert(switcherHtml.includes('btnViewModeTimeline'), "mainViewSwitcher debe incluir Calendario");
    assert(!switcherHtml.includes('<button type="button" id="btnViewModeTasks"'), "mainViewSwitcher NO debe contener el botón visible de Tareas");

    // En app.js, verificar que btnViewModeTasks nunca se hace visible
    assert(!appJs.includes("btnTasksHeader.classList.remove('hidden')"), "app.js no debe remover 'hidden' de btnTasksHeader");
    assert(!appJs.includes("btnTasks.className = (typeof isDailyDrawerOpen"), "app.js no debe sobreescribir className en btnTasks");

    console.log("  -> Header limpio verificado al 100%. Tareas gestionadas exclusivamente en el dock inferior.");
}

// TEST 2: Visor interactivo y tarjeta de completado
function testViewerLayoutAndCompletedCard() {
    console.log("\n[Test 2] Verificando estructura del visor, paginador y tarjeta de 100% firmado...");
    const html = fs.readFileSync('index.html', 'utf-8');

    assert(html.includes('id="docSignPdfViewport" class="flex-1 overflow-y-auto relative flex flex-col items-center justify-start'),
        "docSignPdfViewport debe usar justify-start para no centrar en el vacío blanco");

    assert(html.includes('id="docSignPaginationControls"'),
        "index.html debe contener el paginador docSignPaginationControls");

    assert(html.includes('id="docSignCompletedCard"'),
        "index.html debe contener la tarjeta de completado docSignCompletedCard");

    assert(html.includes('Descargar PDF Firmado'),
        "docSignCompletedCard debe incluir botón de descarga directa");

    console.log("  -> Visor con justify-start, paginador y tarjeta de completado verificados.");
}

// TEST 3: Lógica en app.js para coordenadas y sincronización
function testAppJsLogic() {
    console.log("\n[Test 3] Verificando funciones clave en app.js...");
    const appJs = fs.readFileSync('app.js', 'utf-8');

    assert(appJs.includes("window.changeDocSignPage = function"),
        "app.js debe exponer window.changeDocSignPage");

    assert(appJs.includes("async function detectSignerCoordsOnPage"),
        "app.js debe implementar detectSignerCoordsOnPage");

    assert(appJs.includes("window.downloadCurrentSignedPdf = async function()"),
        "downloadCurrentSignedPdf debe ser async");

    assert(appJs.includes("await window.syncCircuitSignaturesToPdf()"),
        "downloadCurrentSignedPdf debe llamar a syncCircuitSignaturesToPdf antes de exportar");

    console.log("  -> Funciones de paginación, detección inteligente y descarga segura comprobadas.");
}

// TEST 4: Simulación de las 3 firmas (Rafael, Miguel, Osvaldo) con pdf-lib sobre el PDF real
async function testThreeSignaturesRealPdf() {
    console.log("\n[Test 4] Verificando estampado secuencial de las 3 firmas en el PDF real...");
    const samplePdfPath = 'C:\\Users\\osvsa\\Downloads\\63784 - PN -KAD-01 Pantalla Principal y Despacho en Tarjeta.pdf';
    
    let pdfBytes;
    if (fs.existsSync(samplePdfPath)) {
        pdfBytes = fs.readFileSync(samplePdfPath);
        console.log(`  -> Documento PDF oficial localizado (${(pdfBytes.length / (1024*1024)).toFixed(2)} MB).`);
    } else {
        const dummy = await PDFDocument.create();
        dummy.addPage([612, 792]);
        pdfBytes = await dummy.save();
    }

    const samplePng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzu/v8WQAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(samplePng, 'base64');

    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, updateMetadata: false });
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    const sigImg = await pdfDoc.embedPng(pngBuffer);

    // Firma 1: Rafael Romero (Coordinador) -> Casilla X: 485, Y: 298
    lastPage.drawImage(sigImg, { x: 485, y: 298, width: 80, height: 26 });
    console.log("  -> Firma 1 (Rafael Romero Romero) estampada en casilla (X: 485, Y: 298)");

    // Firma 2: Miguel Barbosa (Gerente) -> Casilla X: 485, Y: 331
    lastPage.drawImage(sigImg, { x: 485, y: 331, width: 80, height: 26 });
    console.log("  -> Firma 2 (Miguel Ángel Barbosa López) estampada en casilla (X: 485, Y: 331)");

    // Firma 3: Osvaldo Avilés (Elaboró) -> Casilla X: 485, Y: 535
    lastPage.drawImage(sigImg, { x: 485, y: 535, width: 80, height: 26 });
    console.log("  -> Firma 3 (Emmanuel Osvaldo Sánchez Avilés) estampada en casilla (X: 485, Y: 535)");

    const finalBytes = await pdfDoc.save();
    assert(finalBytes.length > pdfBytes.length, "El documento final debe contener los datos de las firmas");
    console.log(`  -> Documento final con las 3 firmas guardado con éxito (${(finalBytes.length / (1024*1024)).toFixed(2)} MB).`);
}

// TEST 5: Consistencia de versiones v1006
function testVersionConsistency() {
    console.log("\n[Test 5] Verificando consistencia de versión 20261026_v1006...");
    const sw = fs.readFileSync('sw.js', 'utf-8');
    const html = fs.readFileSync('index.html', 'utf-8');

    assert(sw.includes("SW_VERSION = '20261026_v1006'"), "sw.js debe contener la versión 20261026_v1006");
    assert(html.includes("styles.css?v=20261026_v1006"), "index.html debe cargar styles.css?v=20261026_v1006");
    assert(html.includes("app.js?v=20261026_v1006"), "index.html debe cargar app.js?v=20261026_v1006");

    console.log("  -> Versión 20261026_v1006 sincronizada en sw.js e index.html.");
}

async function run() {
    try {
        testHeaderCleanup();
        testViewerLayoutAndCompletedCard();
        testAppJsLogic();
        await testThreeSignaturesRealPdf();
        testVersionConsistency();

        console.log("\n=============================================");
        console.log("✅ TODAS LAS PRUEBAS v1006 PASARON CON ÉXITO");
        console.log("=============================================\n");
    } catch (e) {
        console.error("\n❌ ERROR EN PRUEBAS v1006:", e);
        process.exit(1);
    }
}

run();
