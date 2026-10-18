'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/', icon: '🏠', label: 'الرئيسية' },
  { href: '/categories', icon: '🎯', label: 'الأقسام' },
  { href: '/cart', icon: '🛒', label: 'السلة' },
  { href: '/exchange', icon: '💱', label: 'الحاسبة' },
  { href: '/customer', icon: '👤', label: 'حسابي' },
];

const HIDE_ON = ['/login', '/register', '/admin', '/merchant', '/employee'];

export default function GlobalBottomNav() {
  const pathname = usePathname() || '';
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      setUser(c);
    } catch {}
  }, [pathname]);

  // إخفاء في صفحات معينة
  if (HIDE_ON.some(p => pathname.startsWith(p))) return null;

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid #e5e7eb', display: 'flex', zIndex: 50, boxShadow: '0 -4px 20px rgba(0,0,0,.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV_ITEMS.map(n => {
        const isActive = pathname === n.href || (n.href !== '/' && pathname.startsWith(n.href));
        const href = n.href === '/customer' && !user ? '/login' : n.href;
        return (
          <Link key={n.href} href={href} style={{
            flex: 1, padding: '10px 4px 12px', textAlign: 'center', textDecoration: 'none',
            color: isActive ? '#0f4d3a' : '#94a3b8', fontSize: 10, fontWeight: 800,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            position: 'relative',
          }}>
            <div style={{ fontSize: 22, filter: isActive ? 'none' : 'grayscale(100%) opacity(.7)', transition: 'filter .2s' }}>{n.icon}</div>
            <div>{n.label}</div>
            {isActive && <div style={{ position: 'absolute', bottom: 4, width: 20, height: 3, background: '#0f4d3a', borderRadius: 2 }} />}
          </Link>
        );
      })}
    </div>
  );
}
