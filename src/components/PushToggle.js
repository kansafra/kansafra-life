'use client';
import { useState, useEffect } from 'react';
import { getPushSubscriptionStatus, subscribeToPush, unsubscribeFromPush } from '@/lib/push';
import { useToast } from '@/components/Toast';

export default function PushToggle({ userInfo = {}, compact = false }) {
  const { success, error: tE } = useToast();
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushSubscriptionStatus().then(setStatus).catch(() => setStatus('unsupported'));
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      if (status === 'subscribed') {
        await unsubscribeFromPush();
        setStatus('available');
        success('تم إلغاء الإشعارات');
      } else {
        await subscribeToPush(userInfo);
        setStatus('subscribed');
        success('✅ تم تفعيل الإشعارات');
      }
    } catch (e) {
      tE(e.message);
    }
    setBusy(false);
  }

  if (status === 'loading') return null;
  if (status === 'unsupported') return null;

  if (compact) {
    return (
      <button onClick={toggle} disabled={busy} title={status === 'subscribed' ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات'} style={{ background: status === 'subscribed' ? 'rgba(16,185,129,.15)' : 'rgba(255,255,255,.1)', color: status === 'subscribed' ? '#10b981' : '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>
        {status === 'subscribed' ? '🔔' : '🔕'}
      </button>
    );
  }

  return (
    <button onClick={toggle} disabled={busy} style={{ width: '100%', padding: 14, background: status === 'subscribed' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
      {busy ? '...' : status === 'subscribed' ? '🔔 إيقاف الإشعارات' : '🔕 تفعيل الإشعارات'}
    </button>
  );
}
