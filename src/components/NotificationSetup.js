'use client';
import { useState, useEffect } from 'react';
import { requestNotificationPermission } from '@/lib/push';

export default function NotificationSetup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;
    if (localStorage.getItem('sanad_notif_dismissed') === '1') return;

    const timer = setTimeout(() => setShow(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  async function enable() {
    const result = await requestNotificationPermission();
    setShow(false);
    if (result === 'granted') {
      localStorage.setItem('sanad_notif_enabled', '1');
    }
  }

  function dismiss() {
    localStorage.setItem('sanad_notif_dismissed', '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(180px + env(safe-area-inset-bottom, 0px))',
      left: 18, right: 18,
      maxWidth: 420,
      margin: '0 auto',
      background: 'linear-gradient(135deg, var(--f-800), var(--f-600))',
      color: '#fff',
      borderRadius: 18,
      padding: 16,
      paddingTop: 22,
      boxShadow: '0 20px 44px rgba(5,64,45,.4)',
      zIndex: 46,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      animation: 'slide-up .4s var(--e-out)',
    }}>
      <button
        onClick={dismiss}
        type="button"
        style={{
          position: 'absolute',
          top: 8, right: 10,
          width: 24, height: 24,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.15)',
          border: 'none',
          color: '#fff',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >✕</button>
      <div style={{
        width: 44, height: 44,
        borderRadius: 12,
        background: 'rgba(255,255,255,.15)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 22,
        flexShrink: 0,
      }}>🔔</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 900, marginBottom: 2 }}>تفعيل الإشعارات</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>
          ليصلك تنبيه بالطلبات والمواعيد
        </div>
      </div>
      <button
        onClick={enable}
        type="button"
        style={{
          padding: '10px 16px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #f2cc55, #e8b923)',
          color: '#05402d',
          fontSize: 12,
          fontWeight: 900,
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >تفعيل</button>
    </div>
  );
}
