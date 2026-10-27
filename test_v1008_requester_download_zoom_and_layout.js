// test_v1008_requester_download_zoom_and_layout.js
const fs = require('fs');
const assert = require('assert');

console.log("=== INICIANDO SUITE DE TESTS v1008 ===");

// 1. Verificación del Layout en index.html
function testLayoutAndErgonomics() {
    console.log("\n[Test 1] Verificando layout de columnas, visor ampliado y controles de zoom...");
    const html = fs.readFileSync('index.html', 'utf8');

    // Visor en columna izquierda con altura maximizada
    assert(html.includes('min-height: 380px; max-height: 590px;'), "El visor debe tener altura ampliada a 590px");
    assert(html.includes('id="docSignZoomControls"'), "Debe incluir docSignZoomControls");
    assert(html.includes('id="docSignZoomLabel"'), "Debe incluir docSignZoomLabel");
    assert(html.includes('onclick="changeDocSignZoom(-0.15)"'), "Debe tener botón de reducir zoom");
    assert(html.includes('onclick="changeDocSignZoom(0.15)"'), "Debe tener botón de aumentar zoom");
    assert(html.includes('onclick="resetDocSignZoom()"'), "Debe tener botón de restablecer zoom");

    // docSignCompletedCard movido a la columna derecha
    const colRightIdx = html.indexOf('<div class="lg:col-span-5');
    assert(colRightIdx !== -1, "Debe existir la columna derecha lg:col-span-5");
    const completedCardIdx = html.indexOf('id="docSignCompletedCard"');
    assert(completedCardIdx !== -1, "Debe existir docSignCompletedCard");
    assert(completedCardIdx > colRightIdx, "docSignCompletedCard debe estar ubicado DENTRO de la columna derecha lg:col-span-5");

    // Botón visible y directo de Reiniciar Firmas en cabecera
    assert(html.includes('onclick="resetDocumentSignatures()"'), "Debe existir botón de Reiniciar Firmas");
    assert(html.includes('<span>🔄 Reiniciar</span>'), "Debe tener texto visible '🔄 Reiniciar'");

    // Elementos de descarga y avisos
    assert(html.includes('id="docSignCompletedRequesterActions"'), "Debe tener contenedor para acciones del solicitante");
    assert(html.includes('id="docSignCompletedNonRequesterNotice"'), "Debe tener aviso para otros firmantes");
    assert(html.includes('id="docSignCompletedRequesterName"'), "Debe tener span para el nombre del solicitante");

    console.log("  -> Layout, visor ampliado, zoom y botón directo de reiniciar verificados.");
}

