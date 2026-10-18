'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
      <div style={{ maxWidth: 400 }}>
        <div style={{ fontSize: 100, marginBottom: 20 }}>⚠️</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>حدث خطأ ما</h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 32 }}>
          نعتذر عن هذا العطل المؤقت. يمكنك المحاولة مرة أخرى أو العودة للرئيسية.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => reset()} style={{ padding: '14px 24px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            🔄 حاول مرة أخرى
          </button>
          <Link href="/" style={{ padding: '14px 24px', background: '#fff', color: '#334155', border: '1px solid #e5e7eb', borderRadius: 12, textDecoration: 'none', fontWeight: 900, fontSize: 14 }}>
            🏠 الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
