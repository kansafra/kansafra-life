// ═══════════ إشعارات Push ═══════════
import { supabase } from './supabase';

export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'unsupported';
  }
}

export async function showLocalNotification(title, options = {}) {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const config = {
      body: options.body || '',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: options.tag || 'sanad-' + Date.now(),
      vibrate: [200, 100, 200],
      dir: 'rtl',
      lang: 'ar',
      ...options,
    };

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        reg.showNotification(title, config);
        return true;
      }
    }

    new Notification(title, config);
    return true;
  } catch (e) {
    console.error('Notification error:', e);
    return false;
  }
}

export async function notifyOrderSent(orderCode) {
  return showLocalNotification('✅ تم إرسال طلبك', {
    body: `رقم الطلب: ${orderCode}`,
    tag: 'order-' + orderCode,
  });
}

export async function notifyNewMessage(entityName) {
  return showLocalNotification('💬 رسالة جديدة', {
    body: `من ${entityName}`,
    tag: 'chat',
  });
}

export async function notifySOS() {
  return showLocalNotification('🚨 تم إرسال بلاغ الطوارئ', {
    body: 'سيتواصل معك الفريق المختص قريباً',
    tag: 'sos',
  });
}

export async function notifyAppointment(date, time) {
  return showLocalNotification('📅 تم حجز موعدك', {
    body: `${date} — ${time}`,
    tag: 'appointment',
  });
}
