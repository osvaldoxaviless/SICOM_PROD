const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// 1. Reemplazar sendExternalAlert e inyectar generador de digest y trigger
const oldAlertSection = `    // --- MÓDULO DE ALERTAS EXTERNAS (PROXY GOOGLE APPS SCRIPT) ---
    const URL_APPS_SCRIPT_WEBAPP = 'https://script.google.com/macros/s/AKfycbyrEdRic_xTLQTGtdxlgiX_EFLXBWlk3UrDj-57ie0d_IVUuM8ZIitBT2qoz3wmagLS/exec';

    window.sendExternalAlert = async function(type, message, assignedUser) {
        if (!URL_APPS_SCRIPT_WEBAPP || URL_APPS_SCRIPT_WEBAPP.includes('AKfycb...')) return;
        try {
            console.log('🔔 [SICOM External Alert] Disparando notificación:', { type, message, assignedUser });
            fetch(URL_APPS_SCRIPT_WEBAPP, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({
                    type: type,
                    message: message,
                    assignedUser: assignedUser || 'General'
                })
            }).then(() => {
                console.log('✅ [SICOM External Alert] Notificación despachada con éxito');
            }).catch((err) => {
                console.warn('⚠️ [SICOM External Alert] Aviso en envío:', err);
            });
        } catch (e) {
            console.warn('⚠️ [SICOM External Alert] Excepción silenciosa:', e);
        }
    };`;

