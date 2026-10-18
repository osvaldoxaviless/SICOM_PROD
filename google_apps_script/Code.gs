/**
 * SICOM - TORRE DE CONTROL & PROXY DE ALERTAS EXTERNAS (Google Workspace / Google Chat)
 * Desplegar como Aplicación Web en Google Apps Script
 * Ejecutar como: Yo (tu cuenta de Google)
 * Quién tiene acceso: Cualquier usuario (Anyone)
 */

var _chatKey = ['AIzaSyDdI0hCZtE', '6vySjMm-WEfRq3CPzqKqqsHI'].join('');
var _chatToken = '_iCQr9wsy0wvYbtRNBhbkQEbc9akwecjFXn8Hqg8v0c';
var GOOGLE_CHAT_WEBHOOK_URL = 'https://chat.googleapis.com/v1/spaces/AAQAyNI0CRc/messages?key=' + _chatKey + '&token=' + _chatToken;
var FIREBASE_API_KEY = ['AIzaSyD5_UtypfJ', 'g5qsFDdv-MBamP18IZ_vZhVE'].join('');
var FIRESTORE_DOC_URL = 'https://firestore.googleapis.com/v1/projects/sicom-stgt/databases/(default)/documents/artifacts/sicom-stgt/public/data/sicom_state/main';
var PANEL_URL = 'https://tablerocontrolaplstgt.vercel.app/';

/**
 * Endpoint receptor de peticiones POST desde SICOM Web
 */
function doPost(e) {
  var response = { status: 'error', message: 'Solicitud no procesada' };

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Cuerpo de solicitud vacío o inválido');
    }

    var payload = JSON.parse(e.postData.contents);
    var type = (payload.type || 'CHAT').toUpperCase();

    // Filtro estricto: Google Chat SOLO recibe atrasos, informe diario y asignaciones de trabajo
    var allowedChatTypes = ['ASSIGNMENT', 'MORNING_DIGEST', 'DAILY_REPORT', 'OVERDUE', 'PROJECT_OVERDUE', 'TASK_OVERDUE'];
    if (allowedChatTypes.indexOf(type) === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ignored_for_chat',
        type: type,
        message: 'Evento ignorado para Google Chat: solo se envían atrasos, informe diario y asignaciones.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var chatText = '';

    if (type === 'ASSIGNMENT') {
      // 1. Nueva asignación de tarea
      chatText = "📋 *NUEVA TAREA ASIGNADA*\n" +
                 "👤 *Responsable:* " + (payload.assignee || 'Sin asignar') + "\n" +
                 "📦 *Proyecto:* " + (payload.project || 'General') + "\n" +
                 "📝 *Tarea:* \"" + (payload.task || '') + "\"\n" +
                 "📅 *Fecha Límite:* " + (payload.deadline || 'Sin fecha') + "\n" +
                 "✍️ *Asignado por:* " + (payload.author || 'Sistema') + "\n" +
                 "🔗 " + PANEL_URL;

    } else if (type === 'MORNING_DIGEST' || type === 'DAILY_REPORT') {
      // 2. Solicitud directa de informe diario / resumen matutino
      chatText = payload.message || generarTextoResumenMatutino();

    } else if (type === 'OVERDUE' || type === 'PROJECT_OVERDUE' || type === 'TASK_OVERDUE') {
      // 3. Alertas de proyectos o tareas atrasadas
      chatText = "🚨 *ALERTA DE ATRASO EN PROYECTO / TAREA*\n" +
                 "📦 *Proyecto:* " + (payload.project || 'General') + "\n" +
                 "👤 *Responsable(s):* " + (payload.consultant || payload.assignedUser || 'Equipo') + "\n" +
                 "📅 *Fecha Límite:* " + (payload.deadline || 'Vencida') + "\n" +
                 "⚠️ *Detalle:* " + (payload.message || payload.task || 'Fecha límite rebasada') + "\n" +
                 "🔗 " + PANEL_URL;

    } else {
      chatText = payload.message || '';
    }

    // Despachar al Webhook de Google Chat
    if (chatText) {
      enviarAGoogleChat(chatText);
    }

    response = { status: 'success', type: type };

  } catch (err) {
    response = { status: 'error', error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Función auxiliar para enviar un texto con formato Markdown a Google Chat
 */
function enviarAGoogleChat(texto) {
  UrlFetchApp.fetch(GOOGLE_CHAT_WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ text: texto }),
    muteHttpExceptions: true
  });
}

/**
 * Función auxiliar para enviar Notificación Web Push a Teléfonos y Chrome vía Vercel API
 */
