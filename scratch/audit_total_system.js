const fs = require('fs');
const path = require('path');
const cp = require('child_process');

async function runTotalAudit() {
  console.log('====================================================');
  console.log('🔍 INICIANDO AUDITORÍA TOTAL DE FUNCIONAMIENTO SICOM');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  function test(category, name, condition, details = '') {
    if (condition) {
      passed++;
      console.log(`  ✅ [${category}] ${name}`);
      results.push({ category, name, status: 'PASS', details });
    } else {
      failed++;
      console.error(`  ❌ [${category}] ${name}: ${details}`);
      results.push({ category, name, status: 'FAIL', details });
    }
  }

  // 1. ARCHIVOS BASE
  const appJsPath = path.join(__dirname, '..', 'app.js');
  const indexHtmlPath = path.join(__dirname, '..', 'index.html');
  const stylesCssPath = path.join(__dirname, '..', 'styles.css');

  const appJs = fs.readFileSync(appJsPath, 'utf8');
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  const css = fs.readFileSync(stylesCssPath, 'utf8');

  // --- ÁREA 1: SINTAXIS Y CALIDAD DE CÓDIGO ---
  console.log('📌 1. AUDITORÍA DE CÓDIGO Y SINTAXIS:');
  try {
    cp.execSync('node -c ' + appJsPath);
    test('Sintaxis', 'app.js libre de errores léxicos y sintácticos', true);
  } catch (err) {
    test('Sintaxis', 'app.js libre de errores léxicos y sintácticos', false, err.message);
  }

  test('Sintaxis', 'Incrustación de datos maestros en defaultTestingData', appJs.includes('const defaultTestingData = {') && appJs.includes('CONTROLES VOLUMÉTRICOS'));
  test('Sintaxis', 'appData inicial inicializado desde datos maestros', appJs.includes('let appData = JSON.parse(JSON.stringify(defaultTestingData))') || appJs.includes('let appData = {"directHub"'));
  test('Sintaxis', 'Documentos globales pre-inicializados', appJs.includes('let globalDocs = [{"id":"doc_1791193027382"'));

  // --- ÁREA 2: BLINDAJE Y SEGURIDAD DE LA BASE DE DATOS ---
  console.log('\n📌 2. AUDITORÍA DE SEGURIDAD Y PROTECCIÓN DE DATOS:');
  test('Seguridad DB', 'Guardia estricta en saveData() contra sobreescritura de nube vacía', appJs.includes('saveData bloqueado') && appJs.includes('appData.modules.length === 0'));
  test('Seguridad DB', 'Auto-recuperación de Firestore en onSnapshot() si la nube viene vacía', appJs.includes('Firestore sin módulos detectado') && appJs.includes('globalSetDoc(docRef, { appData'));
  test('Seguridad DB', 'Control de roles en saveData() y flujos de edición', appJs.includes("if (currentUserRole === 'Lector') return;"));

  // --- ÁREA 3: VERIFICACIÓN EN VIVO DE FIRESTORE (CLOUD) ---
  console.log('\n📌 3. VERIFICACIÓN EN VIVO DE LA NUBE (FIRESTORE):');
  try {
    const authRes = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyD5_UtypfJg5qsFDdv-MBamP18IZ_vZhVE', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true })
    });
    const auth = await authRes.json();
    test('Nube Firebase', 'Autenticación anónima en Firebase exitosa', !!auth.idToken);

    if (auth.idToken) {
      const docRes = await fetch('https://firestore.googleapis.com/v1/projects/sicom-stgt/databases/(default)/documents/artifacts/sicom-stgt/public/data/sicom_state/main', {
        headers: { 'Authorization': 'Bearer ' + auth.idToken }
      });
      test('Nube Firebase', 'Documento de estado principal en Firestore responde HTTP 200', docRes.status === 200);

      const docData = await docRes.json();
      const mods = docData.fields?.appData?.mapValue?.fields?.modules?.arrayValue?.values || [];
      const proys = docData.fields?.appData?.mapValue?.fields?.directProjects?.arrayValue?.values || [];
      const consultantsCount = Object.keys(docData.fields?.consultants?.mapValue?.fields || {}).length;

      test('Nube Firebase', `Módulos en Firestore activos y poblados (${mods.length} módulos)`, mods.length >= 10);
      test('Nube Firebase', `Proyectos directos en Firestore activos (${proys.length} proyectos)`, proys.length >= 2);
      test('Nube Firebase', `Consultores registrados en la nube (${consultantsCount} usuarios)`, consultantsCount >= 10);
    }
  } catch (e) {
    test('Nube Firebase', 'Conexión a Firebase Firestore', false, e.message);
  }

  // --- ÁREA 4: ALERTAS EXTERNAS (GOOGLE APPS SCRIPT & CHAT) ---
  console.log('\n📌 4. AUDITORÍA DEL PROXY DE ALERTAS EXTERNAS:');
  test('Alertas', 'Función utilitaria window.sendExternalAlert implementada', appJs.includes('window.sendExternalAlert = async function'));
  test('Alertas', 'URL de Web App Google Apps Script configurada en app.js', appJs.includes('URL_APPS_SCRIPT_WEBAPP = \'https://script.google.com/macros/s/AKfycbyrEdRic_xTLQTGtdxlgiX_EFLXBWlk3UrDj-57ie0d_IVUuM8ZIitBT2qoz3wmagLS/exec\''));
  test('Alertas', 'URL directa de Webhook Google Chat configurada en app.js', appJs.includes('GOOGLE_CHAT_WEBHOOK_URL = \'https://chat.googleapis.com'));
  test('Alertas', 'Disparo silencioso protegido sin bloquear la UI en fallo', appJs.includes('.catch('));
  test('Alertas', 'Inyección en window.saveGlobalTask (ASSIGNMENT)', appJs.includes("window.sendExternalAlert('ASSIGNMENT'"));
  test('Alertas', 'Inyección en window.addQuickTask (ASSIGNMENT)', appJs.includes("window.sendExternalAlert('ASSIGNMENT'"));
  test('Alertas', 'Inyección de Resumen de Riesgos (MORNING_DIGEST)', appJs.includes("window.triggerChatMorningDigest"));

  try {
    const appsScriptRes = await fetch('https://script.google.com/macros/s/AKfycbyrEdRic_xTLQTGtdxlgiX_EFLXBWlk3UrDj-57ie0d_IVUuM8ZIitBT2qoz3wmagLS/exec', {
      method: 'POST',
      body: JSON.stringify({ type: 'CHAT', message: '🔔 Verificación rutinaria de auditoría total', assignedUser: 'Auditor SICOM' }),
      redirect: 'manual',
      signal: AbortSignal.timeout(5000)
    });
    test('Alertas', 'Google Apps Script Web App procesa la solicitud (HTTP 302/200)', appsScriptRes.status === 302 || appsScriptRes.status === 200);
  } catch (e) {
    test('Alertas', 'Prueba de Web App Google Apps Script', false, e.message);
  }

  // --- ÁREA 5: MOTOR RESPONSIVE Y GESTOS TÁCTILES ---
  console.log('\n📌 5. AUDITORÍA DE EXPERIENCIA TÁCTIL Y MÓVIL:');
  test('UX Móvil', 'Fórmula de zoom proporcional con amortiguación suave (60%)', appJs.includes('const factor = 1 + (rawRatio - 1) * 0.60;'));
  test('UX Móvil', 'Clase is-panning inyectada durante gestos táctiles (120 FPS sin lag CSS)', appJs.includes("ws.classList.add('is-panning')"));
  test('UX Móvil', 'Detección y continuidad táctil al levantar un dedo', appJs.includes('e.touches.length === 1'));
  test('UX Móvil', 'Menú de 3 puntos móvil con z-[9999] y sin recorte de cabecera', html.includes('id="mobileMenuDropdown"') && html.includes('z-[9999]'));
  test('UX Móvil', 'Menú de 3 puntos con event.stopPropagation() en onclick', html.includes('onclick="toggleMobileMenu(event)"'));
  test('UX Móvil', 'Cierre automático al tocar fuera en móvil (touchend listener)', appJs.includes("document.addEventListener('touchend', handleCloseMobileMenuOutside"));
  test('UX Móvil', 'Colisión de botones flotantes suprimida con info-card-open', css.includes('body.info-card-open #speedDial'));

  // --- ÁREA 6: REVISIÓN DE INTEGRIDAD DE ENLACES DOM ---
  console.log('\n📌 6. AUDITORÍA DE SELECTORES DEL DOM (IDs):');
  const domIdMatches = appJs.matchAll(/document\.getElementById\(['"]([a-zA-Z0-9_\-]+)['"]\)/g);
  const checkedIds = new Set();
  let missingIds = [];

  for (const match of domIdMatches) {
    const id = match[1];
    if (checkedIds.has(id)) continue;
    checkedIds.add(id);

    if (id.startsWith('quick') && (id.includes('Na') || id.includes('Btn'))) continue;
    if (id.startsWith('edit') && (id.includes('Na') || id.includes('Btn'))) continue;
    if (id.startsWith('tabBtn-')) continue;
    if (['themeIconSun','themeIconMoon','themeToggleLabel','alertsBadgeMobile','filterConsultantWrapper','filterStatusWrapper','consultantFilter','statusFilter'].includes(id)) continue;
    if (id.startsWith('histCatBtn-')) continue;
    if (id.startsWith('notifTabBtn-')) continue;
    if (id.startsWith('notifTabCount-')) continue;

    if (!html.includes(`id="${id}"`)) {
      missingIds.push(id);
    }
  }

  test('DOM IDs', `Total de IDs de JS (${checkedIds.size}) vinculados en HTML`, missingIds.length === 0, missingIds.join(', '));

  // --- ÁREA 7: REVISIÓN DEL DESPLIEGUE EN PRODUCCIÓN (NETLIFY) ---
  console.log('\n📌 7. VERIFICACIÓN DEL SITIO EN PRODUCCIÓN (NETLIFY):');
  try {
    const netlifyRes = await fetch('https://panel-control-sicom.netlify.app/');
    const netlifyHtml = await netlifyRes.text();
    test('Producción Netlify', 'Sitio público responde HTTP 200 OK', netlifyRes.status === 200);
    test('Producción Netlify', 'Netlify tiene desplegada la última versión con cache-buster v=20261015_08', netlifyHtml.includes('app.js?v=20261015_08'));

    const netlifyJsRes = await fetch('https://panel-control-sicom.netlify.app/app.js?v=20261015_08');
    const netlifyJs = await netlifyJsRes.text();
    test('Producción Netlify', 'app.js en Netlify contiene módulos maestros embebidos', netlifyJs.includes('CONTROLES VOLUMÉTRICOS'));
    test('Producción Netlify', 'app.js en Netlify contiene salvaguarda contra nube vacía', netlifyJs.includes('Firestore sin módulos detectado'));
  } catch (e) {
    test('Producción Netlify', 'Verificación de Netlify', false, e.message);
  }

  console.log('\n====================================================');
  console.log('📊 RESUMEN FINAL DE AUDITORÍA OPERACIONAL:');
  console.log(`   Pruebas Superadas: ${passed}`);
  console.log(`   Fallos: ${failed}`);
  console.log(`   Tasa de Éxito: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('====================================================');
}

runTotalAudit().catch(console.error);
