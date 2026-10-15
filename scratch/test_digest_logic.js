async function testDigest() {
  // 1. Auth anon
  const authRes = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyD5_UtypfJg5qsFDdv-MBamP18IZ_vZhVE', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });
  const auth = await authRes.json();
  const idToken = auth.idToken;

  // 2. Fetch doc
  const docRes = await fetch('https://firestore.googleapis.com/v1/projects/sicom-stgt/databases/(default)/documents/artifacts/sicom-stgt/public/data/sicom_state/main', {
    headers: { 'Authorization': 'Bearer ' + idToken }
  });
  const docData = await docRes.json();

  // Helper to unpack firestore json
  function fromFirestore(v) {
    if (!v) return null;
    if (v.stringValue !== undefined) return v.stringValue;
    if (v.booleanValue !== undefined) return v.booleanValue;
    if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
    if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
    if (v.arrayValue !== undefined) return (v.arrayValue.values || []).map(fromFirestore);
    if (v.mapValue !== undefined) {
      const obj = {};
      for (const [k, val] of Object.entries(v.mapValue.fields || {})) {
        obj[k] = fromFirestore(val);
      }
      return obj;
    }
    return null;
  }

  const appData = fromFirestore(docData.fields?.appData) || {};
  const modules = appData.modules || [];
  const directProjects = appData.directProjects || [];

  // Extract all projects
  const allProjects = [];
  directProjects.forEach(p => allProjects.push({ ...p, moduleName: 'PROYECTOS DIRECTOS' }));
  modules.forEach(m => {
    (m.projects || []).forEach(p => allProjects.push({ ...p, moduleName: m.name }));
  });

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const overdue = [];
  const dueSoon = [];
  const clientHold = [];
  const pendingValidation = [];

  allProjects.forEach(p => {
    // Check validation tasks
    (p.tasks || []).forEach(t => {
      if (t.done === 'pending') {
        pendingValidation.push({
          task: t.text,
          project: p.name,
          assignee: t.assignee || 'Sin asignar'
        });
      }
    });

    // Check client hold
    if (p.clientDeliveryDate && !p.clientReturnDate && p.status !== 'Completado') {
      clientHold.push({
        name: p.name,
        sentDate: p.clientDeliveryDate,
        consultants: (p.consultants || []).join(', ') || 'Sin asignar'
      });
    }

    // Check deadlines
    if (p.deadline && p.status !== 'Completado') {
      const [y, m, d] = p.deadline.split('-').map(Number);
      const deadTime = new Date(y, m - 1, d).getTime();
      const diffDays = Math.round((deadTime - todayTime) / 86400000);

      if (diffDays < 0) {
        overdue.push({
          name: p.name,
          module: p.moduleName,
          deadline: p.deadline,
          daysOverdue: Math.abs(diffDays),
          consultants: (p.consultants || []).join(', ') || 'Sin asignar'
        });
      } else if (diffDays <= 3) {
        dueSoon.push({
          name: p.name,
          module: p.moduleName,
          deadline: p.deadline,
          daysLeft: diffDays,
          consultants: (p.consultants || []).join(', ') || 'Sin asignar'
        });
      }
    }
  });

  // Build clean message
  let msg = `🌅 *TORRE DE CONTROL SICOM — RESUMEN MATUTINO*\n`;
  msg += `📅 _${now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}_\n\n`;

  if (overdue.length > 0) {
    msg += `🔴 *PROYECTOS VENCIDOS / ATRASADOS (${overdue.length}):*\n`;
    overdue.forEach(o => {
      msg += `• *${o.name}* [${o.module}]\n  ↳ Atraso: ${o.daysOverdue} día(s) (Venció: ${o.deadline})\n  ↳ Responsable(s): ${o.consultants}\n`;
    });
    msg += `\n`;
  } else {
    msg += `✅ *Proyectos Vencidos:* ¡Ninguno! Todo al corriente.\n\n`;
  }

  if (dueSoon.length > 0) {
    msg += `🟡 *PRÓXIMAS ENTREGAS (PRÓXIMOS 3 DÍAS) (${dueSoon.length}):*\n`;
    dueSoon.forEach(s => {
      const leftText = s.daysLeft === 0 ? '¡VENCE HOY!' : `Vence en ${s.daysLeft} día(s)`;
      msg += `• *${s.name}* — ${leftText} (${s.deadline})\n  ↳ Responsable(s): ${s.consultants}\n`;
    });
    msg += `\n`;
  }

  if (pendingValidation.length > 0) {
    msg += `⏳ *TAREAS PENDIENTES DE VALIDACIÓN (${pendingValidation.length}):*\n`;
    pendingValidation.forEach(v => {
      msg += `• "${v.task}" en *[${v.project}]*\n  ↳ Enviado por: ${v.assignee}\n`;
    });
    msg += `\n`;
  }

  if (clientHold.length > 0) {
    msg += `🤝 *EN REVISIÓN CON EL CLIENTE (${clientHold.length}):*\n`;
    clientHold.forEach(c => {
      msg += `• *${c.name}* (Enviado: ${c.sentDate})\n  ↳ Resp: ${c.consultants}\n`;
    });
    msg += `\n`;
  }

  msg += `🔗 *Acceso al Panel:* https://panel-control-sicom.netlify.app/`;

  console.log('--- MENSAJE GENERADO PARA GOOGLE CHAT ---');
  console.log(msg);
  return msg;
}

testDigest().catch(console.error);
