'use client';
import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    // إذا كان مثبتاً مسبقاً، لا نعرض
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // إذا رفض سابقاً، لا نعرض
    if (localStorage.getItem('sanad_install_dismissed') === 'true') return;

    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
      localStorage.removeItem('sanad_install_dismissed');
    }
    setDeferred(null);
  }

  function dismiss() {
    setShow(false);
    localStorage.setItem('sanad_install_dismissed', 'true');
  }

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 16, right: 16, zIndex: 9999,
      background: 'linear-gradient(135deg, #0f4d3a, #075640)',
      borderRadius: 18, padding: 16, color: '#fff',
      boxShadow: '0 15px 40px rgba(15,77,58,0.5)',
      animation: 'slideInUp 0.4s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏘️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 900 }}>ثبّت تطبيق سند</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>وصول أسرع، إشعارات فورية</div>
        </div>
        <button onClick={dismiss} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 28, height: 28, borderRadius: '50%', color: '#fff', fontSize: 14, cursor: 'pointer' }}>✕</button>
      </div>
      <button onClick={install} style={{ width: '100%', padding: 12, background: '#fbbf24', color: '#0f4d3a', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
        📲 إضافة للشاشة الرئيسية
      </button>
      <style>{`@keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}
