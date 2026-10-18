'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomerHome() {
  const router = useRouter();
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      if (!c) router.replace('/login');
    } catch { router.replace('/login'); }
  }, [router]);

  const items = [
    { href: '/customer/orders', icon: '🛍️', label: 'طلباتي' },
    { href: '/customer/favorites', icon: '❤️', label: 'المفضلة' },
    { href: '/customer/debts', icon: '💰', label: 'ديوني' },
    { href: '/customer/addresses', icon: '📍', label: 'العناوين' },
    { href: '/customer/payments', icon: '💳', label: 'المدفوعات' },
    { href: '/customer/notifications', icon: '🔔', label: 'الإشعارات' },
    { href: '/my-appointments', icon: '📅', label: 'مواعيدي' },
    { href: '/customer/profile', icon: '👤', label: 'ملفي' },
    { href: '/customer/settings', icon: '⚙️', label: 'الإعدادات' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0f4d3a,#075640)', padding: '32px 20px 40px', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, color: '#fff' }}>
        <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>مرحباً بك</div>
        <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>حسابي</div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {items.map(it => (
            <Link key={it.href} href={it.href} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 28 }}>{it.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>{it.label}</div>
            </Link>
          ))}
        </div>
        <Link href="/" style={{ display: 'block', marginTop: 16, padding: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontWeight: 900, fontSize: 14 }}>
          🏠 العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
