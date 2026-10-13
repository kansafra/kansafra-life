'use client';
import { useState, useEffect } from 'react';
import { t, getLang } from './i18n';

export function useT() {
  const [, forceUpdate] = useState(0);
  const [lang, setLangState] = useState('ar');

  useEffect(() => {
    setLangState(getLang());
    const refresh = () => {
      forceUpdate((x) => x + 1);
      setLangState(getLang());
    };
    window.addEventListener('sanad-lang-change', refresh);
    return () => window.removeEventListener('sanad-lang-change', refresh);
  }, []);

  return { t, lang, isRTL: lang === 'ar' };
}
