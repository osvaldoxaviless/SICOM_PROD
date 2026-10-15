const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// 1. En saveGlobalTask
const oldGtAlert = `            // Inyección de alerta externa hacia Google Workspace (Google Chat)
            if (currentUserRole !== 'Lector') {
                window.sendExternalAlert('CHAT', \`Nueva tarea en [\${item.name}]: "\${text}" (Vence: \${deadline || 'Sin fecha'})\`, assignee);
            }`;

const newGtAlert = `            // Inyección de alerta externa hacia Google Workspace (Google Chat)
            if (currentUserRole !== 'Lector') {
                window.sendExternalAlert('ASSIGNMENT', {
                    project: item.name,
                    task: text,
                    deadline: deadline || 'Sin fecha',
                    assignee: assignee || 'Sin asignar',
                    author: localAuthor
                });
            }`;

// 2. En addQuickTask
const oldQtAlert = `            // Inyección de alerta externa hacia Google Workspace (Google Chat)
            if (currentUserRole !== 'Lector') {
                window.sendExternalAlert('CHAT', \`Nueva tarea rápida en [\${item.name}]: "\${text}"\`, assignee || 'Sin asignar');
            }`;

const newQtAlert = `            // Inyección de alerta externa hacia Google Workspace (Google Chat)
            if (currentUserRole !== 'Lector') {
                window.sendExternalAlert('ASSIGNMENT', {
                    project: item.name,
                    task: text,
                    deadline: deadline || 'Sin fecha',
                    assignee: assignee || 'Sin asignar',
                    author: localAuthor
                });
            }`;

// 3. En submitTaskFeedback (proyecto)
const oldProjFeedback = `                    if (isSuper) {
                        t.validatedDate = dateStr; t.validatedTime = timeStr; t.validatedBy = localAuthor;
                        const timeTrace = t.assignDate ? \` [Asignada: \${t.assignDate} \${t.assignTime||''} ➔ Validada: \${dateStr} \${timeStr}]\` : '';
                        logActivity(item.id, item.name, \`Validó tarea de \${t.assignee||'consultor'}: "\${t.text}"\${timeTrace}\`, localAuthor);
                    } else {
                        t.submittedDate = dateStr; t.submittedTime = timeStr; t.submittedBy = localAuthor;
                        logActivity(item.id, item.name, \`Envió tarea a validación: "\${t.text}" (Evidencia: "\${feedback}")\`, localAuthor);
                    }`;

const newProjFeedback = `                    if (isSuper) {
                        t.validatedDate = dateStr; t.validatedTime = timeStr; t.validatedBy = localAuthor;
                        const timeTrace = t.assignDate ? \` [Asignada: \${t.assignDate} \${t.assignTime||''} ➔ Validada: \${dateStr} \${timeStr}]\` : '';
                        logActivity(item.id, item.name, \`Validó tarea de \${t.assignee||'consultor'}: "\${t.text}"\${timeTrace}\`, localAuthor);
                        window.sendExternalAlert('TASK_VALIDATED', {
                            project: item.name,
                            task: t.text,
                            validatedBy: localAuthor,
                            consultant: t.assignee || 'Consultor'
                        });
                    } else {
                        t.submittedDate = dateStr; t.submittedTime = timeStr; t.submittedBy = localAuthor;
                        logActivity(item.id, item.name, \`Envió tarea a validación: "\${t.text}" (Evidencia: "\${feedback}")\`, localAuthor);
                        window.sendExternalAlert('VALIDATION_SUBMITTED', {
                            project: item.name,
                            task: t.text,
                            feedback: feedback,
                            consultant: localAuthor
                        });
                    }`;

// 4. En toggleQuickTask (aprobación directa)
const oldToggleQuickVal = `                        logActivity(item.id, item.name, \`Validó tarea de \${t.assignee||'consultor'}: "\${t.text}"\${timeTrace}\`, localAuthor); 
                        window.saveData(false);`;

const newToggleQuickVal = `                        logActivity(item.id, item.name, \`Validó tarea de \${t.assignee||'consultor'}: "\${t.text}"\${timeTrace}\`, localAuthor); 
                        window.sendExternalAlert('TASK_VALIDATED', {
                            project: item.name,
                            task: t.text,
                            validatedBy: localAuthor,
                            consultant: t.assignee || 'Consultor'
                        });
                        window.saveData(false);`;

function replaceSafe(str, oldS, newS) {
  const normOld = oldS.replace(/\r\n/g, '\n');
  const normStr = str.replace(/\r\n/g, '\n');
  if (!normStr.includes(normOld)) {
    console.error('No se encontró:', oldS.substring(0, 40));
    return null;
  }
  const isCRLF = str.includes('\r\n');
  const replaced = normStr.replace(normOld, newS.replace(/\r\n/g, '\n'));
  return isCRLF ? replaced.replace(/\n/g, '\r\n') : replaced;
}

appJs = replaceSafe(appJs, oldGtAlert, newGtAlert) || appJs;
appJs = replaceSafe(appJs, oldQtAlert, newQtAlert) || appJs;
appJs = replaceSafe(appJs, oldProjFeedback, newProjFeedback) || appJs;
appJs = replaceSafe(appJs, oldToggleQuickVal, newToggleQuickVal) || appJs;

fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('Todos los puntos de alerta actualizados en app.js.');
