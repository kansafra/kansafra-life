'use client';
import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('sanad_install_dismissed') === '1') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function install() {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') setShow(false);
      setDeferred(null);
    });
  }

  function dismiss() {
    localStorage.setItem('sanad_install_dismissed', '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="install-prompt">
      <button className="install-close" onClick={dismiss} type="button">✕</button>
      <div className="install-icon">📱</div>
      <div className="install-body">
        <div className="install-title">ثبّت سند</div>
        <div className="install-text">أضف التطبيق لشاشتك الرئيسية</div>
      </div>
      <button className="install-btn" onClick={install} type="button">تثبيت</button>
    </div>
  );
}
