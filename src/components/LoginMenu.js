'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function LoginMenu() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // إخفاء في صفحات لوحات التحكم والصفحات الخاصة
    const hidePaths = ['/merchant', '/admin', '/login', '/register', '/forgot-password', '/checkout', '/cart', '/customer', '/notifications', '/product', '/store'];
    const shouldHide = hidePaths.some(p => pathname.startsWith(p));
    setVisible(!shouldHide);

    // التحقق من تسجيل الدخول
    try {
      const c = localStorage.getItem('sanad_customer');
      const e = localStorage.getItem('sanad_entity');
      const a = localStorage.getItem('sanad_admin');
      setLoggedIn(!!(c || e || a));
    } catch {}
  }, [pathname]);

  if (!visible) return null;

  return (
    <>
      {/* زر عائم */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 9997,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: loggedIn ? '#10b981' : '#0f4d3a',
          color: '#fff',
          border: '2px solid rgba(255,255,255,0.3)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={loggedIn ? 'حسابي' : 'تسجيل الدخول'}
      >
        {loggedIn ? '👤' : '🔑'}
      </button>

      {/* نافذة الخيارات */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: 500,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: '#0f172a' }}>🔐 اختر نوع الدخول</h2>
              <button onClick={() => setOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>

            <LoginOption
              href="/login"
              icon="🛒"
              title="دخول الزبائن"
              desc="تسوق، تتبع طلباتك، حسابك الشخصي"
              color="#0ea5e9"
            />

            <LoginOption
              href="/merchant/login"
              icon="🏪"
              title="دخول المزودين"
              desc="الملاك والموظفون — كلاهما يدخل من هنا"
              color="#10b981"
            />

            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: 10, marginTop: 4, marginBottom: 10 }}>
              <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 800, lineHeight: 1.5 }}>
                💡 <strong>الموظفون:</strong> اطلب من صاحب المتجر اسم المستخدم وكلمة المرور، ثم ادخل من "دخول المزودين".
              </div>
            </div>
            <LoginOption
              href="/admin/login"
              icon="🛡️"
              title="دخول الإدارة"
              desc="فقط للمشرفين على المنصة"
              color="#8b5cf6"
              small
            />

            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
              ليس لديك حساب؟{' '}
              <Link href="/register" style={{ color: '#0ea5e9', fontWeight: 900, textDecoration: 'none' }} onClick={() => setOpen(false)}>
                سجّل الآن كمزود
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LoginOption({ href, icon, title, desc, color, small }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: small ? 12 : 16,
        background: small ? '#f8fafc' : `${color}08`,
        border: small ? '1px solid #e2e8f0' : `1px solid ${color}40`,
        borderRadius: 14,
        marginBottom: 10,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{
        width: small ? 36 : 48,
        height: small ? 36 : 48,
        borderRadius: small ? 10 : 12,
        background: `${color}15`,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: small ? 18 : 24,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: small ? 13 : 15, fontWeight: 900, color: '#0f172a', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: small ? 10 : 11, color: '#64748b', lineHeight: 1.4 }}>{desc}</div>
      </div>
      <div style={{ color: '#94a3b8', fontSize: 18 }}>←</div>
    </Link>
  );
}
