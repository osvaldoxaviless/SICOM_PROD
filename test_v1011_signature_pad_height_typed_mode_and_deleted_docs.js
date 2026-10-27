const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: v1011 Signature Pad Height, Typed Signature Mode & Deleted Docs Tombstone ===\n');

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

// 2. Google Fonts for Signatures in index.html
test('2. index.html: Fuentes caligráficas (Dancing Script, Caveat, Cedarville Cursive, Marck Script)', () => {
    assert(html.includes('family=Caveat'), 'Includes Caveat');
    assert(html.includes('family=Cedarville+Cursive'), 'Includes Cedarville Cursive');
    assert(html.includes('family=Dancing+Script'), 'Includes Dancing Script');
    assert(html.includes('family=Marck+Script'), 'Includes Marck Script');
});

// 3. Compact Viewer Card to Prioritize Signature Pad
test('3. index.html: #docSignViewerCard tiene altura calibrada para dar espacio a la firma', () => {
    assert(html.includes('id="docSignViewerCard" class="min-h-[140px] h-[34vh] sm:h-[36vh] lg:h-[38vh] max-h-[38vh]'), 'Viewer card has calibrated compact heights');
});

// 4. Signature Modes UI Controls in index.html
test('4. index.html: Selector de modo de firma (Dibujo, Escribir Nombre, Iniciales, Tipografías)', () => {
    assert(html.includes('id="docSignModeBtn_draw"'), 'Draw mode button exists');
    assert(html.includes('id="docSignModeBtn_type"'), 'Type mode button exists');
    assert(html.includes('id="docSignModeBtn_initials"'), 'Initials mode button exists');
    assert(html.includes('id="docSignTypeControls"'), 'Type controls container exists');
    assert(html.includes('id="docSignTypedNameInput"'), 'Typed name input exists');
    assert(html.includes('id="docSignTypedFontSelect"'), 'Font selector exists');
    assert(html.includes('Dancing Script'), 'Dancing script option exists');
    assert(html.includes('Cedarville Cursive'), 'Cedarville option exists');
});

// 5. Signature Pad Dimensions in app.js
test('5. app.js: resizeSignaturePad asigna 150px en escritorio y 160px en móvil', () => {
    assert(js.includes('const isMobileView = (window.innerWidth < 1024);'), 'Detects mobile view');
    assert(js.includes('const padHeight = isMobileView ? 160 : 150;'), 'Assigns 160px for mobile and 150px for desktop');
    assert(js.includes('canvas.style.height = `${padHeight}px`;'), 'Sets canvas style height');
});

// 6. Signature Modes Functions in app.js
test('6. app.js: switchSignatureMode & renderTypedSignatureOnCanvas implementados', () => {
    assert(js.includes('window.activeSignatureMode = \'draw\';'), 'Default mode is draw');
    assert(js.includes('window.switchSignatureMode = function(mode)'), 'switchSignatureMode exists');
    assert(js.includes('window.renderTypedSignatureOnCanvas = function()'), 'renderTypedSignatureOnCanvas exists');
    assert(js.includes("ctx.fillStyle = '#0055cc';"), 'Uses corporate blue ink #0055cc');
    assert(js.includes('hasSignatureDrawn = true;'), 'Marks signature as drawn for stamping');
});

// 7. Tombstone Mechanism for Deleted Documents in app.js
test('7. app.js: getDeletedDocIds, recordDeletedDoc y unrecordDeletedDoc', () => {
    assert(js.includes('function getDeletedDocIds()'), 'getDeletedDocIds defined');
    assert(js.includes('function recordDeletedDoc(id)'), 'recordDeletedDoc defined');
    assert(js.includes('function unrecordDeletedDoc(id)'), 'unrecordDeletedDoc defined');
    assert(js.includes('localStorage.getItem(\'sicom_deleted_docs\')'), 'Persists in sicom_deleted_docs');
});

// 8. Reconcile Cloud Snapshot ignores Deleted Docs
test('8. app.js: reconcileCloudSnapshot purga documentos eliminados', () => {
    assert(js.includes('const deletedDocIds = getDeletedDocIds();'), 'reconcileCloudSnapshot gets deleted doc IDs');
    assert(js.includes('purgeDeletedDocsFromProject'), 'reconcileCloudSnapshot purges deleted docs from projects');
    assert(js.includes('delete rp.docs[dKey];'), 'mergeProjectDeep removes deleted doc from remote project');
});

// 9. deleteProjectDocumentPrompt & addProjectDocumentPrompt Integrity
test('9. app.js: deleteProjectDocumentPrompt registra lápida y addProjectDocumentPrompt purga residuos', () => {
    assert(js.includes('recordDeletedDoc(docId);'), 'deleteProjectDocumentPrompt records tombstone');
    assert(js.includes('window.renderDocChecklists(prefix, item.docs);'), 'Renders checklist to clean DOM');
    assert(js.includes('if (item.docs[dId]) delete item.docs[dId];'), 'addProjectDocumentPrompt cleans stale deleted doc keys');
    assert(js.includes('unrecordDeletedDoc(newId);'), 'addProjectDocumentPrompt unrecords newly generated doc ID');
});

// 10. silentSaveInfoCard and saveEditChanges skip Deleted Docs
test('10. app.js: silentSaveInfoCard y saveEditChanges ignoran docIds eliminados', () => {
    assert(js.includes('if (deletedDocIds.includes(docId)) return;'), 'Both save functions skip deleted docIds');
});

// 11. focusSignaturePadFor updates input in Typed/Initials Mode
test('11. app.js: focusSignaturePadFor actualiza nombre o iniciales automáticamente', () => {
    assert(js.includes('window.focusSignaturePadFor = function(name, role)'), 'focusSignaturePadFor defined');
    assert(js.includes('window.activeSignatureMode === \'initials\''), 'Handles initials mode');
    assert(js.includes('window.renderTypedSignatureOnCanvas();'), 'Renders canvas signature on focus');
});

// 12. Version Bump
test('12. sw.js & index.html: Versión v1011 actualizada sincronizada', () => {
    assert(sw.includes("const SW_VERSION = '20261027_v1011';"), 'sw.js is v1011');
    assert(html.includes('app.js?v=20261027_v1011'), 'index.html has v1011');
});

console.log('\n🎉 ALL 12 TESTS PASSED PERFECTLY!');
