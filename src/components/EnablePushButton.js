'use client';
import { useState, useEffect } from 'react';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export default function EnablePushButton() {
  const [state, setState] = useState('checking');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') { setState('denied'); return; }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setState(sub ? 'subscribed' : 'idle');
  }

  async function subscribe() {
    setLoading(true);
    try {
      let user = null;
      try {
        const cust = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
        const ent = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
        if (cust?.id) user = { type: 'customer', id: cust.id };
        else if (ent?.id) user = { type: 'entity', id: ent.id };
      } catch {}

      if (!user) {
        alert('يرجى تسجيل الدخول أولاً');
        setLoading(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        setLoading(false);
        return;
      }

      const { publicKey } = await fetch('/api/push/key').then(r => r.json());
      if (!publicKey) {
        alert('إعدادات الإشعارات غير مكتملة على السيرفر');
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type: user.type,
          user_id: user.id,
          subscription,
          user_agent: navigator.userAgent.slice(0, 200),
        }),
      });

      if (!res.ok) throw new Error('فشل الحفظ');
      setState('subscribed');
    } catch (err) {
      console.error(err);
      alert('فشل تفعيل الإشعارات: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_type: 'x', user_id: '00000000-0000-0000-0000-000000000000', subscription: { endpoint: sub.endpoint }, user_agent: 'unsub' }),
        });
      }
      setState('idle');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (state === 'unsupported') return null;

  if (state === 'subscribed') {
    return (
      <button onClick={unsubscribe} disabled={loading} style={{ width: '100%', padding: 12, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
        {loading ? '⏳' : '✅ الإشعارات مفعّلة — إيقاف'}
      </button>
    );
  }

  if (state === 'denied') {
    return (
      <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 12, color: '#ef4444', textAlign: 'center', fontWeight: 800 }}>
        ❌ الإشعارات محظورة — افتح إعدادات المتصفح للسماح
      </div>
    );
  }

  return (
    <button onClick={subscribe} disabled={loading} style={{ width: '100%', padding: 14, background: loading ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 900, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
      {loading ? '⏳ جارٍ التفعيل...' : '🔔 تفعيل الإشعارات الفورية'}
    </button>
  );
}
