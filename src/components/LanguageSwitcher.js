'use client';
import { useState, useEffect } from 'react';
import { getLang, setLang } from '@/lib/i18n';

export default function LanguageSwitcher({ variant = 'floating' }) {
  const [lang, setLocalLang] = useState('ar');

  useEffect(() => {
    setLocalLang(getLang());
    const refresh = () => setLocalLang(getLang());
    window.addEventListener('sanad-lang-change', refresh);
    return () => window.removeEventListener('sanad-lang-change', refresh);
  }, []);

  function toggle() {
    const next = lang === 'ar' ? 'en' : 'ar';
    setLang(next);
    setLocalLang(next);
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={toggle}
        type="button"
        aria-label="Change language"
        style={{
          minWidth: 42, height: 42, padding: '0 14px',
          borderRadius: '50px',
          background: 'rgba(255,255,255,.1)',
          border: '1px solid rgba(255,255,255,.2)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 900,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all .15s',
        }}
      >
        🌐 {lang === 'ar' ? 'EN' : 'ع'}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      type="button"
      aria-label="Change language"
      style={{
        position: 'fixed',
        bottom: 'calc(240px + env(safe-area-inset-bottom, 0px))',
        left: 18,
        width: 48, height: 48,
        borderRadius: '50%',
        background: '#fff',
        border: '1px solid var(--c-200)',
        boxShadow: '0 6px 16px rgba(8,18,15,.1)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 20,
        cursor: 'pointer',
        zIndex: 44,
      }}
    >
      {lang === 'ar' ? '🇬🇧' : '🇸🇾'}
    </button>
  );
}
