const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'app.js');
let content = fs.readFileSync(appJsPath, 'utf8');

const target = 'async function initData() {\n        window.populateLoginDropdown();';
const targetCRLF = 'async function initData() {\r\n        window.populateLoginDropdown();';

let replacement = `async function initData() {
        window.populateLoginDropdown();

        // Arranque instantáneo de interfaz (Cero tiempo de espera)
        if (localAuthor) { 
            finishInit(); 
        } else { 
            showLoginScreen(); 
        }`;

if (content.includes(targetCRLF)) {
  replacement = replacement.replace(/\n/g, '\r\n');
  content = content.replace(targetCRLF, replacement);
  console.log('Replaced with CRLF');
} else if (content.includes(target)) {
  content = content.replace(target, replacement);
  console.log('Replaced with LF');
} else {
  console.error('Target not found');
  process.exit(1);
}

fs.writeFileSync(appJsPath, content, 'utf8');
console.log('Instant boot successfully added to initData.');
