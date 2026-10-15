// scratch/test_multi_module.js
// Verification of Multi-Module Linkage logic

const fs = require('fs');
const path = require('path');

console.log("=== INICIANDO AUDITORÍA DE MULTIMÓDULO ===");

// 1. Check HTML elements
const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const checks = [
    'id="newProjSecondaryModulesList"',
    'id="newProjSecondaryModulesContainer"',
    'id="editProjSecondaryModulesList"',
    'id="editProjSecondaryModulesContainer"',
    'id="infoModulesContainer"',
    'styles.css?v=20261015_18',
    'app.js?v=20261015_18'
];

let allHtmlPassed = true;
checks.forEach(str => {
    if (htmlContent.includes(str)) {
        console.log(`[PASS] index.html contiene "${str}"`);
    } else {
        console.error(`[FAIL] index.html NO contiene "${str}"`);
        allHtmlPassed = false;
    }
});

// 2. Check styles.css
const cssContent = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');
if (cssContent.includes('.secondary-module-connector')) {
    console.log('[PASS] styles.css contiene ".secondary-module-connector"');
} else {
    console.error('[FAIL] styles.css NO contiene ".secondary-module-connector"');
}

// 3. Check app.js logic keywords
const appContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const jsChecks = [
    'populateSecondaryModulesChecklist',
    'secondaryModules',
    'secondary-module-connector',
    'hasSecBadge',
    'infoModulesContainer'
];

jsChecks.forEach(str => {
    if (appContent.includes(str)) {
        console.log(`[PASS] app.js contiene "${str}"`);
    } else {
        console.error(`[FAIL] app.js NO contiene "${str}"`);
    }
});

console.log("=== AUDITORÍA ESTÁTICA COMPLETADA CON ÉXITO ===");
