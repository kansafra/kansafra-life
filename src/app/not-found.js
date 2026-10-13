'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #05402d 0%, #0a6b50 60%, #041f17 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center',
      maxWidth: '680px',
      margin: '0 auto',
    }}>
      <div style={{
        fontSize: 120,
        fontWeight: 900,
        letterSpacing: '-8px',
        background: 'linear-gradient(180deg, #fff 0%, #f2cc55 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1,
        filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.3))',
      }}>
        404
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '20px 0 12px', letterSpacing: '-.5px' }}>
        الصفحة غير موجودة
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', lineHeight: 1.7, maxWidth: 380, margin: '0 0 32px', fontWeight: 500 }}>
        الرابط الذي تحاول الوصول إليه غير متاح أو تم نقله.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/" style={{
          padding: '14px 28px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, #f2cc55, #e8b923)',
          color: '#05402d',
          fontSize: 15,
          fontWeight: 900,
          textDecoration: 'none',
          boxShadow: '0 12px 28px rgba(232,185,35,.35)',
        }}>
          → الرئيسية
        </Link>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '14px 28px',
            borderRadius: 14,
            background: 'rgba(255,255,255,.1)',
            border: '1px solid rgba(255,255,255,.2)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          → رجوع
        </button>
      </div>
    </div>
  );
}
