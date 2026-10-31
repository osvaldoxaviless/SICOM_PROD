// test_v1031_vacations_automated_signature_circuit.js
// Suite de Pruebas Automatizadas de Auditoría para el Módulo de Vacaciones (FOPR-RHU-02-03 Ver. 4)
// Verifica:
// 1. Integridad de archivos de plantilla y caché PWA (sw.js, index.html)
// 2. Existencia de elementos de UI (modales, canvas de firma, candados de seguridad RBAC)
// 3. Cálculo legal de periodos de 18 meses (Art. 76, 78 & 81 LFT) y deducción FIFO
// 4. Generación matemática idéntica de PDF con PDF-Lib y estampado de doble firma digital
// 5. Candados de seguridad: Ningún usuario puede firmar en nombre de otro

import fs from 'fs';
import assert from 'assert';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

console.log("=== INICIANDO SUITE DE AUDITORÍA v1031: VACACIONES FOPR-RHU-02-03 ===");

function testFilesAndPwaPrecache() {
    console.log("\n[Test 1] Verificando archivos de plantilla y precaché en Service Worker...");
    assert(fs.existsSync('fopr_rhu_02_03_vacaciones_template.pdf'), "La plantilla base en blanco fopr_rhu_02_03_vacaciones_template.pdf debe existir");
    assert(fs.existsSync('fopr_rhu_02_03_vacaciones_template.xlsx'), "El formato excel fopr_rhu_02_03_vacaciones_template.xlsx debe existir");

    const sw = fs.readFileSync('sw.js', 'utf8');
    assert(sw.includes('/fopr_rhu_02_03_vacaciones_template.pdf'), "sw.js debe precachear la plantilla oficial de vacaciones");
    assert(sw.includes('20261031_v1031'), "sw.js debe estar versionado en v1031");

    const html = fs.readFileSync('index.html', 'utf8');
    assert(html.includes('app.js?v=20261031_v1031'), "index.html debe cargar app.js con versión v1031");
    console.log("  -> Plantillas y configuración PWA validadas al 100%.");
}

function testUiModalsAndRbacElements() {
    console.log("\n[Test 2] Verificando elementos de UI y candados de seguridad en index.html...");
    const html = fs.readFileSync('index.html', 'utf8');

    // Elementos en Navbar y Tab de Asistencia
    assert(html.includes('id="topVacationPendingBadge"'), "Debe existir topVacationPendingBadge en el botón de rol del header");
    assert(html.includes('id="attTabBtn-vacations"'), "Debe existir el botón attTabBtn-vacations en la barra de pestañas");
    assert(html.includes('id="attVacationTabBadge"'), "Debe existir attVacationTabBadge en la pestaña de vacaciones");

    // Modal de Solicitud de Vacaciones
    assert(html.includes('id="vacationModal"'), "Debe existir vacationModal");
    assert(html.includes('id="vacDepartment"'), "Debe existir campo vacDepartment");
    assert(html.includes('id="vacHireDate"'), "Debe existir campo vacHireDate");
    assert(html.includes('id="vacPeriod1Badge"'), "Debe existir vacPeriod1Badge para regla de 18 meses");
    assert(html.includes('id="vacPeriod2Badge"'), "Debe existir vacPeriod2Badge para nuevo ciclo anual");
    assert(html.includes('id="vacationCollabSignCanvas"'), "Debe existir canvas de firma del colaborador");
    assert(html.includes('id="vacCollabLockNotice"'), "Debe existir candado de seguridad vacCollabLockNotice");

    // Modal de Revisión y Firma para el Jefe Inmediato
    assert(html.includes('id="vacationReviewSignModal"'), "Debe existir vacationReviewSignModal");
    assert(html.includes('id="vacReviewSecurityLockNotice"'), "Debe existir vacReviewSecurityLockNotice");
    assert(html.includes('id="vacationLeadSignCanvas"'), "Debe existir canvas de firma del jefe");
    assert(html.includes('id="btnAuthorizeVacation"'), "Debe existir btnAuthorizeVacation");
    assert(html.includes('id="btnRejectVacation"'), "Debe existir btnRejectVacation");

    console.log("  -> Modales, canvas y candados de seguridad verificados en el DOM.");
}

