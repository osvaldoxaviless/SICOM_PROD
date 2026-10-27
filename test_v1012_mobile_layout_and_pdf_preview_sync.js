const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: v1012 Mobile Layout Fix & Multi-device PDF Preview Sync ===\n');

const html = fs.readFileSync('./index.html', 'utf-8');
const js = fs.readFileSync('./app.js', 'utf-8');
const sw = fs.readFileSync('./sw.js', 'utf-8');

function test(name, fn) {
    try {
        fn();
        console.log(`✅ PASS: ${name}`);
    } catch (e) {
        console.error(`❌ FAIL: ${name}`);
        console.error(e);
        process.exit(1);
    }
}

// 1. JS Syntax Check
test('1. app.js: Syntax is valid without parse errors', () => {
    assert.doesNotThrow(() => {
        new Function(js);
    });
});

// 2. InfoCard Header is relative (not sticky overlapping fields on mobile)
test('2. index.html: factory-bone-card es relative z-10 para no encimarse sobre las fechas', () => {
    assert(html.includes('class="factory-bone-card bg-[#eeeeee] text-[#101010] p-4 rounded-[10px] mb-4 border border-[#3d3a39]/20 shadow-none relative z-10"'), 'Header card is relative, scrolling cleanly with content');
    assert(!html.includes('factory-bone-card bg-[#eeeeee] text-[#101010] p-4 rounded-[10px] mb-4 border border-[#3d3a39]/20 shadow-none sticky'), 'No longer sticky floating over dates');
});

// 3. Documentation containers without nested scroll traps on mobile
test('3. index.html: quickDocsContainer y editDocsContainer permiten flujo completo en móvil', () => {
    assert(html.includes('id="quickDocsContainer" class="space-y-2.5 max-h-none overflow-visible md:max-h-96 md:overflow-y-auto scrollbar-thin pr-1"'), 'quickDocsContainer has no nested mobile scroll trap');
    assert(html.includes('id="editDocsContainer" class="space-y-2.5 max-h-none overflow-visible md:max-h-96 md:overflow-y-auto scrollbar-thin pr-1"'), 'editDocsContainer has no nested mobile scroll trap');
    assert(html.includes('id="quickTasksList" class="space-y-2 max-h-none overflow-visible md:max-h-72 md:overflow-y-auto scrollbar-thin pr-1 mb-3"'), 'quickTasksList has no nested mobile scroll trap');
});

// 4. Binary Conversion Helpers
test('4. app.js: Funciones de conversión uint8ToBase64 y base64ToUint8', () => {
    assert(js.includes('function uint8ToBase64(bytes)'), 'uint8ToBase64 defined');
    assert(js.includes('function base64ToUint8(base64)'), 'base64ToUint8 defined');
});

// 5. Visual Signature Sheet Preview Function
test('5. app.js: renderSignatureSheetFromPreview para dispositivos móviles y remotos', () => {
    assert(js.includes('window.renderSignatureSheetFromPreview = async function(previewDataUrl, docData)'), 'renderSignatureSheetFromPreview implemented');
    assert(js.includes("info.textContent = `✓ Hoja oficial sincronizada`;"), 'Sets sync notice');
    assert(js.includes('window.renderDetectedSlotsBar();'), 'Renders slot bar for preview');
    assert(js.includes('window.updateStampTargetVisual();'), 'Updates stamp target visual for preview');
});

// 6. Preview Capture on Desktop Render
test('6. app.js: renderLastPdfPage captura snapshot visual de la hoja de firmas', () => {
    assert(js.includes('d.signatureSheetPreview = previewDataUrl;'), 'Captures signatureSheetPreview in docData');
    assert(js.includes('d.pagePdfWidth = activeSignDocCtx.pagePdfWidth || 612;'), 'Captures page width');
    assert(js.includes('d.detectedRows = activeSignDocCtx.detectedRows || [];'), 'Captures detected rows');
});

// 7. Cross-device PDF Binary Sync via Firestore
test('7. app.js: handleDocPdfFileSelected sincroniza binarios a Firestore sicom_pdfs', () => {
    assert(js.includes("globalDoc(db, 'artifacts', appId, 'public', 'data', 'sicom_pdfs', activeSignDocCtx.pdfKey)"), 'Syncs PDF to sicom_pdfs');
    assert(js.includes('uint8.byteLength < 850000'), 'Checks Firestore document size limit');
});

// 8. Mobile Remote Rescue in openSignatureWorkflowModal
test('8. app.js: openSignatureWorkflowModal recupera de la nube y usa preview sincronizado', () => {
    assert(js.includes('Recuperación remota de PDF en Firestore'), 'Fetches from Firestore if not in local IDB');
    assert(js.includes('await window.renderSignatureSheetFromPreview(docData.signatureSheetPreview, docData);'), 'Falls back to synced visual sheet preview on mobile');
});

// 9. Mobile Download Rescue in downloadCurrentSignedPdf
test('9. app.js: downloadCurrentSignedPdf rescata PDF de la nube antes de descargar en móvil', () => {
    assert(js.includes('Descargando documento original desde la nube'), 'Shows download progress on mobile');
    assert(js.includes('El archivo PDF original reside en la computadora donde se subió y en Google Drive'), 'Informative fallback message');
});

// 10. Clean Deletion in deleteDocumentPdfAndRestart
test('10. app.js: deleteDocumentPdfAndRestart elimina preview y binario de Firestore', () => {
    assert(js.includes('delete docData.signatureSheetPreview;'), 'Deletes signatureSheetPreview');
    assert(js.includes("globalDeleteDoc(pdfDocRef)"), 'Deletes from Firestore sicom_pdfs');
});

// 11. Version Bump
test('11. sw.js & index.html: Versión v1012 sincronizada', () => {
    assert(sw.includes("const SW_VERSION = '20261027_v1012';"), 'sw.js is v1012');
    assert(html.includes('app.js?v=20261027_v1012'), 'index.html has v1012');
});

console.log('\n🎉 ALL 11 TESTS PASSED PERFECTLY!');
