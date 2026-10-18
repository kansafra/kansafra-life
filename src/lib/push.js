'use client';

// تحويل VAPID public key إلى Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function getPushSubscriptionStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'denied') return 'denied';
  
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return 'unregistered';
  
  const sub = await reg.pushManager.getSubscription();
  return sub ? 'subscribed' : 'available';
}

export async function subscribeToPush(userInfo = {}) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('الإشعارات غير مدعومة في متصفحك');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('يجب السماح بالإشعارات');
  }

  const reg = await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
  await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  let sub = existing;

  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    });
  }

  // حفظ في قاعدة البيانات
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: sub.toJSON(),
      userInfo,
    }),
  });

  if (!res.ok) throw new Error('تعذّر حفظ الاشتراك');
  return sub;
}

export async function unsubscribeFromPush() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });

  await sub.unsubscribe();
}

// ═══════════════════════════════════════════════════════
// دوال متوافقة مع الكود القديم (legacy)
// ═══════════════════════════════════════════════════════

// طلب إذن الإشعارات
export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// إظهار إشعار محلي (بدون Push)
export function showLocalNotification(title, options = {}) {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      dir: 'rtl',
      lang: 'ar',
      ...options,
    });
  } catch (e) {
    console.warn('Local notification failed:', e);
  }
}
