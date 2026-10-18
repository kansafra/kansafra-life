'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
      <div style={{ maxWidth: 400 }}>
        <div style={{ fontSize: 100, marginBottom: 20 }}>🔍</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>404</h1>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#334155', marginBottom: 12 }}>الصفحة غير موجودة</h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 32 }}>
          عذراً، الصفحة التي تبحث عنها قد تكون حُذفت أو تم تغيير رابطها.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Link href="/" style={{ padding: '14px 24px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 900, fontSize: 14, boxShadow: '0 4px 12px rgba(16,185,129,.3)' }}>
            🏠 الرئيسية
          </Link>
          <Link href="/search" style={{ padding: '14px 24px', background: '#fff', color: '#334155', border: '1px solid #e5e7eb', borderRadius: 12, textDecoration: 'none', fontWeight: 900, fontSize: 14 }}>
            🔍 بحث
          </Link>
        </div>
      </div>
    </div>
  );
}
