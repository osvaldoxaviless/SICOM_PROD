// test_v1009_mobile_and_desktop_zero_scroll_fit.js
const fs = require('fs');
const assert = require('assert');

console.log("=== INICIANDO SUITE DE TESTS v1009 ===");

function testDesktopZeroScrollFit() {
    console.log("\n[Test 1] Verificando ajuste perfecto en Desktop (Visor + Pad juntos sin scroll externo)...");
    const html = fs.readFileSync('index.html', 'utf8');
    const appJs = fs.readFileSync('app.js', 'utf8');

    // 1. Contenedor de la columna izquierda debe ser flex-col h-full overflow-hidden
    assert(html.includes('id="docSignColLeft" class="lg:col-span-7 flex flex-col gap-1.5 h-full min-h-0 overflow-hidden"'),
        "docSignColLeft debe ser h-full min-h-0 overflow-hidden");

    // 2. Visor card debe ser flex-1 min-h-[140px] para ocupar todo el espacio restante automáticamente
    assert(html.includes('id="docSignViewerCard" class="flex-1 min-h-[140px] bg-[#101010] border border-[#3d3a39] rounded-[6px] p-1.5 flex flex-col relative overflow-hidden"'),
        "docSignViewerCard debe usar flex-1 min-h-[140px] y NO alturas fijas de 590px");

    // 3. Viewport interno del PDF debe tener su propio scroll interno si hay zoom
    assert(html.includes('id="docSignPdfViewport" class="flex-1 min-h-0 overflow-y-auto overflow-x-auto relative flex flex-col items-center justify-start p-1 bg-[#141414] rounded border border-[#23201e]"'),
        "docSignPdfViewport debe ser flex-1 min-h-0 overflow-y-auto para scroll interno independiente");

    // 4. Pad de firma debe ser compacto y shrink-0
    assert(html.includes('id="docSignPadContainer" class="bg-[#101010] p-1.5 sm:p-2 rounded-[6px] border-2 border-[#3d3a39] shrink-0 transition-all duration-200"'),
        "docSignPadContainer debe ser shrink-0 y compacto");
    assert(html.includes('height="60" class="w-full bg-[#ffffff] cursor-crosshair block" style="background-color: #ffffff !important; touch-action: none; height: 60px;"'),
        "canvas signaturePadCanvas debe tener altura compacta de 60px");

    assert(appJs.includes('const padHeight = (window.innerWidth < 640) ? 55 : 60;'),
        "resizeSignaturePad debe limitar la altura a 60px en desktop y 55px en móvil");

    console.log("  -> Visor dinámico + Pad compacto garantizan cero scroll en desktop.");
}

function testMobileErgonomicsAndTabs() {
    console.log("\n[Test 2] Verificando ergonomía móvil (Segmented tabs, nombres cortos, gestos táctiles)...");
    const html = fs.readFileSync('index.html', 'utf8');
    const appJs = fs.readFileSync('app.js', 'utf8');

    // 1. Selector de tabs para móvil
    assert(html.includes('id="docSignMobileTabBtn_sign"'), "Debe existir pestaña móvil de Hoja y Firma");
    assert(html.includes('id="docSignMobileTabBtn_circuit"'), "Debe existir pestaña móvil de Circuito");
    assert(html.includes('id="docSignMobileCircuitCount"'), "Debe existir badge contador para móvil");

    // 2. Función switchDocSignMobileTab presente y funcional
    assert(appJs.includes('window.switchDocSignMobileTab = function'), "app.js debe exponer switchDocSignMobileTab");
    assert(appJs.includes('focusSignaturePadFor = function(name, role) {\n    if (window.innerWidth < 1024 && typeof window.switchDocSignMobileTab === \'function\') {\n        window.switchDocSignMobileTab(\'sign\');\n    }'),
        "focusSignaturePadFor debe conmutar automáticamente a la pestaña 'sign' en móvil");

    // 3. Remover select-none del modal exterior
    assert(!html.includes('id="documentSignModal" onclick="if(event.target === this) closeDocumentSignModal()" class="fixed inset-0 z-[99999] bg-[#101010]/85 hidden flex items-center justify-center opacity-0 transition-opacity duration-200 p-2 sm:p-4 select-none"'),
        "documentSignModal NO debe tener select-none para no bloquear gestos en móviles");

    // 4. Nombres cortos de casillas en móvil
    assert(appJs.includes('const isMobile = (window.innerWidth < 640);'),
        "renderDetectedSlotsBar debe detectar móvil");
    assert(appJs.includes('shortName = isMobile \n            ? (nameTokens[0] + (nameTokens[1] ? \' \' + nameTokens[1][0] + \'.\' : \'\'))'),
        "renderDetectedSlotsBar debe abreviar nombres en móvil para no amontonarse");

    console.log("  -> Tabs móviles, abreviaciones ergonómicas y fluidez táctil verificadas.");
}

function testVersioningV1009() {
    console.log("\n[Test 3] Verificando versión 20261027_v1009...");
    const html = fs.readFileSync('index.html', 'utf8');
    const sw = fs.readFileSync('sw.js', 'utf8');

    assert(html.includes('app.js?v=20261027_v1009'), "index.html debe cargar app.js?v=20261027_v1009");
    assert(sw.includes("const SW_VERSION = '20261027_v1009';"), "sw.js debe tener versión 20261027_v1009");

    console.log("  -> Versión v1009 confirmada en HTML y Service Worker.");
}

testDesktopZeroScrollFit();
testMobileErgonomicsAndTabs();
testVersioningV1009();

console.log("\n✅ TODOS LOS TESTS DE v1009 PASARON EXITOSAMENTE.");
