'use client';
import { useState, useEffect } from 'react';
import { getLang, setLang } from '@/lib/i18n';

export default function LanguageSwitcher() {
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

  return (
    <button
      onClick={toggle}
      className="lang-switch"
      type="button"
      aria-label="Change language"
    >
      {lang === 'ar' ? '🇬🇧' : '🇸🇾'}
    </button>
  );
}
