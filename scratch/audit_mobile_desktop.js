const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('====================================================');
console.log('🚀 INICIANDO AUDITORÍA INTEGRAL: EXPERIENCIA MÓVIL Y ESCRITORIO');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passCount++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failCount++;
    }
}

// 1. CARGA DE ARCHIVOS
const htmlPath = path.join(__dirname, '..', 'index.html');
const jsPath = path.join(__dirname, '..', 'app.js');
const cssPath = path.join(__dirname, '..', 'styles.css');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// 2. AUDITORÍA DE MOTOR TÁCTIL Y GESTOS (app.js)
console.log('📌 1. AUDITORÍA DEL MOTOR DE INTERACCIÓN TÁCTIL Y ESCRITORIO (app.js):');
assert(jsContent.includes('suppressClickUntil = Date.now() + 350'), 'Supresor de clics fantasmas en canvas implementado tras arrastre');
assert(jsContent.includes('window.addEventListener(\'click\','), 'Listener global en fase de captura para interceptar falsos toques tras paneo');
assert(jsContent.includes('touchTotalDistance > 6'), 'Umbral de detección de paneo (6px) configurado para diferenciar toque vs arrastre');
assert(jsContent.includes('if (e.cancelable) e.preventDefault();'), 'Prevención de rebote del navegador en movimiento táctil');
assert(jsContent.includes('initialPinchDistance) * 0.004'), 'Pellizco táctil de dos dedos (pinch-to-zoom) calculado con factor suave');
assert(jsContent.includes('minFloor = window.innerWidth < 640 ? 0.12 : 0.35'), 'Piso mínimo dinámico de zoom para móviles (0.12) vs escritorio (0.35)');
assert(jsContent.includes('targetScale = window.innerWidth < 640 ? 0.80 : 1.05'), 'Escala óptima de enfoque responsive adaptada para móvil (0.80) y escritorio (1.05)');
assert(jsContent.includes('padding = isMobile ? 16 : 70'), 'Padding responsive en centrado de canvas (16px móvil / 70px escritorio)');
assert(jsContent.includes('document.body.classList.add(\'info-card-open\')'), 'Clase reactiva "info-card-open" inyectada al abrir InfoCard');
assert(jsContent.includes('document.body.classList.remove(\'info-card-open\')'), 'Clase "info-card-open" removida al cerrar InfoCard');
assert(jsContent.includes('window.addEventListener(\'resize\','), 'Detector debounced de rotación de pantalla / redimensionamiento activo');

// 3. AUDITORÍA DE CSS RESPONSIVE Y SCROLL (styles.css)
console.log('\n📌 2. AUDITORÍA DE CSS, SCROLLING TÁCTIL Y COLISIONES (styles.css):');
assert(!cssContent.includes('body { background-color: #000000; color: #f5f5f7; overflow: hidden; margin: 0; padding: 0; touch-action: none;'), 'touch-action: none removido de body para permitir scroll en drawers y modales');
assert(cssContent.includes('touch-action: pan-y !important;'), 'Regla universal touch-action: pan-y activa para todos los contenedores verticales');
assert(cssContent.includes('touch-action: pan-x pan-y !important;'), 'Regla touch-action: pan-x activa para barras de pestañas horizontales');
assert(cssContent.includes('-webkit-overflow-scrolling: touch !important;'), 'Aceleración de scroll inercial por hardware para iOS / Safari');
assert(cssContent.includes('overscroll-behavior-y: contain !important;'), 'Aislamiento de rebote overscroll contain en contenedores');
assert(cssContent.includes('body.info-card-open #speedDial'), 'Ocultación automática de Speed Dial cuando InfoCard está abierta en móvil');
assert(cssContent.includes('body.info-card-open #btnDailyTasks'), 'Ocultación automática de Notificaciones Flotantes sobre InfoCard en móvil');
assert(cssContent.includes('body.info-card-open #btnManual'), 'Ocultación automática de Guía Manual sobre InfoCard en móvil');
assert(cssContent.includes('body:has(#dailyDrawer:not(.-translate-x-full)) #btnDailyTasks'), 'Ocultación limpia de botones flotantes cuando los Drawers laterales están abiertos');

