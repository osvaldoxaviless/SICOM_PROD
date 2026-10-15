const fs = require('fs');
const path = require('path');

// Simular entorno de navegador básico para app.js
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

console.log('--- Verificando consistencia de elementos HTML críticos ---');

const criticalIds = [
  'workspace',
  'mindmapCanvas',
  'canvasGroup',
  'infoCard',
  'configDrawer',
  'priorityDrawer',
  'alertsDrawer',
  'filterDrawer',
  'loginOverlay',
  'loginCard',
  'loginUserSelect',
  'loginPasswordInput',
  'globalTaskModal',
  'quickTaskModal',
  'speedDial',
  'cloudLoader',
  'topBarWelcome',
  'mobileMenuDropdown'
];

let allOk = true;
criticalIds.forEach(id => {
  if (html.includes(`id="${id}"`)) {
    console.log(`✅ ID crítico encontrado: #${id}`);
  } else {
    console.error(`❌ FALTA ID crítico: #${id}`);
    allOk = false;
  }
});

console.log('\n--- Verificando llamadas a funciones onclick en index.html ---');
const onclickMatches = [...html.matchAll(/onclick="([a-zA-Z0-9_]+)\(/g)];
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

const uniqueFunctions = [...new Set(onclickMatches.map(m => m[1]))];
let missingFuncs = 0;

uniqueFunctions.forEach(fn => {
  const inWindow = appJs.includes(`window.${fn} `) || appJs.includes(`window.${fn}=`) || appJs.includes(`function ${fn}(`);
  if (!inWindow) {
    console.warn(`⚠️ Posible función faltante en app.js: ${fn}`);
    missingFuncs++;
  }
});

if (missingFuncs === 0) {
  console.log(`✅ Todas las funciones onclick (${uniqueFunctions.length}) están definidas en app.js.`);
}

console.log('\nResultado simulación:', allOk && missingFuncs === 0 ? 'EXITOSO' : 'CON ADVERTENCIAS');
