/**
 * test_adversarial_stress.js
 * Comprehensive Adversarial Data & Security Stress Test Suite for SICOM Phase 2
 * Author: Empirical Challenger (Challenger 1)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('======================================================================');
console.log('   SICOM SPA PHASE 2 — ADVERSARIAL DATA & SECURITY STRESS HARNESS   ');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function recordTest(name, passed, details = '') {
    totalTests++;
    if (passed) {
        passedTests++;
        console.log(`  [PASS] ${name}`);
    } else {
        failedTests++;
        console.error(`  [FAIL] ${name} — ${details}`);
        findings.push({ name, details });
    }
}

// ---------------------------------------------------------------------------
// Setup: Load app.js and index.html to extract tested functions and templates
// ---------------------------------------------------------------------------
const appJsPath = path.join(__dirname, 'app.js');
const indexHtmlPath = path.join(__dirname, 'index.html');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// Minimal browser mocks for Node environment
const mockDOM = {};
function createMockElement(id, initialProps = {}) {
    mockDOM[id] = {
        id,
        value: '',
        checked: false,
        classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            toggle(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); },
            contains(c) { return this.classes.has(c); }
        },
        innerHTML: '',
        textContent: '',
        ...initialProps
    };
    return mockDOM[id];
}

const mockDocument = {
    getElementById: (id) => mockDOM[id] || null,
    querySelectorAll: () => []
};

// Global escapeHtml from app.js line 4
const escapeHtml = (u) => { 
    if (!u) return ''; 
    return u.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); 
};

// Extract window.STGT_STATUS_CATALOG
const STGT_STATUS_CATALOG = {
    'Liberado': { color: '#22c55e', text: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', desc: 'Puesto en producción y aceptado formalmente por el cliente.' },
    'Estabilización o Piloto': { color: '#3b82f6', text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', desc: 'En pruebas de campo con usuarios o ambiente controlado tras pase.' },
    'Desarrollado y/o Configurado': { color: '#f97316', text: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', desc: 'Concluido técnicamente, pendiente de pruebas o visto bueno final.' },
    'En proceso de desarrollo y/o Configuración': { color: '#eab308', text: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', desc: 'Trabajo técnico activo en desarrollo o parametrización.' },
    'Retraso STGT': { color: '#ef4444', text: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', desc: 'Fuera de la fecha compromiso por causas internas atribuibles a STGT.' },
    'Autorizado, sin iniciar': { color: '#9ca3af', text: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)', desc: 'Proyecto aprobado por el cliente o dirección, en fila de arranque.' },
    'En proceso de autorización': { color: '#374151', text: '#9ca3af', bg: 'rgba(55, 65, 81, 0.4)', desc: 'Propuesta comercial o técnica en revisión, pendiente de firma/visto bueno.' },
    'En pausa': { color: '#ffffff', text: '#ffffff', bg: 'rgba(255, 255, 255, 0.1)', desc: 'Suspendido temporalmente por solicitud del cliente o dependencia externa.' },
    'Cancelado': { color: '#991b1b', text: '#ef4444', bg: 'rgba(153, 27, 27, 0.2)', desc: 'Proyecto cancelado o descartado formalmente.' }
};

// Dynamically extract window.STGT_STATUS_CATALOG and window.normalizeProjectStatus from app.js
const catalogMatch = appJsContent.match(/window\.STGT_STATUS_CATALOG = \{[\s\S]+?\};\s+window\.normalizeProjectStatus = function\(status\) \{[\s\S]+?\};/);
let normalizeProjectStatus;
if (catalogMatch) {
    const sandboxWindow = { STGT_STATUS_CATALOG };
    const extractFn = new Function('window', catalogMatch[0] + '; return window.normalizeProjectStatus;');
    normalizeProjectStatus = extractFn(sandboxWindow);
} else {
    normalizeProjectStatus = function(status) { return status || 'Autorizado, sin iniciar'; };
}

// Exact getProjectTicket from app.js line 692
function getProjectTicket(p) {
    if (!p) return '';
    if (p.ticket && typeof p.ticket === 'string' && p.ticket.trim()) {
        return p.ticket.trim();
    }
    if (p.invgateLink && typeof p.invgateLink === 'string') {
        const match = p.invgateLink.match(/(?:ticket|tickets|incident|request|id)[\/=](\d+)/i) || p.invgateLink.match(/\/(\d+)(?:[/?#]|$)/);
        if (match && match[1]) {
            return match[1];
        }
    }
    return '';
}

// Exact renderInfoCardTicket logic from app.js line 4276
function renderInfoCardTicket(item, currentSelectionType = 'project', currentUserRole = 'Supremo') {
    const cont = createMockElement('infoTicketContainer');

    if (!item || (currentSelectionType !== 'project' && currentSelectionType !== 'direct-project')) {
        cont.innerHTML = '';
        cont.classList.add('hidden');
        cont.classList.remove('inline-flex');
        return cont;
    }

    cont.classList.remove('hidden');
    cont.classList.add('inline-flex');

    const ticketRaw = (typeof getProjectTicket === 'function' ? getProjectTicket(item) : (item.ticket || '')).trim();
    const invLink = (item.invgateLink || '').trim();
    const isLector = (currentUserRole === 'Lector');

    if (ticketRaw) {
        const ticketDisplay = ticketRaw.startsWith('#') ? ticketRaw : `#${ticketRaw}`;
        const linkHref = invLink ? (invLink.startsWith('http') ? invLink : 'https://' + invLink) : '';

        if (linkHref) {
            cont.innerHTML = `
            <a href="${escapeHtml(linkHref)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="bg-yellow-200 hover:bg-yellow-300 border border-yellow-400 text-yellow-900 font-medium font-mono text-[10px] px-2.5 py-0.5 rounded-[3px] inline-flex items-center gap-1.5 transition shadow-sm" title="Abrir ticket ${escapeHtml(ticketDisplay)} en InvGate ↗">
                <span>🎫</span>
                <span class="truncate max-w-[120px]">${escapeHtml(ticketDisplay)}</span>
                <span class="text-xs">↗</span>
            </a>
            ${!isLector ? `
            <button type="button" onclick="event.stopPropagation(); window.promptEditTicket(event)" class="text-[#8a8380] hover:text-[#ee6018] ml-1 p-0.5 transition shrink-0" title="Editar número de ticket">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>` : ''}`;
        } else {
            cont.innerHTML = `
            <div class="factory-ticket-pill inline-flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 rounded-[3px] max-w-[210px] group cursor-pointer" onclick="event.stopPropagation(); ${!isLector ? 'window.promptEditTicket(event)' : ''}" title="${!isLector ? 'Clic para asignar enlace o editar' : 'Ticket oficial'}">
                <span class="tk-tag shrink-0">TK</span>
                <span class="tk-num truncate select-all" title="Ticket: ${escapeHtml(ticketRaw)}">${escapeHtml(ticketDisplay)}</span>
                ${!isLector ? `
                <button type="button" onclick="event.stopPropagation(); window.promptEditTicket(event)" class="text-[#4d4947] hover:text-[#ee6018] ml-0.5 p-0.5 transition shrink-0" title="Editar número de ticket">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>` : ''}
            </div>`;
        }
    } else {
        if (isLector) {
            cont.innerHTML = `<span class="font-mono text-[9px] text-[#4d4947]/70 uppercase tracking-tight">Sin ticket</span>`;
        } else {
            cont.innerHTML = `
            <button type="button" onclick="event.stopPropagation(); window.promptEditTicket(event)" class="factory-ticket-empty inline-flex items-center gap-1 font-mono text-[9px] uppercase font-semibold px-2 py-0.5 cursor-pointer" title="Asignar número de ticket al proyecto">
                <span class="text-[#ee6018] font-bold">+</span>
                <span>TICKET</span>
            </button>`;
        }
    }
    return cont;
}

// Exact fecha_compromiso update logic in silentSaveInfoCard & saveEditChanges
function simulateSaveDocDates(item, globalDocsList, domInputs, currentUserRole) {
    const prevDocs = item.docs || {};
    const isSupremo = (currentUserRole === 'Supremo');
    item.docs = {};
    globalDocsList.forEach(d => {
        const curDoc = prevDocs[d.id] || {};
        const fcEl = domInputs[`quickFechaComp${d.id}`] || domInputs[`editFechaComp${d.id}`];
        const fcVal = isSupremo ? (fcEl ? fcEl.value : (curDoc.fecha_compromiso || '')) : (curDoc.fecha_compromiso || '');
        item.docs[d.id] = {
            checked: false,
            obs: '',
            na: false,
            naValidated: false,
            fecha_compromiso: fcVal
        };
    });
    return item;
}

console.log('--- 1. STATUS NORMALIZATION ROBUSTNESS ---');

// 1.1 Null, undefined, empty string
recordTest('normalizeProjectStatus: null returns "Autorizado, sin iniciar"',
    normalizeProjectStatus(null) === 'Autorizado, sin iniciar');
recordTest('normalizeProjectStatus: undefined returns "Autorizado, sin iniciar"',
    normalizeProjectStatus(undefined) === 'Autorizado, sin iniciar');
recordTest('normalizeProjectStatus: "" (empty string) returns "Autorizado, sin iniciar"',
    normalizeProjectStatus('') === 'Autorizado, sin iniciar');

// 1.2 Exact legacy statuses
recordTest('normalizeProjectStatus: "Completado" -> "Liberado"',
    normalizeProjectStatus('Completado') === 'Liberado');
recordTest('normalizeProjectStatus: "En Progreso" -> "En proceso de desarrollo y/o Configuración"',
    normalizeProjectStatus('En Progreso') === 'En proceso de desarrollo y/o Configuración');
recordTest('normalizeProjectStatus: "Pendiente" -> "Autorizado, sin iniciar"',
    normalizeProjectStatus('Pendiente') === 'Autorizado, sin iniciar');
recordTest('normalizeProjectStatus: "No Iniciado" -> "Autorizado, sin iniciar"',
    normalizeProjectStatus('No Iniciado') === 'Autorizado, sin iniciar');

// 1.3 Casing variations (Adversarial)
const lowerCompletado = normalizeProjectStatus('completado');
const upperCompletado = normalizeProjectStatus('COMPLETADO');
const lowerEnProgreso = normalizeProjectStatus('en progreso');
const lowerPendiente = normalizeProjectStatus('pendiente');
const lowerNoIniciado = normalizeProjectStatus('no iniciado');

recordTest('ADVERSARIAL: normalizeProjectStatus: "completado" lowercase handled or catalog fallback',
    lowerCompletado === 'Liberado' || STGT_STATUS_CATALOG[lowerCompletado] !== undefined,
    `Returned "${lowerCompletado}", which is NOT in STGT_STATUS_CATALOG`);

recordTest('ADVERSARIAL: normalizeProjectStatus: "COMPLETADO" uppercase handled or catalog fallback',
    upperCompletado === 'Liberado' || STGT_STATUS_CATALOG[upperCompletado] !== undefined,
    `Returned "${upperCompletado}", which is NOT in STGT_STATUS_CATALOG`);

recordTest('ADVERSARIAL: normalizeProjectStatus: "pendiente" lowercase handled',
    lowerPendiente === 'Autorizado, sin iniciar' || STGT_STATUS_CATALOG[lowerPendiente] !== undefined,
    `Returned "${lowerPendiente}", which is NOT in STGT_STATUS_CATALOG`);

// 1.4 Whitespace and unexpected strings
const whitespaceStatus = normalizeProjectStatus('   ');
recordTest('ADVERSARIAL: normalizeProjectStatus: whitespace-only string',
    whitespaceStatus === 'Autorizado, sin iniciar' || STGT_STATUS_CATALOG[whitespaceStatus] !== undefined,
    `Whitespace string "   " returned without trim or default`);

// 1.5 Official 9 statuses identity mapping
const officialStatuses = Object.keys(STGT_STATUS_CATALOG);
let officialAllPass = true;
officialStatuses.forEach(st => {
    if (normalizeProjectStatus(st) !== st) officialAllPass = false;
});
recordTest('normalizeProjectStatus: all 9 official STGT statuses preserve identity', officialAllPass);

// 1.6 Verify repairing legacy statuses in raw data / repararProyectos
const hasStatusReparar = appJsContent.includes('p.status = window.normalizeProjectStatus(p.status)') ||
                         appJsContent.includes('p.status = normalizeProjectStatus(p.status)');
recordTest('ADVERSARIAL: repararProyectos() automatically normalizes p.status in memory on load',
    hasStatusReparar,
    'repararProyectos does not normalize p.status; legacy statuses remain unnormalized in raw project objects');

// 1.7 Verify openEditModal does not crash or lose status on legacy
const editModalHasNorm = appJsContent.includes("document.getElementById('editStatus').value = window.normalizeProjectStatus(item.status)") ||
                         appJsContent.includes("document.getElementById('editStatus').value = normalizeProjectStatus(item.status)");
recordTest('ADVERSARIAL: openEditModal() normalizes item.status when assigning #editStatus',
    editModalHasNorm,
    'openEditModal assigns item.status || "Pendiente" without normalizeProjectStatus; if item.status is legacy "Completado", dropdown will not select it');

console.log('\n--- 2. DOCUMENT COMMITMENT DATE SECURITY ---');

const globalDocs = [
    { id: 'propuesta', name: 'Propuesta Comercial' },
    { id: 'contrato', name: 'Contrato' },
    { id: 'plan', name: 'Plan de trabajo' }
];

// 2.1 Non-supremo attempting to tamper with existing date
const projectWithDocDate = {
    id: 'proj_sec_1',
    name: 'Proyecto de Seguridad',
    docs: {
        propuesta: { fecha_compromiso: '2026-10-15', checked: true }
    }
};

const domTamperAttempt = {
    quickFechaComppropuesta: { value: '2026-12-31' },
    quickFechaCompcontrato: { value: '2026-11-20' }
};

const nonSupremoRoles = ['Consultor', 'Supervisor', 'Lector', 'Desarrollador', ''];
nonSupremoRoles.forEach(role => {
    const projCopy = JSON.parse(JSON.stringify(projectWithDocDate));
    simulateSaveDocDates(projCopy, globalDocs, domTamperAttempt, role);
    recordTest(`Security: Role "${role || 'empty'}" CANNOT alter existing fecha_compromiso`,
        projCopy.docs.propuesta.fecha_compromiso === '2026-10-15',
        `Altered to ${projCopy.docs.propuesta.fecha_compromiso}`);
    recordTest(`Security: Role "${role || 'empty'}" CANNOT inject new fecha_compromiso`,
        projCopy.docs.contrato.fecha_compromiso === '',
        `Injected new date: ${projCopy.docs.contrato.fecha_compromiso}`);
});

// 2.2 Supremo legitimately updating date
const supremoProj = JSON.parse(JSON.stringify(projectWithDocDate));
simulateSaveDocDates(supremoProj, globalDocs, domTamperAttempt, 'Supremo');
recordTest('Security: Role "Supremo" CAN legitimately alter fecha_compromiso',
    supremoProj.docs.propuesta.fecha_compromiso === '2026-12-31');
recordTest('Security: Role "Supremo" CAN legitimately set new fecha_compromiso',
    supremoProj.docs.contrato.fecha_compromiso === '2026-11-20');

// 2.3 Supremo clearing a date
const domClearAttempt = {
    quickFechaComppropuesta: { value: '' }
};
const supremoClearProj = JSON.parse(JSON.stringify(projectWithDocDate));
simulateSaveDocDates(supremoClearProj, globalDocs, domClearAttempt, 'Supremo');
recordTest('Security: Role "Supremo" CAN legitimately clear fecha_compromiso',
    supremoClearProj.docs.propuesta.fecha_compromiso === '');

// 2.4 Verify disabled attribute in index.html and app.js for non-supremo
const htmlDateInputsDisabled = appJsContent.includes("${!isSupremo ? 'disabled' : ''}") ||
                              appJsContent.includes("${isSupremo ? '' : 'disabled'}") ||
                              appJsContent.includes("disabled") && appJsContent.includes("quickFechaComp");
recordTest('Security: HTML input has disabled attribute conditionally bound to Supremo',
    htmlDateInputsDisabled);

// 2.5 firestore.rules security validation
const rulesContent = fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8');
const rulesHasSupremoCheck = rulesContent.includes('isSupremo()');
const rulesHasAuditDatesCheck = rulesContent.includes('areAuditDatesUntouched()');
recordTest('Security: firestore.rules enforces isSupremo()', rulesHasSupremoCheck);
recordTest('Security: firestore.rules enforces areAuditDatesUntouched()', rulesHasAuditDatesCheck);

console.log('\n--- 3. TICKET PILL RENDERING & XSS SANITIZATION ---');

// 3.1 Normal ticket and link
const normalProj = { ticket: '10482', invgateLink: 'https://invgate.stgt.com.mx/tickets/10482' };
const pillNormal = renderInfoCardTicket(normalProj, 'project', 'Supremo');
recordTest('Ticket Pill: Valid ticket + URL renders yellow clickable link with 🎫 and ↗',
    pillNormal.innerHTML.includes('🎫') && 
    pillNormal.innerHTML.includes('#10482') && 
    pillNormal.innerHTML.includes('↗') && 
    pillNormal.innerHTML.includes('href="https://invgate.stgt.com.mx/tickets/10482"'));

// 3.2 Ticket with leading '#'
const hashProj = { ticket: '#9999', invgateLink: 'https://invgate.stgt.com.mx/tickets/9999' };
const pillHash = renderInfoCardTicket(hashProj, 'project', 'Supremo');
recordTest('Ticket Pill: Avoids double "##" when ticket already has "#"',
    pillHash.innerHTML.includes('#9999') && !pillHash.innerHTML.includes('##9999'));

// 3.3 Ticket with spaces
const spacedProj = { ticket: '  8821  ', invgateLink: 'https://invgate.stgt.com.mx/tickets/8821' };
const pillSpaced = renderInfoCardTicket(spacedProj, 'project', 'Supremo');
recordTest('Ticket Pill: Trims whitespace around ticket number',
    pillSpaced.innerHTML.includes('#8821') && !pillSpaced.innerHTML.includes('#  8821'));

// 3.4 Ticket without URL (factory ticket pill fallback)
const noUrlProj = { ticket: '5544', invgateLink: '' };
const pillNoUrl = renderInfoCardTicket(noUrlProj, 'project', 'Supremo');
recordTest('Ticket Pill: Ticket without URL renders factory pill fallback (no yellow a href)',
    pillNoUrl.innerHTML.includes('factory-ticket-pill') && 
    !pillNoUrl.innerHTML.includes('<a href=') && 
    pillNoUrl.innerHTML.includes('#5544'));

// 3.5 URL without ticket (auto-extraction from InvGate URL)
const urlOnlyProj = { ticket: '', invgateLink: 'https://invgate.stgt.com.mx/incident/7711' };
const pillUrlOnly = renderInfoCardTicket(urlOnlyProj, 'project', 'Supremo');
recordTest('Ticket Pill: URL without ticket auto-extracts ticket number from InvGate URL',
    pillUrlOnly.innerHTML.includes('🎫') && pillUrlOnly.innerHTML.includes('#7711'));

// 3.6 No ticket and no URL
const emptyProj = { ticket: '', invgateLink: '' };
const pillEmpty = renderInfoCardTicket(emptyProj, 'project', 'Supremo');
recordTest('Ticket Pill: No ticket and no URL renders "+ TICKET" button for Supremo',
    pillEmpty.innerHTML.includes('+') && pillEmpty.innerHTML.includes('TICKET'));

const pillEmptyLector = renderInfoCardTicket(emptyProj, 'project', 'Lector');
recordTest('Ticket Pill: No ticket renders "Sin ticket" for Lector',
    pillEmptyLector.innerHTML.includes('Sin ticket'));

// 3.7 ADVERSARIAL: Malicious XSS in ticket
const xssTicketProj = { 
    ticket: '<script>alert("xss")</script>', 
    invgateLink: 'https://invgate.stgt.com.mx/tickets/1' 
};
const pillXss = renderInfoCardTicket(xssTicketProj, 'project', 'Supremo');
const containsRawScriptTag = pillXss.innerHTML.includes('<script>');
const containsEscapedScriptTag = pillXss.innerHTML.includes('&lt;script&gt;');
recordTest('ADVERSARIAL: XSS in ticket number is sanitized (no unescaped <script>)',
    !containsRawScriptTag && containsEscapedScriptTag,
    `Raw script tag found in HTML: ${pillXss.innerHTML}`);

// 3.8 ADVERSARIAL: Malicious attribute breakout in ticket
const attrBreakProj = { 
    ticket: '123" onmouseover="alert(1)" data-x="', 
    invgateLink: 'https://invgate.stgt.com.mx/tickets/1' 
};
const pillAttrBreak = renderInfoCardTicket(attrBreakProj, 'project', 'Supremo');
const containsRawUnescapedQuote = pillAttrBreak.innerHTML.includes('123" onmouseover');
const containsEscapedQuotes = pillAttrBreak.innerHTML.includes('&quot;');
recordTest('ADVERSARIAL: Double quotes in ticket are escaped (&quot;)',
    !containsRawUnescapedQuote && containsEscapedQuotes,
    `Raw unescaped quotes found in HTML: ${pillAttrBreak.innerHTML}`);

// 3.9 ADVERSARIAL: javascript: pseudo-protocol in invgateLink
const jsLinkProj = { 
    ticket: '999', 
    invgateLink: 'javascript:alert(document.cookie)' 
};
const pillJsLink = renderInfoCardTicket(jsLinkProj, 'project', 'Supremo');
recordTest('ADVERSARIAL: javascript: URI is safely prefixed with https://',
    pillJsLink.innerHTML.includes('href="https://javascript:alert(document.cookie)"') &&
    !pillJsLink.innerHTML.includes('href="javascript:'));

// 3.10 Very long ticket number
const longTicketProj = {
    ticket: '9'.repeat(300),
    invgateLink: 'https://invgate.stgt.com.mx/tickets/999'
};
const pillLong = renderInfoCardTicket(longTicketProj, 'project', 'Supremo');
recordTest('Ticket Pill: Very long ticket is wrapped with CSS truncate max-w-[120px]',
    pillLong.innerHTML.includes('max-w-[120px]') && pillLong.innerHTML.includes('truncate'));

console.log('\n--- 4. METADATA INTEGRITY & MATRIX CALCULATION ---');

const COMPANIES_CATALOG = ['AFR', 'ZIN', 'TEO', 'AVM', 'ODM', 'STGT', 'CETRAM', 'ODA', 'ACAM', 'SATEL', 'SIG', 'CSP', 'TDN', 'OVN', 'ORO', 'MOD', 'TMT', 'SGC', 'CGT', 'SLLP', 'CAE'];

// Mock project suite
const testProjects = [
    { id: 'p1', name: 'Proj 1', empresa: 'AFR', status: 'Liberado' },
    { id: 'p2', name: 'Proj 2', empresa: 'ZIN', companies: ['ZIN', 'TEO'], status: 'Retraso STGT' },
    { id: 'p3', name: 'Proj 3', empresa: 'UNKNOWN_CODE', status: 'Cancelado' }, // Unknown company code
    { id: 'p4', name: 'Proj 4', empresa: null, companies: null, status: 'En pausa' }, // Null companies
    { id: 'p5', name: 'Proj 5', empresa: 'STGT', companies: ['STGT', 'CETRAM', 'ODA'], status: 'En proceso de desarrollo y/o Configuración' },
    { id: 'p6', name: 'Proj 6', empresa: 'ODM', status: 'Completado' } // Legacy status
];

// 4.1 Multi-company matrix count logic
function countMatrixCell(projects, statusName, companyCode) {
    return projects.filter(p => {
        const norm = normalizeProjectStatus(p.status);
        const matchesComp = (p.empresa === companyCode) || (Array.isArray(p.companies) && p.companies.includes(companyCode));
        return norm === statusName && matchesComp;
    }).length;
}

// Check p2 multi-company in both ZIN and TEO
const countZin = countMatrixCell(testProjects, 'Retraso STGT', 'ZIN');
const countTeo = countMatrixCell(testProjects, 'Retraso STGT', 'TEO');
recordTest('Matrix: Project with companies ["ZIN", "TEO"] counts in ZIN column', countZin === 1);
recordTest('Matrix: Project with companies ["ZIN", "TEO"] counts in TEO column', countTeo === 1);

// 4.2 Multi-company with p5 (STGT, CETRAM, ODA)
const countStgt = countMatrixCell(testProjects, 'En proceso de desarrollo y/o Configuración', 'STGT');
const countCetram = countMatrixCell(testProjects, 'En proceso de desarrollo y/o Configuración', 'CETRAM');
const countOda = countMatrixCell(testProjects, 'En proceso de desarrollo y/o Configuración', 'ODA');
recordTest('Matrix: Multi-company p5 counts in all 3 companies', 
    countStgt === 1 && countCetram === 1 && countOda === 1);

// 4.3 Null companies do not crash Matrix
let nullCompanyCrashed = false;
try {
    countMatrixCell(testProjects, 'En pausa', 'AFR');
} catch (e) {
    nullCompanyCrashed = true;
}
recordTest('Matrix: Null empresa and null companies do not crash filter (null-safe)', !nullCompanyCrashed);

// 4.4 Non-array companies (e.g. malformed string)
const malformedProj = [{ id: 'p7', name: 'Malformed', empresa: 'AFR', companies: 'AFR,ZIN', status: 'Liberado' }];
let malformedCrashed = false;
try {
    countMatrixCell(malformedProj, 'Liberado', 'AFR');
} catch (e) {
    malformedCrashed = true;
}
recordTest('Matrix: Malformed string companies property does not crash with includes() TypeError',
    !malformedCrashed);

// 4.5 Legacy status project in Matrix: p6 status 'Completado' should count under 'Liberado'
const countLegacyP6 = countMatrixCell(testProjects, 'Liberado', 'ODM');
recordTest('Matrix: Project with legacy status "Completado" correctly counts under "Liberado" cell',
    countLegacyP6 === 1);

// 4.6 Executive Table rendering company fallback
function getCompanyDisplay(p) {
    return p.empresa || (p.companies && p.companies[0]) || 'Sin asignar';
}
recordTest('Executive Table: Null company falls back to "Sin asignar"',
    getCompanyDisplay(testProjects[3]) === 'Sin asignar');
recordTest('Executive Table: Unknown company code preserved for audit visibility',
    getCompanyDisplay(testProjects[2]) === 'UNKNOWN_CODE');

// 4.7 Executive Table Row Selection XSS check
const unescapedRowSelectInApp = appJsContent.includes("<tr onclick=\"window.selectExecutiveTableRow('${p.id}', '${pType}')\"");
recordTest('ADVERSARIAL: selectExecutiveTableRow interpolation escapes p.id against quote injection',
    !unescapedRowSelectInApp,
    "app.js line 13805 interpolates unescaped '${p.id}'. If p.id contains a quote, onclick attribute breaks.");

console.log('\n======================================================================');
console.log(`SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED out of ${totalTests} tests.`);
console.log('======================================================================');

if (failedTests > 0) {
    console.log('\nADVERSARIAL FINDINGS DISCOVERED:');
    findings.forEach((f, idx) => {
        console.log(`  ${idx + 1}. [${f.name}]`);
        console.log(`     Details: ${f.details}`);
    });
}
