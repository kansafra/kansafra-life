'use client';
import Link from 'next/link';

export default function ComingSoon({ title, icon = '🚧', desc }) {
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
        width: 96, height: 96,
        borderRadius: 30,
        background: 'rgba(255,255,255,.1)',
        border: '1px solid rgba(255,255,255,.2)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 44,
        marginBottom: 24,
        backdropFilter: 'blur(12px)',
      }}>
        {icon}
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', margin: '0 0 12px' }}>
        {title}
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', lineHeight: 1.7, maxWidth: 380, margin: '0 0 32px', fontWeight: 500 }}>
        {desc || 'هذه الميزة قيد التطوير حالياً — ستكون متاحة قريباً بإذن الله.'}
      </p>
      <Link href="/" style={{
        padding: '14px 32px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, #f2cc55, #e8b923)',
        color: '#05402d',
        fontSize: 15,
        fontWeight: 900,
        textDecoration: 'none',
        boxShadow: '0 12px 28px rgba(232,185,35,.35)',
      }}>
        → العودة للرئيسية
      </Link>
    </div>
  );
}
