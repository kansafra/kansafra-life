'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  // ما نعرضها يوجد صفحة تسجيل الدخول
  if (!pathname || pathname === '/admin/login') return null;

  function logout() {
    if (!confirm('تسجيل الخروج من لوحة الإدارة؟')) return;
    try { localStorage.removeItem('sanad_admin'); } catch (e) {}
    router.push('/admin/login');
  }

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const items = [
    { href: '/', icon: '🏠', label: 'الرئيسية' },
    { href: '/admin', icon: '⚙️', label: 'اللوحة' },
    { href: '/merchant', icon: '💼', label: 'التاجر' },
  ];

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 9999,
      padding: '12px 16px',
      background: 'linear-gradient(135deg, #0f4d3a 0%, #0a6b50 50%, #0f4d3a 100%)',
      boxShadow: '0 4px 24px rgba(15,77,58,0.35)',
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      overflowX: 'auto',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginInlineEnd: 'auto' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
        }}>
          ⚙️
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>لوحة الإدارة</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 700, marginTop: 3 }}>سند</span>
        </div>
      </div>

      {/* Nav Items */}
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              padding: '8px 14px',
              borderRadius: 11,
              background: active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              border: active ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 900,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.3)' : 'none',
            }}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* Logout */}
      <button
        onClick={logout}
        type="button"
        style={{
          padding: '8px 14px',
          borderRadius: 11,
          background: 'rgba(220,38,38,0.25)',
          border: '1px solid rgba(220,38,38,0.5)',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 900,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 14 }}>🚪</span>
        <span>خروج</span>
      </button>
    </div>
  );
}
