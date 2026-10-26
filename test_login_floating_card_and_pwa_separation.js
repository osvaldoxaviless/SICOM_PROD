const fs = require('fs');
const assert = require('assert');

console.log('========================================================================');
console.log('AUDITORÍA AUTOMATIZADA: TARJETA DE LOGIN FLOTANTE & DIFERENCIACIÓN MÓVIL/WEB (V975)');
console.log('========================================================================\n');

let passed = 0;
function test(name, fn) {
    try {
        fn();
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } catch (e) {
        console.error(`❌ [FAIL] ${name}:`, e.message);
        process.exit(1);
    }
}

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

test('1. index.html: #loginPwaInstallContainer posee hidden sm:flex (oculto en móvil por defecto)', () => {
    assert(html.includes('id="loginPwaInstallContainer" class="pt-3 border-t border-[#3d3a39]/20 hidden sm:flex items-center justify-between"'),
        'loginPwaInstallContainer debe tener clase hidden sm:flex');
});

test('2. styles.css: #loginCard posee sombra flotante táctica contra el canvas de rejilla', () => {
    assert(css.includes('box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7)'),
        'Falta sombra flotante en #loginCard');
});

test('3. styles.css: @media (max-width: 639px) oculta explícitamente #loginPwaInstallContainer en móvil', () => {
    assert(css.includes('#speedDial,\r\n    #loginPwaInstallContainer {\r\n        display: none !important;\r\n    }') ||
           css.includes('#speedDial,\n    #loginPwaInstallContainer {\n        display: none !important;\n    }'),
        'Debe haber regla display: none !important para loginPwaInstallContainer en max-width: 639px');
});

test('4. styles.css: @media (display-mode: standalone) oculta #loginPwaInstallContainer en app instalada', () => {
    assert(css.includes('@media (display-mode: standalone)') && (css.includes('#loginPwaInstallContainer {\r\n        display: none !important;') || css.includes('#loginPwaInstallContainer {\n        display: none !important;')),
        'Debe haber regla standalone que oculte loginPwaInstallContainer');
});

test('5. styles.css: Oculta dock inferior cuando login está activo', () => {
    assert(css.includes('body:has(#loginOverlay:not(.hidden)) #mobileBottomDock'),
        'Falta regla para ocultar dock inferior durante login');
});

test('6. app.js: showLoginScreen oculta dinámicamente loginPwaInstallContainer en móviles y PWA standalone', () => {
    assert(app.includes("pwaBox && (window.innerWidth < 640 || window.matchMedia('(display-mode: standalone)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))"),
        'Falta protección dinámica en showLoginScreen para loginPwaInstallContainer');
});

test('7. app.js: Color de etiqueta de Supervisor en login legible contra tarjeta hueso (#101010)', () => {
    assert(app.includes("passLabel.className = 'font-mono text-[10px] mb-2 flex items-center gap-1.5 uppercase text-[#101010]';"),
        'Supervisor debe usar text-[#101010] para no ser invisible sobre fondo hueso');
});

test('8. index.html & CSS: Proporciones de tarjeta idénticas a referencia visual de escritorio (36px SICOM, STGT badge, padding completo)', () => {
    assert(html.includes('text-[36px] font-normal text-[#101010] mb-1 tracking-[-1.12px] leading-[1.1]">SICOM</h2>'),
        'Encabezado SICOM 36px preservado');
    assert(html.includes('CONTROL SURFACE // STGT'),
        'Sub-etiqueta táctica CONTROL SURFACE // STGT preservada');
    assert(html.includes('id="loginLogo"') && html.includes('STGT'),
        'Badge oscuro STGT preservado');
});

test('9. Cache buster unificado en versión v=20261025_v975', () => {
    assert(html.includes('styles.css?v=20261025_v975'), 'Falta v975 en styles.css');
    assert(html.includes('app.js?v=20261025_v975'), 'Falta v975 en app.js');
});

console.log(`\n====================================================`);
console.log(`RESULTADO DE AUDITORÍA: ${passed} PASSED, 0 FAILED`);
console.log(`====================================================`);
