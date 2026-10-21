import { supabase } from './supabase';

// تشغيل صوت بسيط
export function playSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [880, 1174.66, 1567.98];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.35);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch (e) {}
}

// إرسال إشعار (يستخدمه SubscriptionReminder)
export async function sendNotification(userType, userId, title, body, link = null, icon = '🔔') {
  if (!supabase || !userId) return { ok: false };
  try {
    await supabase.from('notifications').insert({
      user_type: userType, user_id: userId, title, body, link, icon, is_read: false,
    });
    return { ok: true };
  } catch (e) { return { ok: false }; }
}

async function triggerPush(userType, userId, title, body, link, icon) {
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_type: userType, user_id: userId, title, body, link, icon }),
    });
  } catch (e) {}
}

export async function notifyEntity(entityId, title, body, link = null, icon = '🔔') {
  if (!supabase || !entityId) return { ok: false };
  try {
    await supabase.from('notifications').insert({
      user_type: 'entity', user_id: entityId, title, body, link, icon, is_read: false,
    });
    triggerPush('entity', entityId, title, body, link, icon);
    return { ok: true };
  } catch (e) { return { ok: false }; }
}

export async function notifyCustomer(customerId, title, body, link = null, icon = '🔔') {
  if (!supabase || !customerId) return { ok: false };
  try {
    await supabase.from('notifications').insert({
      user_type: 'customer', user_id: customerId, title, body, link, icon, is_read: false,
    });
    triggerPush('customer', customerId, title, body, link, icon);
    return { ok: true };
  } catch (e) { return { ok: false }; }
}