const newAlertSection = `    // --- MÓDULO DE ALERTAS EXTERNAS (TORRE DE CONTROL GOOGLE WORKSPACE / CHAT) ---
    const URL_APPS_SCRIPT_WEBAPP = 'https://script.google.com/macros/s/AKfycbyrEdRic_xTLQTGtdxlgiX_EFLXBWlk3UrDj-57ie0d_IVUuM8ZIitBT2qoz3wmagLS/exec';

    window.sendExternalAlert = async function(type, dataOrMessage, assignedUser) {
        if (!URL_APPS_SCRIPT_WEBAPP || URL_APPS_SCRIPT_WEBAPP.includes('AKfycb...')) return;
        try {
            let payload = { type: type || 'CHAT' };
            if (typeof dataOrMessage === 'object' && dataOrMessage !== null) {
                payload = Object.assign(payload, dataOrMessage);
                if (!payload.message) {
                    if (type === 'ASSIGNMENT') payload.message = \`Nueva tarea en [\${payload.project || 'General'}]: "\${payload.task || ''}" (Vence: \${payload.deadline || 'Sin fecha'})\`;
                    else if (type === 'VALIDATION_SUBMITTED') payload.message = \`Tarea enviada a validación en [\${payload.project || 'General'}]: "\${payload.task || ''}" (Evidencia: "\${payload.feedback || ''}")\`;
                    else if (type === 'TASK_VALIDATED') payload.message = \`Tarea validada y aprobada en [\${payload.project || 'General'}]: "\${payload.task || ''}"\`;
                    else if (type === 'PROJECT_CREATED') payload.message = \`Nuevo proyecto registrado: [\${payload.project || ''}] (\${payload.module || ''})\`;
                }
                if (!payload.assignedUser && payload.assignee) payload.assignedUser = payload.assignee;
            } else {
                payload.message = dataOrMessage || '';
                payload.assignedUser = assignedUser || 'General';
            }
            console.log('🔔 [SICOM External Alert] Disparando notificación:', payload);
            fetch(URL_APPS_SCRIPT_WEBAPP, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload)
            }).then(() => {
                console.log('✅ [SICOM External Alert] Notificación despachada con éxito');
            }).catch((err) => {
                console.warn('⚠️ [SICOM External Alert] Aviso en envío:', err);
            });
        } catch (e) {
            console.warn('⚠️ [SICOM External Alert] Excepción silenciosa:', e);
        }
    };

    window.generateMorningDigestText = function() {
        const now = new Date();
        const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        const allProjects = [];
        (appData.directProjects || []).forEach(p => allProjects.push({ ...p, moduleName: 'PROYECTOS DIRECTOS' }));
        (appData.modules || []).forEach(m => {
            (m.projects || []).forEach(p => allProjects.push({ ...p, moduleName: m.name }));
        });
        
        const overdue = [];
        const dueSoon = [];
        const clientHold = [];
        const pendingValidation = [];
        
        allProjects.forEach(p => {
            (p.tasks || []).forEach(t => {
                if (t.done === 'pending') {
                    pendingValidation.push({ task: t.text, project: p.name, assignee: t.assignee || 'Sin asignar' });
                }
            });
            
            if (p.clientDeliveryDate && !p.clientReturnDate && p.status !== 'Completado') {
                clientHold.push({ name: p.name, sentDate: p.clientDeliveryDate, consultants: (p.consultants || []).join(', ') || 'Sin asignar' });
            }
            
            if (p.deadline && p.status !== 'Completado') {
                const parts = p.deadline.split('-');
                const deadTime = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
                const diffDays = Math.round((deadTime - todayTime) / 86400000);
                
                if (diffDays < 0) {
                    overdue.push({ name: p.name, module: p.moduleName, deadline: p.deadline, daysOverdue: Math.abs(diffDays), consultants: (p.consultants || []).join(', ') || 'Sin asignar' });
                } else if (diffDays <= 3) {
                    dueSoon.push({ name: p.name, module: p.moduleName, deadline: p.deadline, daysLeft: diffDays, consultants: (p.consultants || []).join(', ') || 'Sin asignar' });
                }
            }
        });
        
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const fechaTexto = \`\${now.getDate()} de \${meses[now.getMonth()]} de \${now.getFullYear()}\`;
        
        let msg = \`🌅 *TORRE DE CONTROL SICOM — RESUMEN DE RIESGOS*\\n\` +
                  \`📅 _\${fechaTexto}_\\n\\n\`;
                  
        if (overdue.length > 0) {
            msg += \`🔴 *PROYECTOS VENCIDOS / ATRASADOS (\${overdue.length}):*\\n\`;
            overdue.forEach(o => {
                msg += \`• *\${o.name}* [\${o.module}]\\n  ↳ Atraso: \${o.daysOverdue} día(s) (Venció: \${o.deadline})\\n  ↳ Responsable(s): \${o.consultants}\\n\`;
            });
            msg += \`\\n\`;
        } else {
            msg += \`✅ *Proyectos Vencidos:* ¡Ninguno! Todo al corriente.\\n\\n\`;
        }
        
        if (dueSoon.length > 0) {
            msg += \`🟡 *PRÓXIMAS ENTREGAS (PRÓXIMOS 3 DÍAS) (\${dueSoon.length}):*\\n\`;
            dueSoon.forEach(s => {
                const t = s.daysLeft === 0 ? "¡VENCE HOY!" : \`Vence en \${s.daysLeft} día(s)\`;
                msg += \`• *\${s.name}* — \${t} (\${s.deadline})\\n  ↳ Responsable(s): \${s.consultants}\\n\`;
            });
            msg += \`\\n\`;
        }
        
        if (pendingValidation.length > 0) {
            msg += \`⏳ *TAREAS PENDIENTES DE VALIDACIÓN (\${pendingValidation.length}):*\\n\`;
            pendingValidation.forEach(v => {
                msg += \`• "\${v.task}" en *[\${v.project}]*\\n  ↳ Enviado por: \${v.assignee}\\n\`;
            });
            msg += \`\\n\`;
        }
        
        if (clientHold.length > 0) {
            msg += \`🤝 *EN REVISIÓN CON EL CLIENTE (\${clientHold.length}):*\\n\`;
            clientHold.forEach(c => {
                msg += \`• *\${c.name}* (Enviado: \${c.sentDate})\\n  ↳ Resp: \${c.consultants}\\n\`;
            });
            msg += \`\\n\`;
        }
        
        msg += \`🔗 *Acceso al Panel:* https://panel-control-sicom.netlify.app/\`;
        return msg;
    };

    window.triggerChatMorningDigest = function() {
        if (currentUserRole === 'Lector') return;
        window.showToast("📡 Despachando Resumen a Google Chat...", false);
        const digestText = window.generateMorningDigestText();
        window.sendExternalAlert('MORNING_DIGEST', { message: digestText, assignedUser: 'General' });
        setTimeout(() => {
            window.showToast("✅ Resumen de Riesgos publicado en Google Chat", false);
        }, 1000);
    };`;

function replaceBlock(str, oldB, newB) {
  const normOld = oldB.replace(/\r\n/g, '\n');
  const normStr = str.replace(/\r\n/g, '\n');
  if (!normStr.includes(normOld)) {
    console.error('No se encontró el bloque a reemplazar');
    return null;
  }
  const isCRLF = str.includes('\r\n');
  const replaced = normStr.replace(normOld, newB.replace(/\r\n/g, '\n'));
  return isCRLF ? replaced.replace(/\n/g, '\r\n') : replaced;
}

