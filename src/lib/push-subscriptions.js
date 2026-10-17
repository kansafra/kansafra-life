// ═══════════════════════════════════════════════
// Web Push Subscriptions — سند
// ═══════════════════════════════════════════════
import { supabase } from './supabase';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// ═══ تحويل base64 إلى Uint8Array ═══
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : '';
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ═══ هل المتصفح يدعم Push ═══
export function isPushSupported() {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// ═══ تسجيل Service Worker ═══
export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (e) {
    console.warn('SW register failed:', e);
    return null;
  }
}

// ═══ طلب الإذن من المستخدم ═══
export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

// ═══ تفعيل الاشتراك بالكامل ═══
export async function subscribeToPush({ userKey, userType = 'entity' }) {
  if (!isPushSupported()) throw new Error('المتصفح لا يدعم الإشعارات');
  if (!VAPID_PUBLIC) throw new Error('VAPID public key غير موجود');

  // 1) نطلب الإذن
  const perm = await requestPermission();
  if (perm !== 'granted') throw new Error('تم رفض الإذن');

  // 2) نسجّل SW
  const reg = await navigator.serviceWorker.ready;

  // 3) نعمل الاشتراك
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
  }

  // 4) نحفظه في DB
  const json = sub.toJSON();
  const payload = {
    user_key: userKey,
    user_type: userType,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh || '',
    auth: json.keys?.auth || '',
    device_info: navigator.userAgent?.slice(0, 200) || null,
    is_active: true,
    last_used: new Date().toISOString(),
  };

  if (supabase) {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(payload, { onConflict: 'endpoint' });
    if (error) console.warn('push upsert err:', error);
  }

  return sub;
}

// ═══ إلغاء الاشتراك ═══
export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      if (supabase) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('endpoint', endpoint);
      }
    }
  } catch (e) {
    console.warn('unsubscribe err:', e);
  }
}

// ═══ هل مشترك حالياً ═══
export async function isSubscribed() {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}
