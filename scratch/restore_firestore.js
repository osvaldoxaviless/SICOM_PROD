const fs = require('fs');

async function restore() {
  console.log('Iniciando restauracion de base de datos a Firestore...');
  
  // 1. Leer respaldo maestro
  const backupPath = 'C:/Users/osvsa/Desktop/versiones/sicom_backup_2026-10-07.json';
  const rawData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  // Mantener las dailyTasks que ya estaban en Firestore
  if (!rawData.appData.dailyTasks) {
    rawData.appData.dailyTasks = [];
  }

  // 2. Autenticar en Firebase
  const authRes = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyD5_UtypfJg5qsFDdv-MBamP18IZ_vZhVE', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });
  const auth = await authRes.json();
  if (!auth.idToken) {
    throw new Error('Fallo de autenticacion Firebase: ' + JSON.stringify(auth));
  }
  console.log('Autenticado en Firebase exitosamente');

  // 3. Convertir JS Object a Firestore REST Value Format
  function toFirestore(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return { integerValue: String(val) };
      return { doubleValue: val };
    }
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) {
      return { arrayValue: { values: val.map(toFirestore) } };
    }
    if (typeof val === 'object') {
      const fields = {};
      for (const [k, v] of Object.entries(val)) {
        if (v !== undefined) fields[k] = toFirestore(v);
      }
      return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
  }

  const firestoreDoc = {
    fields: {
      appData: toFirestore(rawData.appData),
      consultants: toFirestore(rawData.consultants),
      globalDocs: toFirestore(rawData.globalDocs)
    }
  };

  // 4. Enviar a Firestore
  const docUrl = 'https://firestore.googleapis.com/v1/projects/sicom-stgt/databases/(default)/documents/artifacts/sicom-stgt/public/data/sicom_state/main';
  const writeRes = await fetch(docUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + auth.idToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(firestoreDoc)
  });

  console.log('STATUS PATCH FIRESTORE:', writeRes.status);
  const result = await writeRes.json();
  if (writeRes.status === 200) {
    console.log('✅ RESTAURACIÓN EXITOSA! Firestore ha sido repoblado con todos los módulos y proyectos.');
  } else {
    console.error('❌ ERROR AL ESCRIBIR EN FIRESTORE:', JSON.stringify(result));
  }
}

restore().catch(console.error);