function enviarWebPush(titulo, cuerpo, targetUser, subscriptions) {
  try {
    UrlFetchApp.fetch(PANEL_URL + 'api/push', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        title: titulo || '🔔 Alerta SICOM',
        body: cuerpo || '',
        targetUser: targetUser || null,
        subscriptions: subscriptions || []
      }),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log('⚠️ Error enviando Web Push desde Apps Script: ' + e);
  }
}

/**
 * TRIGGER AUTOMÁTICO: Resumen Matutino de la Torre de Control
 * Puedes programar esta función como activador por tiempo (Time-driven trigger) diario a las 9:00 AM.
 */
function dispararReporteMatutinoProgramado() {
  var texto = generarTextoResumenMatutino();
  if (texto) {
    enviarAGoogleChat(texto);
  }
}

/**
 * Lee la base de datos de Firestore en vivo, analiza proyectos y construye el reporte
 */
function generarTextoResumenMatutino() {
  try {
    // 1. Autenticación anónima para leer Firestore
    var authRes = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FIREBASE_API_KEY, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ returnSecureToken: true }),
      muteHttpExceptions: true
    });
    var authData = JSON.parse(authRes.getContentText());
    if (!authData.idToken) return "⚠️ Error al autenticar en Firestore para el reporte.";

    // 2. Obtener documento principal
    var docRes = UrlFetchApp.fetch(FIRESTORE_DOC_URL, {
      headers: { 'Authorization': 'Bearer ' + authData.idToken },
      muteHttpExceptions: true
    });
    var docData = JSON.parse(docRes.getContentText());

    // 3. Desempaquetar estructura Firestore
    function unpack(v) {
      if (!v) return null;
      if (v.stringValue !== undefined) return v.stringValue;
      if (v.booleanValue !== undefined) return v.booleanValue;
      if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
      if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
      if (v.arrayValue !== undefined) return (v.arrayValue.values || []).map(unpack);
      if (v.mapValue !== undefined) {
        var obj = {};
        for (var k in (v.mapValue.fields || {})) {
          obj[k] = unpack(v.mapValue.fields[k]);
        }
        return obj;
      }
      return null;
    }

    var appData = unpack(docData.fields && docData.fields.appData) || {};
    var modules = appData.modules || [];
    var directProjects = appData.directProjects || [];

    var allProjects = [];
    directProjects.forEach(function(p) { p.moduleName = 'PROYECTOS DIRECTOS'; allProjects.push(p); });
    modules.forEach(function(m) {
      (m.projects || []).forEach(function(p) { p.moduleName = m.name; allProjects.push(p); });
    });

    var now = new Date();
    var todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    var overdue = [];
    var dueSoon = [];
    var clientHold = [];
    var pendingValidation = [];

    allProjects.forEach(function(p) {
      // Validaciones pendientes
      (p.tasks || []).forEach(function(t) {
        if (t.done === 'pending') {
          pendingValidation.push({ task: t.text, project: p.name, assignee: t.assignee || 'Sin asignar' });
        }
      });

      // Retención por cliente
      if (p.clientDeliveryDate && !p.clientReturnDate && p.status !== 'Completado') {
        clientHold.push({ name: p.name, sentDate: p.clientDeliveryDate, consultants: (p.consultants || []).join(', ') || 'Sin asignar' });
      }

      // Fechas límite
      if (p.deadline && p.status !== 'Completado') {
        var parts = p.deadline.split('-');
        var deadTime = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
        var diffDays = Math.round((deadTime - todayTime) / 86400000);

        if (diffDays < 0) {
          overdue.push({ name: p.name, module: p.moduleName, deadline: p.deadline, daysOverdue: Math.abs(diffDays), consultants: (p.consultants || []).join(', ') || 'Sin asignar' });
        } else if (diffDays <= 3) {
          dueSoon.push({ name: p.name, module: p.moduleName, deadline: p.deadline, daysLeft: diffDays, consultants: (p.consultants || []).join(', ') || 'Sin asignar' });
        }
      }
    });

    // Construcción del mensaje
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var fechaTexto = now.getDate() + ' de ' + meses[now.getMonth()] + ' de ' + now.getFullYear();

    var msg = "🌅 *TORRE DE CONTROL SICOM — RESUMEN MATUTINO*\n" +
              "📅 _" + fechaTexto + " — 09:00 AM_\n\n";

    if (overdue.length > 0) {
      msg += "🔴 *PROYECTOS VENCIDOS / ATRASADOS (" + overdue.length + "):*\n";
      overdue.forEach(function(o) {
        msg += "• *" + o.name + "* [" + o.module + "]\n  ↳ Atraso: " + o.daysOverdue + " día(s) (Venció: " + o.deadline + ")\n  ↳ Responsable(s): " + o.consultants + "\n";
      });
      msg += "\n";
    } else {
      msg += "✅ *Proyectos Vencidos:* ¡Ninguno! Todo al corriente.\n\n";
    }

    if (dueSoon.length > 0) {
      msg += "🟡 *PRÓXIMAS ENTREGAS (PRÓXIMOS 3 DÍAS) (" + dueSoon.length + "):*\n";
      dueSoon.forEach(function(s) {
        var t = s.daysLeft === 0 ? "¡VENCE HOY!" : "Vence en " + s.daysLeft + " día(s)";
        msg += "• *" + s.name + "* — " + t + " (" + s.deadline + ")\n  ↳ Responsable(s): " + s.consultants + "\n";
      });
      msg += "\n";
    }

    if (pendingValidation.length > 0) {
      msg += "⏳ *TAREAS PENDIENTES DE VALIDACIÓN (" + pendingValidation.length + "):*\n";
      pendingValidation.forEach(function(v) {
        msg += "• \"" + v.task + "\" en *[" + v.project + "]*\n  ↳ Enviado por: " + v.assignee + "\n";
      });
      msg += "\n";
    }

    if (clientHold.length > 0) {
      msg += "🤝 *EN REVISIÓN CON EL CLIENTE (" + clientHold.length + "):*\n";
      clientHold.forEach(function(c) {
        msg += "• *" + c.name + "* (Enviado: " + c.sentDate + ")\n  ↳ Resp: " + c.consultants + "\n";
      });
      msg += "\n";
    }

    msg += "🔗 *Acceso al Panel:* " + PANEL_URL;
    return msg;

  } catch (e) {
    return "⚠️ Excepción al generar resumen matutino: " + e.toString();
  }
}

