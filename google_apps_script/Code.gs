/**
 * SICOM - Middleware / Proxy para Alertas Externas (Google Chat & WhatsApp)
 * Desplegar como Aplicación Web en Google Apps Script
 * Ejecutar como: Yo
 * Quién tiene acceso: Cualquier usuario (Anyone)
 */
function doPost(e) {
  var response = { status: 'error', message: 'Solicitud no procesada' };
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Cuerpo de solicitud vacío o inválido');
    }

    var payload = JSON.parse(e.postData.contents);
    var type = (payload.type || '').toUpperCase();
    var message = payload.message || '';
    var assignedUser = payload.assignedUser || 'Sin asignar';

    // Endpoints seguros (Mocks configurables con Webhooks reales)
    var GOOGLE_CHAT_WEBHOOK_URL = 'https://chat.googleapis.com/v1/spaces/AAQAyNIOcRc/messages?key=AIzaSyDdIOhCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=_iCQr9wsy0wvYbtRNBhbkQEbc9akwecjFXn8Hqg8v0c'; 
    var MAKE_WHATSAPP_WEBHOOK_URL = 'https://hook.us2.make.com/6jpfncjern3z4mo5yd0b02gxfxfi2dkw';

    var sendChat = function() {
      var chatPayload = {
        text: "🔔 *NUEVA ALERTA SICOM*\n" +
              "👤 *Asignado a:* " + assignedUser + "\n" +
              "📋 *Detalle:* " + message
      };
      UrlFetchApp.fetch(GOOGLE_CHAT_WEBHOOK_URL, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(chatPayload),
        muteHttpExceptions: true
      });
    };

    var sendWhatsApp = function() {
      var waPayload = {
        assignedUser: assignedUser,
        message: message,
        timestamp: new Date().toISOString()
      };
      UrlFetchApp.fetch(MAKE_WHATSAPP_WEBHOOK_URL, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(waPayload),
        muteHttpExceptions: true
      });
    };

    switch (type) {
      case 'ALL':
        sendChat();
        sendWhatsApp();
        response = { status: 'success', channel: 'ALL', assignedUser: assignedUser };
        break;

      case 'CHAT':
        sendChat();
        response = { status: 'success', channel: 'CHAT', assignedUser: assignedUser };
        break;

      case 'WHATSAPP':
        sendWhatsApp();
        response = { status: 'success', channel: 'WHATSAPP', assignedUser: assignedUser };
        break;

      default:
        response = { status: 'ignored', message: 'Tipo de alerta no soportado: ' + type };
        break;
    }

  } catch (err) {
    response = { status: 'error', error: err.toString() };
  }

  // Retorno con cabeceras compatibles
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
