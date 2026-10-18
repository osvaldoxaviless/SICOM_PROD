const webpush = require('web-push');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BDOt-t96XqxTDKOMj7k8mJPjPTLw0mN5_H6OQCVyfw-n-Yg6FUV06OIMtWE_norqt9QaNHj2qf4ziMDz8lyX0iE';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'JQQJJf6Jy-T-7B3DU1Vfwifd9SQxwXZDL0sgPcGcJEQ';
const VAPID_SUBJECT = 'mailto:soporte@sicom-stgt.app';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn('Error configurando VAPID:', e);
}

module.exports = async function handler(req, res) {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Endpoint GET para obtener la llave pública VAPID dinámicamente
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      publicKey: VAPID_PUBLIC_KEY
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { title, body: contentBody, icon, badge, url, tag, targetUser, subscriptions, singleSubscription } = body;

    if (!title && !contentBody) {
      return res.status(400).json({ error: 'Falta título o contenido para la notificación' });
    }

    const payload = JSON.stringify({
      title: title || '🔔 Alerta SICOM',
      body: contentBody || '',
      icon: icon || '/icon.svg',
      badge: badge || '/icon.svg',
      url: url || '/',
      tag: tag || 'sicom-alert'
    });

    let targetSubs = [];
    if (singleSubscription && singleSubscription.endpoint) {
      targetSubs = [{ subscription: singleSubscription }];
    } else if (Array.isArray(subscriptions)) {
      targetSubs = subscriptions;
    }

    // Filtrar por destinatario si se especificó (ej: un consultor en particular)
    if (targetUser && typeof targetUser === 'string' && targetUser.trim() && targetUser.toUpperCase() !== 'ALL' && targetUser.toUpperCase() !== 'GENERAL') {
      const cleanTarget = targetUser.trim().toLowerCase();
      targetSubs = targetSubs.filter(item => {
        if (!item) return false;
        const u = (item.user || '').trim().toLowerCase();
        return u === cleanTarget || u.includes(cleanTarget) || cleanTarget.includes(u);
      });
    }

    if (targetSubs.length === 0) {
      return res.status(200).json({
        success: true,
        sent: 0,
        message: 'No hay dispositivos suscritos para este destinatario.'
      });
    }

    const expiredEndpoints = [];
    let sentCount = 0;
    let failedCount = 0;

    await Promise.allSettled(
      targetSubs.map(async (item) => {
        const sub = item.subscription || item;
        if (!sub || !sub.endpoint) return;

        try {
          await webpush.sendNotification(sub, payload, {
            TTL: 86400
          });
          sentCount++;
        } catch (err) {
          failedCount++;
          if (err.statusCode === 404 || err.statusCode === 410) {
            expiredEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    return res.status(200).json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: targetSubs.length,
      expiredEndpoints: expiredEndpoints
    });

  } catch (err) {
    console.error('Error en /api/push:', err);
    return res.status(500).json({ error: err.toString() });
  }
};