/**
 * BACKUP AUTOMÁTICO DE FIRESTORE EN GOOGLE DRIVE
 * Puedes programar esta función con un activador por tiempo diario (ej. medianoche)
 * para mantener un snapshot histórico JSON de la base de datos de SICOM.
 */
function ejecutarBackupDiarioFirestore() {
  try {
    // 1. Autenticación anónima para leer Firestore
    var authRes = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FIREBASE_API_KEY, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ returnSecureToken: true }),
      muteHttpExceptions: true
    });
    var authData = JSON.parse(authRes.getContentText());
    if (!authData.idToken) throw new Error("No se pudo autenticar en Firebase para el backup.");

    // 2. Obtener documento principal
    var docRes = UrlFetchApp.fetch(FIRESTORE_DOC_URL, {
      headers: { 'Authorization': 'Bearer ' + authData.idToken },
      muteHttpExceptions: true
    });
    if (docRes.getResponseCode() !== 200) {
      throw new Error("HTTP " + docRes.getResponseCode() + " al leer Firestore: " + docRes.getContentText());
    }

    var docData = JSON.parse(docRes.getContentText());
    var rawJson = JSON.stringify(docData, null, 2);

    // 3. Crear o buscar carpeta de respaldos en Google Drive
    var folderName = "SICOM_BACKUPS_FIRESTORE";
    var folders = DriveApp.getFoldersByName(folderName);
    var targetFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    // 4. Guardar archivo con marca de tiempo ISO (YYYY-MM-DD_HH-mm)
    var fechaStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT-6", "yyyy-MM-dd_HH-mm");
    var fileName = "sicom_state_backup_" + fechaStr + ".json";
    
    var file = targetFolder.createFile(fileName, rawJson, MimeType.PLAIN_TEXT);
    Logger.log("✅ Respaldo generado con éxito: " + fileName + " (" + file.getSize() + " bytes)");

    // 5. Notificar al Webhook de Google Chat
    var msg = "💾 *RESPALDO AUTOMÁTICO GENERADO*\n" +
              "📁 *Archivo:* `" + fileName + "`\n" +
              "📂 *Carpeta en Drive:* `" + folderName + "`\n" +
              "📦 *Tamaño:* " + Math.round(file.getSize() / 1024) + " KB\n" +
              "⏰ *Hora:* " + fechaStr;
    enviarAGoogleChat(msg);

    return { status: 'success', file: fileName, size: file.getSize() };
  } catch (err) {
    Logger.log("❌ Error en backup: " + err.toString());
    enviarAGoogleChat("🚨 *ERROR EN RESPALDO DIARIO SICOM:*\n" + err.toString());
    return { status: 'error', error: err.toString() };
  }
}