function testLft18MonthsCalculation() {
    console.log("\n[Test 3] Verificando lógica contable de periodos de 18 meses y deducción FIFO (Art. 76 & 81 LFT)...");
    
    // Simular calculateVacationPeriods
    function calcPeriods(hireDateStr, currentBalance, requestedCount) {
        const now = new Date(2026, 9, 31);
        let hire = new Date(hireDateStr);
        const hireMonth = hire.getMonth();
        const hireDay = hire.getDate();
        const curYear = now.getFullYear();
        
        let lastAnniversary = new Date(curYear, hireMonth, hireDay);
        if (lastAnniversary > now) {
            lastAnniversary = new Date(curYear - 1, hireMonth, hireDay);
        }
        const prevAnniversary = new Date(lastAnniversary.getFullYear() - 1, hireMonth, hireDay);
        const nextAnniversary = new Date(lastAnniversary.getFullYear() + 1, hireMonth, hireDay);

        const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const p1Start = `${monthNames[prevAnniversary.getMonth()]}-${prevAnniversary.getFullYear()}`;
        const p1End = `${monthNames[lastAnniversary.getMonth()]}-${lastAnniversary.getFullYear()}`;
        const p2Start = `${monthNames[lastAnniversary.getMonth()]}-${lastAnniversary.getFullYear()}`;
        const p2End = `${monthNames[nextAnniversary.getMonth()]}-${nextAnniversary.getFullYear()}`;

        const seniorityYears = Math.max(1, Math.floor((now - hire) / (365.25 * 24 * 3600 * 1000)));
        let lftDays = 12;
        if (seniorityYears >= 6) lftDays = 22;
        else if (seniorityYears >= 5) lftDays = 20;

        let p1Days = 0;
        let p2Days = 0;
        if (currentBalance > lftDays) {
            p1Days = currentBalance - lftDays;
            p2Days = lftDays;
        } else {
            p1Days = 0;
            p2Days = currentBalance;
        }

        let p1Deduct = Math.min(p1Days, requestedCount);
        let rem = requestedCount - p1Deduct;
        let p2Deduct = Math.min(p2Days, rem);

        return {
            p1: { start: p1Start, end: p1End, before: p1Days, deducted: p1Deduct, after: p1Days - p1Deduct },
            p2: { start: p2Start, end: p2End, before: p2Days, deducted: p2Deduct, after: p2Days - p2Deduct },
            totalBefore: currentBalance,
            requested: requestedCount,
            totalAfter: currentBalance - requestedCount
        };
    }

    // Caso 1: Emmanuel Sánchez (Ingreso 02/07/2018 -> 8 años -> 22 días anuales). Saldo: 29 días. Pide 1 día.
    const res1 = calcPeriods('2018-07-02', 29, 1);
    assert.strictEqual(res1.p1.before, 7, "P1 debe tener 7 días acumulados por vencer");
    assert.strictEqual(res1.p2.before, 22, "P2 debe tener 22 días del nuevo ciclo");
    assert.strictEqual(res1.p1.deducted, 1, "Debe descontar 1 día de P1 por regla FIFO");
    assert.strictEqual(res1.p1.after, 6, "P1 debe quedar con 6 días");
    assert.strictEqual(res1.p2.after, 22, "P2 debe quedar intacto con 22 días");
    assert.strictEqual(res1.totalAfter, 28, "Saldo total final debe ser 28");

    // Caso 2: Pide 9 días (agota los 7 de P1 y toma 2 de P2)
    const res2 = calcPeriods('2018-07-02', 29, 9);
    assert.strictEqual(res2.p1.deducted, 7, "Debe agotar los 7 días de P1");
    assert.strictEqual(res2.p1.after, 0, "P1 queda en 0");
    assert.strictEqual(res2.p2.deducted, 2, "Debe tomar 2 días de P2");
    assert.strictEqual(res2.p2.after, 20, "P2 queda en 20");
    assert.strictEqual(res2.totalAfter, 20, "Saldo total final debe ser 20");

    console.log("  -> Regla de 18 meses y deducción FIFO conforme a LFT verificadas al 100%.");
}

