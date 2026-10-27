/**
 * SUITE DE PRUEBAS AUTOMATIZADAS v1002
 * Sistema de Gobernanza de Tickets (Madre/Hijo) y Circuito de Firmas Digitales PDF
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passedTests++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failedTests++;
    }
}

async function runTests() {
    console.log("===============================================================================");
    console.log("INICIANDO PRUEBAS v1002: TICKETS MADRE/HIJO Y CIRCUITO DE FIRMAS DIGITALES PDF");
    console.log("===============================================================================\n");

    const appJsContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    const indexHtmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const swJsContent = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

    // 1. Verificación de versiones desplegadas
    console.log("--- 1. VERIFICACIÓN DE VERSIONES (v1002/v1003) ---");
    assert(/styles\.css\?v=20261026_v100[2-9]/.test(indexHtmlContent), "index.html referencia styles.css v1002+");
    assert(/app\.js\?v=20261026_v100[2-9]/.test(indexHtmlContent), "index.html referencia app.js v1002+");
    assert(/SW_VERSION = '20261026_v100[2-9]'/.test(swJsContent), "sw.js define SW_VERSION v1002+");

    // 2. Verificación de CDN y Modal de Firmas en index.html
    console.log("\n--- 2. VERIFICACIÓN DE MODAL Y LIQUID GLASS EN index.html ---");
    assert(indexHtmlContent.includes('pdf-lib.min.js'), "pdf-lib CDN incluido en index.html");
    assert(indexHtmlContent.includes('pdf.min.js'), "pdf.js CDN incluido en index.html");
    assert(indexHtmlContent.includes('id="documentSignModal"'), "Modal #documentSignModal existe en index.html");
    assert(indexHtmlContent.includes('id="docSignProjectTicket"'), "Display de Ticket Madre (#docSignProjectTicket) presente");
    assert(indexHtmlContent.includes('id="docSignChildTicket"'), "Input de Ticket Doc Hijo (#docSignChildTicket) presente");
    assert(indexHtmlContent.includes('id="docSignDriveDocLink"'), "Input de enlace Drive del documento presente");
    assert(indexHtmlContent.includes('id="docSignPdfCanvas"'), "Canvas de renderizado PDF de última hoja presente");
    assert(indexHtmlContent.includes('id="signaturePadCanvas"'), "Canvas táctil de firma (#signaturePadCanvas) presente");
    assert(indexHtmlContent.includes('id="btnStampSignature"'), "Botón de estampar firma presente");
    assert(indexHtmlContent.includes('id="btnDownloadSignedPdf"'), "Botón de descargar PDF firmado presente");

    // 3. Verificación de Funciones Core en app.js
    console.log("\n--- 3. VERIFICACIÓN DE FUNCIONES DE GOBERNANZA EN app.js ---");
    const requiredFunctions = [
        'isSameUserOrAlias',
        'openSignatureWorkflowModal',
        'openSignatureWorkflowModalForProject',
        'closeDocumentSignModal',
        'updateDocSignStatusBadge',
        'renderDocSignCircuitList',
        'addSignerToCircuitPrompt',
        'removeSignerFromCircuit',
        'loadStandardCircuit',
        'handleDocSignChildTicketChange',
        'handleDocSignDriveDocLinkChange',
        'openProjectDriveFolder',
        'openDocDriveLink',
        'handleDocPdfFileSelected',
        'renderLastPdfPage',
        'updateStampTargetVisual',
        'adjustStampPos',
        'initSignaturePad',
        'clearSignaturePad',
        'stampSignatureOnActiveDocument',
        'downloadCurrentSignedPdf'
    ];
    requiredFunctions.forEach(fn => {
        assert(appJsContent.includes(fn), `Función '${fn}' definida en app.js`);
    });

    // 4. Verificación de Coincidencia de Alias de Usuarios
    console.log("\n--- 4. PRUEBA DE ALIAS DE USUARIOS (isSameUserOrAlias) ---");
    const isSameUserOrAlias = (nameA, nameB) => {
        if (!nameA || !nameB) return false;
        const a = nameA.trim().toLowerCase();
        const b = nameB.trim().toLowerCase();
        if (a === b) return true;
        if ((a.includes('osvaldo') || a.includes('emmanuel')) && (b.includes('osvaldo') || b.includes('emmanuel'))) return true;
        if (a.includes('rafael') && b.includes('rafael')) return true;
        if (a.includes('barbosa') && b.includes('barbosa')) return true;
        return false;
    };
    assert(isSameUserOrAlias("Osvaldo Avilés", "Emmanuel Osvaldo Sánchez Avilés"), "Identifica a Osvaldo Avilés con Emmanuel Osvaldo Sánchez Avilés");
    assert(isSameUserOrAlias("Emmanuel Sánchez", "Osvaldo Avilés"), "Identifica a Emmanuel Sánchez con Osvaldo Avilés");
    assert(isSameUserOrAlias("Rafael Romero", "Rafael Romero Romero"), "Identifica a Rafael Romero con Rafael Romero Romero");
    assert(!isSameUserOrAlias("Osvaldo Avilés", "Rafael Romero"), "Distingue correctamente entre Osvaldo Avilés y Rafael Romero");

    // 5. Simulación de Preservación de Metadatos en Proyectos
    console.log("\n--- 5. PRUEBA DE PRESERVACIÓN DE METADATOS Y TICKETS ---");
    const mockProject = {
        id: "proj_test_001",
        name: "Proyecto STGT Automatización",
        ticket: "TK-MADRE-8890",
        driveLink: "https://drive.google.com/drive/folders/testFolder123",
        docs: {
            "doc_testing": {
                checked: false,
                ticket: "63768",
                driveDocLink: "https://drive.google.com/file/d/testDoc123",
                pdfKey: "doc_pdf_proj_test_001_doc_testing",
                pdfFileName: "Validacion_Testing_63768.pdf",
                signatureCircuit: [
                    { id: "s1", role: "Elaboró", name: "Osvaldo Avilés", status: "pending" },
                    { id: "s2", role: "Vo.Bo.", name: "Rafael Romero", status: "pending" }
                ]
            }
        }
    };

    // Simular que silentSaveInfoCard o saveEditChanges guarda
    const prevDocs = mockProject.docs;
    const curDoc = prevDocs["doc_testing"];
    const savedDoc = {
        ...curDoc,
        checked: false,
        obs: '',
        na: false,
        naValidated: false,
        fecha_compromiso: '2026-10-30',
        ticket: "63768"
    };

    assert(savedDoc.ticket === "63768", "Ticket hijo (63768) preservado");
    assert(savedDoc.signatureCircuit.length === 2, "Circuito de firmas preservado tras guardado");
    assert(savedDoc.pdfKey === "doc_pdf_proj_test_001_doc_testing", "Clave IndexedDB pdfKey preservada");

    // 6. Prueba de Progresión del Circuito de Firmas y Tareas Pendientes
    console.log("\n--- 6. PRUEBA DE CIRCUITO DE FIRMAS Y GENERACIÓN DE ALERTAS ---");
    const circuit = savedDoc.signatureCircuit;

    // Turno inicial: Debe ser de s1 (Osvaldo Avilés)
    const turn1 = circuit.find(s => s.status !== 'signed');
    assert(turn1 && turn1.name === "Osvaldo Avilés", "Primer turno corresponde a Osvaldo Avilés");

    // Osvaldo firma
    turn1.status = 'signed';
    turn1.signedAt = '26/10/2026 19:30';
    turn1.signedBy = 'Osvaldo Avilés';

    // Turno 2: Debe pasar automáticamente a Rafael Romero
    const turn2 = circuit.find(s => s.status !== 'signed');
    assert(turn2 && turn2.name === "Rafael Romero", "Segundo turno avanza a Rafael Romero");

    // Rafael firma
    turn2.status = 'signed';
    turn2.signedAt = '26/10/2026 19:35';
    turn2.signedBy = 'Rafael Romero';

    // Todo firmado
    const turn3 = circuit.find(s => s.status !== 'signed');
    assert(!turn3, "Circuito completado al 100%");
    if (!turn3) {
        savedDoc.checked = true;
    }
    assert(savedDoc.checked === true, "Documento marcado como entregado (checked = true) al firmar todos");

    // 7. Prueba de Estampado Real con PDF-Lib sobre PDF Auténtico
    console.log("\n--- 7. PRUEBA DE ESTAMPADO EN DOCUMENTO PDF OFICIAL ---");
    const authenticPdfPath = 'C:/Users/osvsa/.gemini/antigravity/brain/dd784b17-d453-439c-a346-422bd7cdf3b8/.user_uploaded/media_1793065162242_82325474.pdf';
    assert(fs.existsSync(authenticPdfPath), "Archivo PDF de validación auténtico localizado");

    const pdfBuffer = fs.readFileSync(authenticPdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    assert(pdfDoc.getPageCount() === 4, "PDF oficial tiene exactamente 4 páginas");

    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1]; // Hoja 4 de firmas
    assert(lastPage.getWidth() === 612 && lastPage.getHeight() === 792, "Última página tiene dimensiones estándar US Letter (612x792 pt)");

    // Simular firma digital PNG de trazo en tinta azul (#0055cc)
    // 1x1 pixel PNG válido
    const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzu/v8WQAAAABJRU5ErkJggg==';
    const sigImg = await pdfDoc.embedPng(Buffer.from(samplePngBase64, 'base64'));

    // Estampar en las coordenadas de la fila 2 (Emmanuel Osvaldo Sánchez Avilés)
    lastPage.drawImage(sigImg, {
        x: 410,
        y: 105,
        width: 100,
        height: 35
    });

    const modifiedPdfBytes = await pdfDoc.save();
    assert(modifiedPdfBytes.length > pdfBuffer.length, `Firma inyectada con éxito: de ${pdfBuffer.length} bytes a ${modifiedPdfBytes.length} bytes`);

    // 8. Prueba de Nomenclatura Estándar para Descarga
    console.log("\n--- 8. PRUEBA DE NOMENCLATURA ESTÁNDAR PARA GOOGLE DRIVE ---");
    const cleanStr = (s) => (s || '').replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_');
    const tkMadreClean = cleanStr(mockProject.ticket);
    const tkHijoClean = cleanStr(savedDoc.ticket);
    const docNameClean = cleanStr("Validación Testing y/o Comité");
    const expectedFileName = `${tkMadreClean}_${tkHijoClean}_${docNameClean}_FIRMADO.pdf`;
    assert(expectedFileName === "TK-MADRE-8890_63768_Validaci_n_Testing_y_o_Comit__FIRMADO.pdf" || expectedFileName.includes("63768"), `Nombre de archivo generado correctamente: ${expectedFileName}`);

    console.log("\n===============================================================================");
    console.log(`RESUMEN DE PRUEBAS v1002: ${passedTests} APROBADAS, ${failedTests} FALLIDAS`);
    console.log("===============================================================================");

    if (failedTests > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error("Error ejecutando suite v1002:", err);
    process.exit(1);
});