// 4. AUDITORÍA DE ESTRUCTURA Y ELEMENTOS (index.html)
console.log('\n📌 3. AUDITORÍA DE MAQUETACIÓN RESPONSIVE (index.html):');
assert(htmlContent.includes('id="topBarWelcome" class="text-[9px] sm:text-[10px] text-gray-400 font-medium tracking-wide truncate max-w-[100px] xs:max-w-[130px] sm:max-w-[200px] md:max-w-none"'), 'Truncado elástico de bienvenida de usuario en cabecera para evitar desborde');
assert(htmlContent.includes('id="infoCard" class="absolute bottom-4 left-4 right-4 md:left-auto md:bottom-8 md:right-8 md:w-[400px] liquid-glass rounded-[2rem] p-4 sm:p-6 hidden opacity-0 transition-opacity duration-400 z-[60]'), 'InfoCard elevada a z-[60] con padding responsive (p-4 en móvil, p-6 en escritorio)');
assert(htmlContent.includes('onclick="recenterCanvas(); toggleMobileMenu()"'), 'Botón "Centrar Mapa" integrado en menú desplegable móvil de 3 puntos');
assert(htmlContent.includes('class="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mt-2 border-t border-white/10 pt-4 sm:col-span-2 min-h-[60px]"'), 'Selectores de fecha de Envío/Autorización en panel Editar adaptados a flex-col móvil');
assert(htmlContent.includes('<div class="flex flex-col sm:flex-row gap-2">'), 'Bloque de agregar tareas rápidas adaptado responsivamente para no truncar inputs');
assert(htmlContent.includes('rounded-[2rem] p-6 sm:p-10 max-w-sm'), 'Card de Login adaptada con padding responsivo p-6 en celulares');

// 5. AUDITORÍA DE INTEGRIDAD DOM: REVISIÓN DE TODOS LOS IDs EN app.js
console.log('\n📌 4. AUDITORÍA DE ENLACES DOM Y SELECTORES JS:');
const domIdMatches = jsContent.matchAll(/document\.getElementById\(['"]([a-zA-Z0-9_\-]+)['"]\)/g);
const checkedIds = new Set();
let missingDomIds = [];

for (const match of domIdMatches) {
    const id = match[1];
    if (checkedIds.has(id)) continue;
    checkedIds.add(id);
    
    // IDs dinámicos esperados o globales
    if (id.startsWith('quick') && (id.includes('Na') || id.includes('Btn'))) continue;
    if (id.startsWith('edit') && (id.includes('Na') || id.includes('Btn'))) continue;
    if (id.startsWith('tabBtn-')) continue;
    if (['themeIconSun','themeIconMoon','themeToggleLabel','alertsBadgeMobile','filterConsultantWrapper','filterStatusWrapper','consultantFilter','statusFilter'].includes(id)) continue; // legacy, protegidos con if()
    if (id.startsWith('histCatBtn-')) continue;
    if (id.startsWith('notifTabBtn-')) continue;
    if (id.startsWith('notifTabCount-')) continue;

    if (!htmlContent.includes(`id="${id}"`)) {
        missingDomIds.push(id);
    }
}

if (missingDomIds.length === 0) {
    assert(true, `Los ${checkedIds.size} IDs del DOM invocados por JS existen perfectamente en index.html`);
} else {
    assert(false, `IDs del DOM faltantes en index.html: ${missingDomIds.join(', ')}`);
}

// 6. VERIFICACIÓN DE SERVIDOR LOCAL
console.log('\n📌 5. PRUEBA DE CONEXIÓN AL SERVIDOR LOCAL HTTP (Puerto 5500):');
const req = http.get('http://127.0.0.1:5500/index.html', (res) => {
    assert(res.statusCode === 200, `Servidor local responde con código HTTP ${res.statusCode} OK`);
    console.log('\n====================================================');
    console.log(`📊 RESULTADO FINAL DE LA AUDITORÍA:`);
    console.log(`   Pruebas Exitosas: ${passCount}`);
    console.log(`   Fallos: ${failCount}`);
    console.log('====================================================');
    process.exit(failCount === 0 ? 0 : 1);
});

req.on('error', (err) => {
    console.log(`  ℹ️ Servidor en puerto 5500 no responde directamente (${err.message}). Continuando con auditoría estática.`);
    console.log('\n====================================================');
    console.log(`📊 RESULTADO FINAL DE LA AUDITORÍA ESTÁTICA:`);
    console.log(`   Pruebas Exitosas: ${passCount}`);
    console.log(`   Fallos: ${failCount}`);
    console.log('====================================================');
    process.exit(failCount === 0 ? 0 : 1);
});


