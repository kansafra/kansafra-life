// ═══════════ مساعد الإشعارات ═══════════
import { supabase } from './supabase';
import { showLocalNotification } from './push';

// ═══ تشغيل صوت الإشعار ═══
export function playSound() {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {
      // لو المتصفح رفض، جرّب ogg
      const audio2 = new Audio('/sounds/notification.ogg');
      audio2.volume = 0.6;
      audio2.play().catch(() => {});
    });
  } catch {}
}

// ═══ إرسال إشعار (DB + صوت + إشعار نظام) ═══
export async function sendNotification({ recipient, title, body, type = 'info', targetUrl, playAudio = true }) {
  // 1) صوت
  if (playAudio) playSound();

  // 2) إشعار نظام (متصفح)
  try {
    await showLocalNotification(title, {
      body: body || '',
      tag: 'sanad-' + (type || 'info'),
    });
  } catch {}

  // 3) حفظ في DB
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

// ═══ الأحداث الجاهزة ═══

export async function notifyNewOrder(providerName, orderCode, customerName) {
  return sendNotification({
    recipient: providerName,
    title: '🛍️ طلب جديد',
    body: `الطلب ${orderCode} من ${customerName}`,
    type: 'success',
    targetUrl: '/merchant/orders',
  });
}

export async function notifyOrderStatus(customerPhone, orderCode, status) {
  const STATUS_MSG = {
    preparing:  { title: '👨‍🍳 طلبك قيد التحضير', body: `الطلب ${orderCode} بدأ التحضير` },
    delivering: { title: '🚚 طلبك في التوصيل', body: `الطلب ${orderCode} في الطريق إليك` },
    done:       { title: '✅ اكتمل طلبك', body: `يمكنك الآن عرض الفاتورة ${orderCode}` },
    cancelled:  { title: '❌ تم إلغاء الطلب', body: `الطلب ${orderCode} ملغي` },
  };
  const msg = STATUS_MSG[status] || { title: '📦 تحديث الطلب', body: orderCode };
  return sendNotification({
    recipient: customerPhone || null,
    title: msg.title,
    body: msg.body,
    type: status === 'cancelled' ? 'error' : 'success',
    targetUrl: `/order/${orderCode}`,
  });
}

export async function notifyNewReview(providerName, rating, reviewerName) {
  return sendNotification({
    recipient: providerName,
    title: `⭐ تقييم جديد: ${rating}/5`,
    body: `من ${reviewerName}`,
    type: 'info',
    targetUrl: '/merchant/reviews',
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

export async function notifyNewMessage(entityName, senderName) {
  return sendNotification({
    recipient: entityName,
    title: '💬 رسالة جديدة',
    body: `من ${senderName}`,
    type: 'info',
    targetUrl: '/merchant/chat',
  });
}

export async function notifyNewAnnouncement(title, entityName = null) {
  return sendNotification({
    recipient: entityName,
    title: '📢 إعلان جديد',
    body: title,
    type: 'info',
    targetUrl: '/',
  });
}
