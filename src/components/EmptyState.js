'use client';
import Link from 'next/link';

export default function EmptyState({
  icon = '📭',
  title = 'لا توجد بيانات',
  description = '',
  actionLabel = null,
  actionHref = null,
  onAction = null,
  variant = 'default',
}) {
  const variants = {
    default: { bg: '#fff', border: '#e5e7eb', text: '#0f172a', sub: '#64748b' },
    dark: { bg: 'rgba(255,255,255,.04)', border: 'rgba(255,255,255,.1)', text: '#fff', sub: 'rgba(255,255,255,.6)' },
  };
  const v = variants[variant] || variants.default;

  return (
    <div
      style={{
        background: v.bg,
        border: `1px dashed ${v.border}`,
        borderRadius: 20,
        padding: '60px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.6 }}>{icon}</div>
      <h3 style={{ fontSize: 17, fontWeight: 900, color: v.text, marginBottom: 8 }}>{title}</h3>
      {description && (
        <p style={{ fontSize: 13.5, color: v.sub, lineHeight: 1.7, maxWidth: 320, margin: '0 auto 24px' }}>
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg,#10b981,#059669)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 900,
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(16,185,129,.3)',
          }}
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            background: 'linear-gradient(135deg,#10b981,#059669)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 900,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(16,185,129,.3)',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
