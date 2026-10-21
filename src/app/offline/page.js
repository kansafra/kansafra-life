'use client';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>📡</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>لا يوجد اتصال بالإنترنت</h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
          تحقق من اتصالك بالشبكة وأعد المحاولة. بعض الصفحات المحفوظة تعمل بدون إنترنت.
        </p>
        <button onClick={() => window.location.reload()} style={{ display: 'block', width: '100%', padding: 14, background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
          🔄 إعادة المحاولة
        </button>
        <Link href="/" style={{ display: 'block', width: '100%', padding: 14, background: '#fff', color: '#0f4d3a', border: '2px solid #0f4d3a', borderRadius: 12, fontSize: 14, fontWeight: 900, textDecoration: 'none', boxSizing: 'border-box' }}>
          ← الرئيسية
        </Link>
      </div>
    </div>
  );
}
