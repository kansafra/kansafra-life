'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

export default function OfflinePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(160deg, #05402d, #0a6b50)', color: '#fff', textAlign: 'center', padding: 24 }}>
      <div>
        <div style={{ fontSize: 80, marginBottom: 20 }}>📡</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 10px' }}>لا يوجد اتصال بالإنترنت</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', margin: '0 0 24px', lineHeight: 1.7 }}>
          يمكنك تصفح الصفحات المخزنة سابقاً.
          <br />سيتم تحديث البيانات عند عودة الاتصال.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          style={{ padding: '14px 28px', borderRadius: 14, background: 'linear-gradient(135deg, #f2cc55, #e8b923)', color: '#05402d', fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer' }}
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}