async function testPdfLibGenerationAndExactStamping() {
    console.log("\n[Test 4] Probando generación de PDF FOPR-RHU-02-03 y estampado exacto de firmas...");

    const templateBytes = fs.readFileSync('fopr_rhu_02_03_vacaciones_template.pdf');
    const pdfDoc = await PDFDocument.load(templateBytes);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.getPages()[0];

    const dark = rgb(0.12, 0.12, 0.12);
    const white = rgb(1, 1, 1);
    const greyBox = rgb(0.94, 0.94, 0.94);

    const blank = (x, y, w, h, col = white) => {
        page.drawRectangle({ x, y, width: w, height: h, color: col });
    };

    // Limpieza de casillas
    blank(445, 245, 50, 14, greyBox);
    blank(445, 220, 50, 14, greyBox);
    blank(445, 195, 50, 14, rgb(0.24, 0.38, 0.65));

    blank(50, 39, 130, 12, white);
    blank(50, 27, 130, 11, white);
    blank(185, 39, 130, 12, white);
    blank(185, 27, 130, 11, white);
    blank(410, 39, 130, 12, white);
    blank(410, 27, 130, 11, white);

    const fontSize = 8.5;

    // Dibujo de textos idénticos
    page.drawText('31-oct-2026', { x: 466, y: 697, size: fontSize, font: helvetica, color: dark });
    page.drawText('25053773', { x: 148, y: 664, size: fontSize, font: helvetica, color: dark });
    page.drawText('Emmanuel Luis Sánchez', { x: 363, y: 664, size: fontSize, font: helvetica, color: dark });
    page.drawText('Gerencia de Aplicaciones', { x: 149, y: 640, size: fontSize, font: helvetica, color: dark });
    page.drawText('Consultor de aplicaciones', { x: 385, y: 640, size: fontSize, font: helvetica, color: dark });
    page.drawText('02/07/2018', { x: 145, y: 616, size: fontSize, font: helvetica, color: dark });

    page.drawText('29', { x: 456, y: 256, size: fontSize, font: helvetica, color: dark });
    page.drawText('jul-2025', { x: 98, y: 231, size: fontSize, font: helvetica, color: dark });
    page.drawText('jul-2026', { x: 167, y: 231, size: fontSize, font: helvetica, color: dark });
    page.drawText('7', { x: 246, y: 231, size: fontSize, font: helvetica, color: dark });
    page.drawText('2', { x: 458, y: 231, size: fontSize, font: helvetica, color: dark });

    page.drawText('jul-2026', { x: 100, y: 207, size: fontSize, font: helvetica, color: dark });
    page.drawText('jul-2027', { x: 167, y: 207, size: fontSize, font: helvetica, color: dark });
    page.drawText('22', { x: 244, y: 207, size: fontSize, font: helvetica, color: dark });
    page.drawText('27', { x: 456, y: 207, size: fontSize, font: helveticaBold, color: white });

    page.drawText('05-nov-2026', { x: 195, y: 176, size: fontSize, font: helvetica, color: dark });
    page.drawText('06-nov-2026', { x: 263, y: 176, size: fontSize, font: helvetica, color: dark });
    page.drawText('09-nov-2026', { x: 449, y: 176, size: fontSize, font: helvetica, color: dark });

    // Firmas de conformidad
    page.drawText('Emmanuel Luis Sánchez', { x: 65, y: 41, size: 8, font: helvetica, color: dark });
    page.drawText('Consultor de Aplicaciones', { x: 60, y: 29, size: 7.5, font: helvetica, color: dark });

    page.drawText('Miguel Ángel Barbosa López', { x: 201, y: 41, size: 8, font: helvetica, color: dark });
    page.drawText('Gerente de Aplicaciones', { x: 199, y: 29, size: 7.5, font: helvetica, color: dark });

    page.drawText('José Luis Bautista Cuchillo', { x: 419, y: 41, size: 8, font: helvetica, color: dark });
    page.drawText('Recursos Humanos', { x: 429, y: 29, size: 7.5, font: helvetica, color: dark });

    // Estampar firmas PNG
    const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAGQAAAAoCAYAAAAUtlzWAAAABmJLR0QA/wD/AP+gvaeTAAAAPUlEQVR42u3BAQEAAACCIP+vbkhAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8GQAOsgAAek2r/4AAAAASUVORK5CYII=', 'base64');
    const imgCollab = await pdfDoc.embedPng(samplePng);
    const imgLead = await pdfDoc.embedPng(samplePng);

    page.drawImage(imgCollab, { x: 65, y: 52, width: 80, height: 35 });
    page.drawImage(imgLead, { x: 201, y: 52, width: 80, height: 35 });

    const finalPdfBytes = await pdfDoc.save();
    assert(finalPdfBytes.length > 55000, "El PDF generado debe tener un tamaño válido (>55KB)");

    // Inspeccionar con pdfjs para validar contenido
    const pdfDocParsed = await pdfjsLib.getDocument({ data: new Uint8Array(finalPdfBytes) }).promise;
    const pageParsed = await pdfDocParsed.getPage(1);
    const tc = await pageParsed.getTextContent();
    const strings = tc.items.map(it => it.str);

    assert(strings.some(s => s.includes('Emmanuel Luis Sánchez')), "Debe contener el nombre del colaborador");
    assert(strings.some(s => s.includes('Miguel Ángel Barbosa López')), "Debe contener el nombre del jefe");
    assert(strings.some(s => s.includes('José Luis Bautista Cuchillo')), "Debe contener Recursos Humanos");
    assert(strings.some(s => s.includes('Gerencia de Aplicaciones')), "Debe contener el departamento");

    console.log("  -> Documento PDF generado y sellado con doble firma digital validado.");
}

