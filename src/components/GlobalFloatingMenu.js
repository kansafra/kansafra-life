'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function GlobalFloatingMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dashboardPaths = ['/merchant', '/admin', '/doctor', '/school', '/mosque', '/club', '/entity', '/customer'];
    const isDashboard = dashboardPaths.some(p => pathname.startsWith(p));
    setVisible(isDashboard);
  }, [pathname]);

  function handleLogout() {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    localStorage.removeItem('sanad_customer');
    document.cookie = 'sanad_admin=; path=/; max-age=0';
    document.cookie = 'sanad_entity=; path=/; max-age=0';
    document.cookie = 'sanad_customer=; path=/; max-age=0';
    localStorage.removeItem('sanad_entity');
    localStorage.removeItem('sanad_admin');
    router.push('/');
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(100px + env(safe-area-inset-bottom))',
      left: 16,
      zIndex: 9996,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <Link href="/" style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'linear-gradient(135deg, #0f4d3a, #075640)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none', fontSize: 24,
        boxShadow: '0 6px 18px rgba(15,77,58,0.45)', border: '3px solid #fff',
      }} title="الرئيسية">🏠</Link>

      <button onClick={handleLogout} style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, boxShadow: '0 6px 18px rgba(239,68,68,0.45)',
        border: '3px solid #fff', cursor: 'pointer',
      }} title="تسجيل الخروج">🚪</button>
    </div>
  );
}