const res1 = replaceBlock(appJs, oldAlertSection, newAlertSection);
if (res1) {
  appJs = res1;
  console.log('Sección de alertas reemplazada con éxito.');
} else {
  process.exit(1);
}

// 2. Inyectar alerta al crear proyecto en createNewProject
const oldProjCreate = `      logActivity(np.id, np.name, \`Creó el proyecto [Estado: \${status}]\`, localAuthor); 
      window.saveData(true);`;

const newProjCreate = `      logActivity(np.id, np.name, \`Creó el proyecto [Estado: \${status}]\`, localAuthor); 

      // Alerta a Google Chat de nuevo proyecto
      const modName = loc === 'DIRECT' ? 'Proyectos Directos' : ((appData.modules.find(m => m.id === loc) || {}).name || 'Módulo');
      window.sendExternalAlert('PROJECT_CREATED', {
        project: np.name,
        module: modName,
        consultants: selectedCons.join(', ') || 'Sin asignar',
        deadline: deadline || 'Sin fecha',
        author: localAuthor
      });

      window.saveData(true);`;

const res2 = replaceBlock(appJs, oldProjCreate, newProjCreate);
if (res2) {
  appJs = res2;
  console.log('Alerta de nuevo proyecto inyectada con éxito.');
} else {
  process.exit(1);
}

// 3. Inyectar alertas en submitTaskFeedback (validación enviada y tarea validada)
const oldSubmitFeedback = `                if (isSuper) {
                    t.validatedDate = dateStr; t.validatedTime = timeStr; t.validatedBy = localAuthor;
                    const timeTrace = t.assignDate ? \` [Asignada: \${t.assignDate} \${t.assignTime||''} ➔ Validada: \${dateStr} \${timeStr}]\` : '';
                    logActivity('global', 'General', \`Validó tarea general de \${t.assignee||'consultor'}: "\${t.text}"\${timeTrace}\`, localAuthor);
                } else {
                    t.submittedDate = dateStr; t.submittedTime = timeStr; t.submittedBy = localAuthor;
                    logActivity('global', 'General', \`Envió tarea a validación: "\${t.text}" (Evidencia: "\${feedback}")\`, localAuthor);
                }`;

const newSubmitFeedback = `                if (isSuper) {
                    t.validatedDate = dateStr; t.validatedTime = timeStr; t.validatedBy = localAuthor;
                    const timeTrace = t.assignDate ? \` [Asignada: \${t.assignDate} \${t.assignTime||''} ➔ Validada: \${dateStr} \${timeStr}]\` : '';
                    logActivity('global', 'General', \`Validó tarea general de \${t.assignee||'consultor'}: "\${t.text}"\${timeTrace}\`, localAuthor);
                    window.sendExternalAlert('TASK_VALIDATED', { project: 'General', task: t.text, validatedBy: localAuthor, consultant: t.assignee || 'Consultor' });
                } else {
                    t.submittedDate = dateStr; t.submittedTime = timeStr; t.submittedBy = localAuthor;
                    logActivity('global', 'General', \`Envió tarea a validación: "\${t.text}" (Evidencia: "\${feedback}")\`, localAuthor);
                    window.sendExternalAlert('VALIDATION_SUBMITTED', { project: 'General', task: t.text, feedback: feedback, consultant: localAuthor });
                }`;

const res3 = replaceBlock(appJs, oldSubmitFeedback, newSubmitFeedback);
if (res3) {
  appJs = res3;
  console.log('Alerta en submitTaskFeedback (global) inyectada.');
}

fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('app.js guardado con todas las mejoras de Google Chat.');

// 4. Inyectar botón de Resumen en index.html
const indexHtmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

const oldBackupTarget = `<div id="backupControls" class="supremo-only hidden space-y-3">`;
const newBackupTarget = `<div id="backupControls" class="supremo-only hidden space-y-3">
            <button onclick="triggerChatMorningDigest()" class="pill-btn w-full py-2.5 px-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition shadow-inner flex items-center justify-center gap-2 mb-2" title="Publicar el resumen de riesgos y proyectos atrasados en Google Chat">
              🌅 Publicar Resumen de Riesgos en Chat
            </button>`;

const resHtml = replaceBlock(html, oldBackupTarget, newBackupTarget);
if (resHtml) {
  fs.writeFileSync(indexHtmlPath, resHtml, 'utf8');
  console.log('Botón de Resumen en index.html inyectado con éxito.');
} else {
  console.warn('No se encontró el bloque en index.html');
}
