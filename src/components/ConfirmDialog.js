'use client';
import { useState } from 'react';

export default function ConfirmDialog({ 
  title = 'هل أنت متأكد؟',
  message = '',
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  type = 'danger',
  onConfirm,
  onCancel,
  children,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const colors = {
    danger: 'linear-gradient(135deg,#ef4444,#dc2626)',
    warning: 'linear-gradient(135deg,#f59e0b,#d97706)',
    primary: 'linear-gradient(135deg,#10b981,#059669)',
  };

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.6)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 24,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,.3)',
            }}
          >
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>
              {type === 'danger' ? '⚠️' : type === 'warning' ? '❗' : 'ℹ️'}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', textAlign: 'center', marginBottom: 8 }}>
              {title}
            </h3>
            {message && (
              <p style={{ fontSize: 13.5, color: '#64748b', textAlign: 'center', lineHeight: 1.7, marginBottom: 24 }}>
                {message}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setOpen(false); onCancel?.(); }}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: 14,
                  background: '#f1f5f9',
                  color: '#334155',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: 14,
                  background: colors[type] || colors.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {loading ? '...' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
