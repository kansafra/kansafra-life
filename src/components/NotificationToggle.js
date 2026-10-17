'use client';

import { useState, useEffect } from 'react';
import { subscribeToPush, unsubscribeFromPush, isSubscribed, isPushSupported } from '@/lib/push-subscriptions';

export default function NotificationToggle({ userKey, userType = 'entity' }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setSupported(isPushSupported());
    check();
  }, []);

  async function check() {
    try {
      const ok = await isSubscribed();
      setSubscribed(ok);
    } catch (e) {}
    setLoading(false);
  }

  async function toggle() {
    if (!userKey) { setMsg({ type: 'error', text: 'يجب تسجيل الدخول أولاً' }); return; }
    setBusy(true);
    setMsg(null);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
        setMsg({ type: 'success', text: '✅ تم إيقاف الإشعارات' });
      } else {
        await subscribeToPush({ userKey, userType });
        setSubscribed(true);
        setMsg({ type: 'success', text: '🎉 تم تفعيل الإشعارات!' });
      }
    } catch (e) {
      setMsg({ type: 'error', text: '⚠️ ' + (e.message || 'تعذّر') });
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  if (loading) return null;
  if (!supported) {
    return (
      <div style={{ padding: 12, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 12, fontSize: 12, color: '#f59e0b', textAlign: 'center' }}>
        ⚠️ متصفحك لا يدعم الإشعارات
      </div>
    );
  }

  return (
    <div style={{ padding: 16, background: subscribed ? 'rgba(34,197,94,.08)' : 'rgba(14,165,233,.08)', border: subscribed ? '1.5px solid rgba(34,197,94,.3)' : '1.5px solid rgba(14,165,233,.3)', borderRadius: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 32 }}>{subscribed ? '🔔' : '🔕'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink-800)' }}>
            {subscribed ? 'الإشعارات مُفعّلة' : 'تفعيل الإشعارات'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 3, lineHeight: 1.6 }}>
            {subscribed
              ? 'ستصلك تنبيهات الطلبات والرسائل والديون'
              : 'احصل على تنبيهات فورية حتى لو التطبيق مغلق'}
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          type="button"
          style={{
            padding: '10px 16px',
            background: subscribed ? '#dc2626' : 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 900,
            cursor: busy ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {busy ? '...' : subscribed ? 'إيقاف' : 'تفعيل'}
        </button>
      </div>

      {msg && (
        <div style={{
          marginTop: 10,
          padding: 10,
          background: msg.type === 'success' ? 'rgba(34,197,94,.15)' : 'rgba(220,38,38,.15)',
          borderRadius: 10,
          fontSize: 12,
          color: msg.type === 'success' ? '#4ade80' : '#f87171',
          textAlign: 'center',
          fontWeight: 800,
        }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
