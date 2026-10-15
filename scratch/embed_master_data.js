const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

const backupPath = 'C:/Users/osvsa/Desktop/versiones/sicom_backup_2026-10-07.json';
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

if (!backup.appData.dailyTasks) backup.appData.dailyTasks = [];
if (!backup.appData.history) backup.appData.history = [];
if (!backup.appData.directProjects) backup.appData.directProjects = [];

const masterDataString = JSON.stringify(backup.appData);
const masterConsultantsString = JSON.stringify(backup.consultants);
const masterDocsString = JSON.stringify(backup.globalDocs);

// Reemplazar defaultTestingData usando índices
const defStart = appJs.indexOf('const defaultTestingData = {');
const defEnd = appJs.indexOf('async function initData()', defStart);

if (defStart !== -1 && defEnd !== -1) {
  const before = appJs.slice(0, defStart);
  const after = appJs.slice(defEnd);
  appJs = before + `const defaultTestingData = ${masterDataString};\n\n    ` + after;
  console.log('✅ defaultTestingData reemplazado con 10 módulos y proyectos');
}

// Reemplazar let appData inicial al inicio
const appDataStart = appJs.indexOf('let appData = {');
const appDataEnd = appJs.indexOf('let consultants =', appDataStart);

if (appDataStart !== -1 && appDataEnd !== -1) {
  const before = appJs.slice(0, appDataStart);
  const after = appJs.slice(appDataEnd);
  appJs = before + `let appData = JSON.parse(JSON.stringify(defaultTestingData));\n    ` + after;
  console.log('✅ let appData inicializado con defaultTestingData');
}

// Reemplazar onSnapshot
const snapStart = appJs.indexOf('unsubscribeSnapshot = onSnapshot(docRef, (snapshot) => {');
const snapEnd = appJs.indexOf('if(data.consultants && Object.keys(data.consultants).length > 2)', snapStart);

if (snapStart !== -1 && snapEnd !== -1) {
  const before = appJs.slice(0, snapStart);
  const after = appJs.slice(snapEnd);
  const newSnapLogic = `unsubscribeSnapshot = onSnapshot(docRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.data();
                        
                        // Protección estricta: verificar que la nube tenga módulos reales
                        if (data.appData && Array.isArray(data.appData.modules) && data.appData.modules.length > 0) {
                            appData = data.appData;
                        } else {
                            console.warn("⚠️ [SICOM Cloud] Firestore sin módulos detectado. Restaurando datos maestros a la nube...");
                            appData = JSON.parse(JSON.stringify(defaultTestingData));
                            if (globalSetDoc && docRef) {
                                globalSetDoc(docRef, { appData, consultants, globalDocs }, { merge: false });
                            }
                        }
                        
                        `;
  appJs = before + newSnapLogic + after;
  console.log('✅ onSnapshot blindado con restauración automática activa');
}

fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('🎉 app.js actualizado exitosamente.');
