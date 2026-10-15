async function testRealDigest() {
  const webhook = 'https://chat.googleapis.com/v1/spaces/AAQAyNI0CRc/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=_iCQr9wsy0wvYbtRNBhbkQEbc9akwecjFXn8Hqg8v0c';

  const text = `🌅 *TORRE DE CONTROL SICOM — RESUMEN DE RIESGOS*
📅 _15 de octubre de 2026_

🔴 *PROYECTOS VENCIDOS / ATRASADOS (2):*
• *Implementación ATN* [CONTROLES VOLUMÉTRICOS]
  ↳ Atraso: 2 día(s) (Venció: 2026-10-13)
  ↳ Responsable(s): Mario Gómez, Roberto Soto
• *Versión Paytech* [FACTURACIÓN ELECTRÓNICA]
  ↳ Atraso: 1 día(s) (Venció: 2026-10-14)
  ↳ Responsable(s): Roberto Soto

🟡 *PRÓXIMAS ENTREGAS (PRÓXIMOS 3 DÍAS) (1):*
• *Migración Cloud AWS* [INFRAESTRUCTURA] — Vence en 2 día(s) (2026-10-17)
  ↳ Responsable(s): Ana Torres

⏳ *TAREAS PENDIENTES DE VALIDACIÓN (1):*
• "Pruebas de estrés y volumen" en *[Implementación ATN]*
  ↳ Enviado por: Mario Gómez

🔗 *Acceso al Panel:* https://panel-control-sicom.netlify.app/`;

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text })
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Message created:', data.name);
}
testRealDigest();
