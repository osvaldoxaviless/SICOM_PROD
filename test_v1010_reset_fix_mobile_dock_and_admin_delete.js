const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: v1010 Reset Fix, Mobile Dock Protection, Ergonomics, Admin File Delete ===\n');

const html = fs.readFileSync('./index.html', 'utf-8');
const css = fs.readFileSync('./styles.css', 'utf-8');
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

// 2. Mobile Dock Protection
test('2. styles.css & app.js: #mobileBottomDock oculto cuando #documentSignModal está abierto', () => {
    assert(css.includes('body:has(#documentSignModal:not(.hidden)) #mobileBottomDock'), 'styles.css hides dock when modal is open');
    assert(css.includes('#documentSignModal {\n    z-index: 100005 !important;\n}'), 'styles.css gives modal z-index 100005');
    assert(html.includes('id="documentSignModal"') && html.includes('z-[100005]'), 'index.html gives modal z-[100005]');
    assert(js.includes("const dock = document.getElementById('mobileBottomDock');\n    if (dock) {\n        dock.classList.add('hidden');\n        dock.style.display = 'none';\n    }"), 'openSignatureWorkflowModal hides mobileBottomDock');
    assert(js.includes("const dock = document.getElementById('mobileBottomDock');\n        if (dock) {\n            dock.classList.remove('hidden');\n            dock.style.display = '';\n        }"), 'closeDocumentSignModal restores mobileBottomDock');
});

// 3. Reset Document Signatures Complete Cleansing
test('3. app.js: resetDocumentSignatures limpia pdfPurged, checked y reestablece estado en limpio', () => {
    assert(js.includes('delete docData.pdfPurged;'), 'resetDocumentSignatures deletes pdfPurged');
    assert(js.includes('docData.checked = false;'), 'resetDocumentSignatures sets checked to false');
    assert(js.includes('delete docData.lastStampX;'), 'resetDocumentSignatures deletes lastStampX');
    assert(js.includes('delete docData.lastStampY;'), 'resetDocumentSignatures deletes lastStampY');
    assert(js.includes("infoEl.textContent = 'Ningún PDF';"), 'resetDocumentSignatures resets info text if no PDF');
    assert(js.includes("window.focusSignaturePadFor(circuit[0].name, circuit[0].role);"), 'resetDocumentSignatures focuses pad on first pending signer');
});

// 4. Ergonomic Screen Space: Responsive Signature Pad Height
test('4. app.js & index.html: Altura ergonómica de 135px en móvil y 75px en desktop para la firma', () => {
    assert(js.includes('const isMobileView = (window.innerWidth < 1024);'), 'resizeSignaturePad detects mobile view');
    assert(js.includes('const padHeight = isMobileView ? 135 : 75;'), 'resizeSignaturePad sets 135px on mobile, 75px on desktop');
    assert(html.includes('id="docSignViewerCard" class="flex-1 min-h-[160px] max-h-[44vh] lg:max-h-none'), 'Viewer card is max-h-[44vh] on mobile to give room to signature');
    assert(html.includes('id="docSignColLeft" class="lg:col-span-7 flex flex-col gap-1.5 h-full min-h-0 overflow-y-auto lg:overflow-hidden"'), 'ColLeft handles scroll safely on mobile and locked on desktop');
});

// 5. Admin / Supervisor File Deletion & Process Restart
test('5. app.js & index.html: Función deleteDocumentPdfAndRestart y botones para Admin / Supervisor', () => {
    assert(js.includes('window.deleteDocumentPdfAndRestart = async function()'), 'deleteDocumentPdfAndRestart exists in app.js');
    assert(js.includes("currentUserRole === 'Supremo' || currentUserRole === 'Supervisor'"), 'Checks for Supremo/Supervisor permissions');
    assert(js.includes('await window.SICOM_IDB.delete(activeSignDocCtx.pdfKey)'), 'Deletes PDF from IndexedDB');
    assert(js.includes('await window.SICOM_IDB.delete(activeSignDocCtx.pdfKey + \'_clean\')'), 'Deletes clean PDF backup from IndexedDB');
    assert(html.includes('id="docSignBtnAdminHeaderDelete"'), 'Header delete button exists in index.html');
    assert(html.includes('id="docSignBtnAdminDeletePdf"'), 'Subir PDF bar delete button exists in index.html');
    assert(html.includes('id="docSignBtnAdminReplacePdf"'), 'Replace button in completed card exists in index.html');
    assert(js.includes('headerAdminBtn.classList.remove(\'hidden\')'), 'updateDocSignStatusBadge shows header delete button for admins');
});

// 6. Mobile Completed Bar
test('6. index.html & app.js: Barra de descarga rápida en móvil para documentos 100% firmados', () => {
    assert(html.includes('id="docSignMobileCompletedBar"'), 'docSignMobileCompletedBar exists in index.html');
    assert(js.includes('mobileCompletedBar.classList.remove(\'hidden\');'), 'updateDocSignStatusBadge shows mobile bar when fully signed');
});

// 7. Version Bump to v1010
test('7. sw.js & index.html: Versión actualizada a 20261027_v1010', () => {
    assert(sw.includes("const SW_VERSION = '20261027_v1010';"), 'sw.js version is v1010');
    assert(html.includes('app.js?v=20261027_v1010'), 'index.html references app.js?v=20261027_v1010');
});

console.log('\n🎉 ALL 7 TESTS PASSED SUCCESSFULLY!');
