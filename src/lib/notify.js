// ═══════════ Sanad Notifications Helper ═══════════
import { supabase } from './supabase';

export async function sendNotification({ recipient, title, body, type = 'info', targetUrl }) {
  if (!supabase) return { ok: false };
  const { error } = await supabase.from('notifications').insert({
    recipient_entity: recipient || null,
    title,
    body: body || null,
    type,
    target_url: targetUrl || null,
    is_read: false,
  });
  return { ok: !error };
}

export async function notifyNewOrder(providerName, orderCode, customerName) {
  return sendNotification({
    recipient: providerName,
    title: '🛍️ طلب جديد',
    body: `الطلب ${orderCode} من ${customerName}`,
    type: 'success',
    targetUrl: '/merchant/orders',
  });
}

export async function notifyNewReview(providerName, rating, reviewerName) {
  return sendNotification({
    recipient: providerName,
    title: `⭐ تقييم جديد: ${rating}/5`,
    body: `من ${reviewerName}`,
    type: 'info',
    targetUrl: '/merchant',
  });
}

export async function notifySOS(fullName, category) {
  return sendNotification({
    recipient: null,
    title: '🚨 بلاغ طوارئ جديد',
    body: `${fullName} — ${category}`,
    type: 'error',
    targetUrl: '/admin/sos',
  });
}
