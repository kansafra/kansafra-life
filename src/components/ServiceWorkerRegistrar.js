'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (window.location.hostname === 'localhost') {
      // للتطوير، يمكن تفعيله يدوياً
    }
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (reg) => console.log('SW registered:', reg.scope),
        (err) => console.log('SW failed:', err)
      );
    });
  }, []);
  return null;
}
