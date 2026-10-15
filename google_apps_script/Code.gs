/**
 * SICOM - Middleware / Proxy para Alertas Externas (Google Workspace / Google Chat)
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
    var message = payload.message || '';
    var assignedUser = payload.assignedUser || 'Sin asignar';

    // Endpoint seguro del Webhook de Google Chat
    var GOOGLE_CHAT_WEBHOOK_URL = 'https://chat.googleapis.com/v1/spaces/AAQAyNI0CRc/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=_iCQr9wsy0wvYbtRNBhbkQEbc9akwecjFXn8Hqg8v0c'; 

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
    
    response = { status: 'success', channel: 'CHAT', assignedUser: assignedUser };

  } catch (err) {
    response = { status: 'error', error: err.toString() };
  }

  // Retorno con cabeceras compatibles
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