// 2. Verificación de Lógica de Roles y Descarga Exclusiva
function testRequesterLogicAndPermissions() {
    console.log("\n[Test 2] Verificando lógica de roles de solicitante vs otros firmantes en app.js...");
    const appJs = fs.readFileSync('app.js', 'utf8');

    assert(appJs.includes('window.getDocSignRequester = function'), "app.js debe exponer getDocSignRequester");
    assert(appJs.includes('window.isCurrentUserDocRequesterOrSuper = function'), "app.js debe exponer isCurrentUserDocRequesterOrSuper");
    assert(appJs.includes('window.changeDocSignZoom = function'), "app.js debe exponer changeDocSignZoom");
    assert(appJs.includes('window.resetDocSignZoom = function'), "app.js debe exponer resetDocSignZoom");

    // Simulación en entorno de prueba
    const vm = require('vm');
    const sandbox = {
        currentUserRole: 'Consultor',
        localAuthor: 'Emmanuel Osvaldo Sánchez Avilés',
        document: {
            getElementById: (id) => ({
                classList: {
                    add: () => {},
                    remove: () => {},
                    toggle: () => {}
                },
                textContent: ''
            })
        },
        window: {}
    };
    vm.createContext(sandbox);

    // Ejecutar funciones en sandbox
    vm.runInContext(`
        ${appJs.substring(appJs.indexOf('window.isSameUserOrAlias = function'), appJs.indexOf('function getProjectById'))}
    `, sandbox);

    // Verificar isSameUserOrAlias con alias y tildes
    assert(sandbox.window.isSameUserOrAlias('Emmanuel Osvaldo Sánchez Avilés', 'Osvaldo Avilés') === true, "Alias de Osvaldo debe coincidir");
    assert(sandbox.window.isSameUserOrAlias('Rafael Romero Romero', 'Rafael Romero') === true, "Alias de Rafael debe coincidir");
    assert(sandbox.window.isSameUserOrAlias('Miguel Ángel Barbosa López', 'Miguel Barbosa') === true, "Alias de Barbosa debe coincidir");
    assert(sandbox.window.isSameUserOrAlias('Emmanuel Osvaldo', 'Miguel Barbosa') === false, "Nombres distintos no deben coincidir");

    // Verificar getDocSignRequester
    const mockItem = { id: 'p1', name: 'Proyecto Alfa', consultor: 'Emmanuel Osvaldo Sánchez Avilés' };
    const mockDoc = { ticket: '123' };
    assert(sandbox.window.getDocSignRequester(mockItem, mockDoc) === 'Emmanuel Osvaldo Sánchez Avilés', "Requester debe ser el consultor del proyecto");

    // Verificar isCurrentUserDocRequesterOrSuper
    sandbox.localAuthor = 'Emmanuel Osvaldo Sánchez Avilés';
    sandbox.currentUserRole = 'Consultor';
    assert(sandbox.window.isCurrentUserDocRequesterOrSuper(mockItem, mockDoc) === true, "Osvaldo es el solicitante, debe tener permiso");

    sandbox.localAuthor = 'Miguel Ángel Barbosa López';
    sandbox.currentUserRole = 'Consultor';
    assert(sandbox.window.isCurrentUserDocRequesterOrSuper(mockItem, mockDoc) === false, "Miguel Barbosa no es el solicitante, NO debe tener permiso de descarga masiva");

    sandbox.currentUserRole = 'Supremo';
    assert(sandbox.window.isCurrentUserDocRequesterOrSuper(mockItem, mockDoc) === true, "Supremo siempre tiene permisos directivos");

    console.log("  -> Permisos de descarga exclusiva y resolución de solicitante probados con éxito.");
}

// 3. Verificación de Notificación DOCUMENT_SIGNED_COMPLETE
function testSignedNotification() {
    console.log("\n[Test 3] Verificando notificación automática al solicitante cuando se llega al 100%...");
    const appJs = fs.readFileSync('app.js', 'utf8');

    assert(appJs.includes("type === 'DOCUMENT_SIGNED_COMPLETE'"), "sendExternalAlert debe manejar DOCUMENT_SIGNED_COMPLETE");
    assert(appJs.includes("pushTitle = '📄 ¡DOCUMENTO 100% FIRMADO!'"), "Push debe generar título formal de documento firmado");
    assert(appJs.includes("window.sendExternalAlert('DOCUMENT_SIGNED_COMPLETE'"), "stampSignatureOnActiveDocument debe llamar a sendExternalAlert con DOCUMENT_SIGNED_COMPLETE");

    console.log("  -> Disparo de notificación y Web Push al solicitante verificado.");
}

// 4. Verificación de Control de Versiones v1008
function testVersioning() {
    console.log("\n[Test 4] Verificando versionado 20261027_v1008...");
    const html = fs.readFileSync('index.html', 'utf8');
    const sw = fs.readFileSync('sw.js', 'utf8');

    assert(html.includes('app.js?v=20261027_v1008'), "index.html debe cargar app.js?v=20261027_v1008");
    assert(sw.includes("const SW_VERSION = '20261027_v1008';"), "sw.js debe definir SW_VERSION = '20261027_v1008'");

    console.log("  -> Versión 20261027_v1008 verificada en html y service worker.");
}

testLayoutAndErgonomics();
testRequesterLogicAndPermissions();
testSignedNotification();
testVersioning();

console.log("\n✅ TODOS LOS TESTS DE v1008 PASARON EXITOSAMENTE.");
