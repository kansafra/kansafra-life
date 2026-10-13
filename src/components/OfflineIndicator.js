'use client';
import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(180px + env(safe-area-inset-bottom, 0px))',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 18px',
      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
      color: '#fff',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 900,
      boxShadow: '0 8px 24px rgba(245,158,11,.4)',
      zIndex: 47,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <span>📡</span>
      <span>وضع Offline — بيانات محفوظة</span>
    </div>
  );
}
