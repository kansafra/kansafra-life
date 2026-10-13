'use client';
import { useState, useEffect } from 'react';
import { t } from '@/lib/i18n';

export default function Trans({ k }) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const refresh = () => forceUpdate((x) => x + 1);
    window.addEventListener('sanad-lang-change', refresh);
    return () => window.removeEventListener('sanad-lang-change', refresh);
  }, []);

  return <>{t(k)}</>;
}
