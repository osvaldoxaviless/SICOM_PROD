const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'app.js');
let content = fs.readFileSync(appJsPath, 'utf8');

// 1. Extraer la línea de defaultTestingData
const marker = '    const defaultTestingData = ';
const idxStart = content.indexOf(marker);
if (idxStart === -1) {
  console.error('No se encontró defaultTestingData en app.js');
  process.exit(1);
}

const idxEnd = content.indexOf(';\n', idxStart);
const defaultTestingDataLine = content.substring(idxStart, idxEnd + 1);

console.log('Línea encontrada. Tamaño:', defaultTestingDataLine.length);

// 2. Remover la declaración de su posición actual (alrededor de línea 141)
content = content.substring(0, idxStart) + content.substring(idxEnd + 2);

// 3. Insertar defaultTestingData justo antes de `let appData = JSON.parse(JSON.stringify(defaultTestingData));`
const targetMarker = '    let appData = JSON.parse(JSON.stringify(defaultTestingData));';
const targetIdx = content.indexOf(targetMarker);
if (targetIdx === -1) {
  console.error('No se encontró el targetMarker');
  process.exit(1);
}

content = content.substring(0, targetIdx) + defaultTestingDataLine + '\n\n' + content.substring(targetIdx);

fs.writeFileSync(appJsPath, content, 'utf8');
console.log('app.js reordenado con éxito.');
