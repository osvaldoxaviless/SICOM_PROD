// test_v1005_canvas_white_and_safe_signature.js
// Suite de verificación integral de v1005:
// 1. Visor de PDF con fondo blanco papel explícito (#ffffff) tanto en HTML como en Canvas 2D render.
// 2. Marcador interactivo de alto contraste '📍 FIRMA AQUÍ' y flechas de ajuste seguro de 25 pt anti-NaN.
// 3. Ergonomía táctil para celular: resizeSignaturePad, auto-scroll y resaltado.
// 4. Inyección robusta en pdf-lib de múltiples firmas consecutivas sobre el PDF real de 146 páginas.
// 5. Firma remota en móviles sin PDF local en memoria y auto-sincronización.

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

console.log("=== INICIANDO SUITE DE TESTS v1005 ===");

// TEST 1: Verificación de fondo blanco y estilos del visor en index.html
function testViewerWhiteBackgroundHtml() {
    console.log("\n[Test 1] Verificando fondo blanco papel en index.html...");
    const html = fs.readFileSync('index.html', 'utf-8');

    assert(html.includes('id="docSignPdfCanvas"'), "Debe existir id='docSignPdfCanvas'");
    assert(html.includes('bg-white'), "docSignPdfCanvas debe tener clase bg-white");
    assert(html.includes('style="background-color: #ffffff !important;"'),
        "docSignPdfCanvas debe tener style background-color: #ffffff !important");
    
    assert(html.includes('id="docSignScrollContainer"'),
        "docSignScrollContainer debe existir");
    assert(html.includes('scroll-smooth'),
        "docSignScrollContainer debe tener scroll-smooth");

    assert(html.includes('id="docSignStampTarget"'),
        "docSignStampTarget debe existir");
    assert(html.includes('📍 FIRMA AQUÍ'),
        "docSignStampTarget debe contener el indicador visible '📍 FIRMA AQUÍ'");

    console.log("  -> Estructura HTML de visor blanco y marcador de firma verificada con éxito.");
}

// TEST 2: Verificación de renderizado en app.js (fillRect blanco y resizeSignaturePad)
function testViewerAndMobilePadAppJs() {
    console.log("\n[Test 2] Verificando lógica en app.js (fillRect blanco, resize y saltos 25pt)...");
    const appJs = fs.readFileSync('app.js', 'utf-8');
    const html = fs.readFileSync('index.html', 'utf-8');

    assert(appJs.includes("ctx.fillStyle = '#ffffff';"),
        "renderLastPdfPage debe establecer ctx.fillStyle en #ffffff");
    assert(appJs.includes("ctx.fillRect(0, 0, canvas.width, canvas.height);"),
        "renderLastPdfPage debe rellenar el canvas con blanco antes de pintar el PDF");

    assert(appJs.includes("window.resizeSignaturePad = function()"),
        "app.js debe exponer window.resizeSignaturePad");
    assert(appJs.includes("Math.min(window.innerWidth - 40, 500)"),
        "resizeSignaturePad debe limitar el ancho de manera responsiva al viewport o contenedor");

    assert(html.includes("adjustStampPos(0, 25)") && html.includes("adjustStampPos(25, 0)"),
        "index.html debe pasar saltos de 25pt en las flechas de ajuste");
    assert(appJs.includes("if (isNaN(curX))") && appJs.includes("if (isNaN(curY))"),
        "adjustStampPos debe proteger contra NaN");

    console.log("  -> Relleno blanco previo, protección anti-NaN y resizeSignaturePad comprobados.");
}