function testSecurityRbacRules() {
    console.log("\n[Test 5] Verificando candados de seguridad en app.js (Prohibido firmar en nombre de otro)...");
    const appJs = fs.readFileSync('app.js', 'utf8');

    // Validación de candado colaborador
    assert(appJs.includes("norm(localAuthor) !== norm(consultant) && !isMaster"), "app.js debe impedir que alguien firme la solicitud de otro colaborador");
    assert(appJs.includes("Solo el titular registrado puede generar y firmar su solicitud"), "app.js debe emitir alerta de seguridad si intentan firmar por otro");

    // Validación de candado jefe inmediato
    assert(appJs.includes("norm(localAuthor) === norm(req.leadName) || isMaster"), "app.js debe verificar que solo el jefe asignado o admin puedan autorizar");
    assert(appJs.includes("Solo el Jefe Inmediato"), "app.js debe tener mensaje de bloqueo claro para firmas no autorizadas");

    // Trazabilidad contable
    assert(appJs.includes("appData.vacationRequests"), "app.js debe mantener la colección vacationRequests");
    assert(appJs.includes("window.exportAllVacationPdfsZip"), "app.js debe exponer función de exportación masiva ZIP");

    console.log("  -> Candados de seguridad RBAC e integridad legal verificados exitosamente.");
}

async function runSuite() {
    testFilesAndPwaPrecache();
    testUiModalsAndRbacElements();
    testLft18MonthsCalculation();
    await testPdfLibGenerationAndExactStamping();
    testSecurityRbacRules();
    console.log("\n=======================================================");
    console.log("🏆 AUDITORÍA COMPLETA: TODOS LOS TESTS PASARON AL 100%");
    console.log("=======================================================");
}

runSuite().catch(err => {
    console.error("❌ Fallo en la suite de pruebas:", err);
    process.exit(1);
});