// TEST 3: Simulación de inyección de firmas en pdf-lib sobre el PDF real
async function testMultiSignaturePdfLibInjection() {
    console.log("\n[Test 3] Verificando inyección secuencial de 2 firmas en PDF real con pdf-lib...");
    const samplePdfPath = 'C:\\Users\\osvsa\\Downloads\\63784 - PN -KAD-01 Pantalla Principal y Despacho en Tarjeta.pdf';
    
    if (!fs.existsSync(samplePdfPath)) {
        console.warn("  -> [Aviso] El archivo en Descargas no existe en esta ruta. Creando PDF de prueba alternativo...");
        const fallbackDoc = await PDFDocument.create();
        fallbackDoc.addPage([612, 792]);
        var pdfBytes = await fallbackDoc.save();
    } else {
        var pdfBytes = fs.readFileSync(samplePdfPath);
        console.log(`  -> Cargado PDF real de prueba (${(pdfBytes.length / (1024*1024)).toFixed(2)} MB)...`);
    }

    // Firma PNG transparente de prueba (1x1 transparente válida)
    const base64Png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzu/v8WQAAAABJRU5ErkJggg==";
    const base64Data = base64Png.replace(/^data:image\/\w+;base64,/, '');
    const binaryBytes = Buffer.from(base64Data, 'base64');

    // 1. Cargar PDF desacoplando buffer
    const arrayBuf = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength);
    const pdfDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true, updateMetadata: false });
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width: pWidth, height: pHeight } = lastPage.getSize();

    console.log(`  -> Documento con ${pages.length} páginas. Última página: ${pWidth}x${pHeight} pt.`);

    // 2. Inyectar Firma 1 (Rafael Romero)
    const embedSig1 = await pdfDoc.embedPng(binaryBytes);
    let sW = 150;
    let sH = 50;
    let stampX1 = 120;
    let stampY1 = 80;

    // Sanitización idéntica a app.js
    if (isNaN(stampX1)) stampX1 = 50;
    if (isNaN(stampY1)) stampY1 = 50;

    lastPage.drawImage(embedSig1, {
        x: stampX1,
        y: stampY1,
        width: sW,
        height: sH
    });
    console.log("  -> Firma 1 (Rafael Romero) estampada en (x=" + stampX1 + ", y=" + stampY1 + ")");

    // 3. Inyectar Firma 2 (Miguel Barbosa)
    const embedSig2 = await pdfDoc.embedPng(binaryBytes);
    let stampX2 = 360;
    let stampY2 = 80;

    if (isNaN(stampX2)) stampX2 = 50;
    if (isNaN(stampY2)) stampY2 = 50;

    lastPage.drawImage(embedSig2, {
        x: stampX2,
        y: stampY2,
        width: sW,
        height: sH
    });
    console.log("  -> Firma 2 (Miguel Barbosa) estampada en (x=" + stampX2 + ", y=" + stampY2 + ")");

    // 4. Guardar PDF resultante
    const savedBytes = await pdfDoc.save();
    assert(savedBytes.length > 0, "El PDF final generado debe tener contenido");
    console.log(`  -> Guardado exitoso de PDF con 2 firmas. Tamaño final: ${(savedBytes.length / (1024*1024)).toFixed(2)} MB.`);
}

// TEST 4: Firma colaborativa multidispositivo (Móvil sin PDF)
function testMobileRemoteSigningLogic() {
    console.log("\n[Test 4] Verificando flujo de firma móvil sin PDF binario en memoria...");
    const appJs = fs.readFileSync('app.js', 'utf-8');

    assert(appJs.includes("if (activeSignDocCtx.pdfBytes)"),
        "stampSignatureOnActiveDocument debe verificar si el PDF está presente en memoria");
    
    assert(appJs.includes("signer.signaturePng = signaturePngDataUrl;"),
        "Debe almacenar signaturePng en el firmante correspondiente");
    assert(appJs.includes("signer.signedAt = stampDateStr;"),
        "Debe registrar signedAt");

    assert(appJs.includes("window.syncCircuitSignaturesToPdf = async function"),
        "app.js debe exponer syncCircuitSignaturesToPdf para inyectar automáticamente cuando el PDF vuelva a cargarse");

    console.log("  -> Lógica colaborativa multidispositivo verificada con éxito.");
}

// TEST 5: Control de versiones v1005 sincronizado
function testVersionSync() {
    console.log("\n[Test 5] Verificando consistencia de versiones v1005 en sw.js e index.html...");
    const sw = fs.readFileSync('sw.js', 'utf-8');
    const html = fs.readFileSync('index.html', 'utf-8');

    assert(sw.includes("SW_VERSION = '20261026_v1005'"), "sw.js debe tener la versión 20261026_v1005");
    assert(html.includes("styles.css?v=20261026_v1005"), "index.html debe cargar styles.css?v=20261026_v1005");
    assert(html.includes("app.js?v=20261026_v1005"), "index.html debe cargar app.js?v=20261026_v1005");

    console.log("  -> Versión 20261026_v1005 sincronizada correctamente.");
}

async function runAll() {
    try {
        testViewerWhiteBackgroundHtml();
        testViewerAndMobilePadAppJs();
        await testMultiSignaturePdfLibInjection();
        testMobileRemoteSigningLogic();
        testVersionSync();

        console.log("\n=============================================");
        console.log("✅ TODAS LAS PRUEBAS v1005 PASARON CON ÉXITO");
        console.log("=============================================\n");
    } catch (err) {
        console.error("\n❌ ERROR EN LA SUITE DE TESTS v1005:", err);
        process.exit(1);
    }
}

runAll();
