'use client';

import { useState, useEffect } from 'react';
import { registerCustomer, loginCustomer, saveGuestSession, getCustomer } from '@/lib/customerAuth';
import { GUEST_RESTRICTED } from '@/lib/permissions';

export default function CustomerAuthModal({ isOpen, onClose, onSuccess, defaultPhone = '', defaultName = '' }) {
  const [mode, setMode] = useState('choose'); // choose | login | register | guest
  const [form, setForm] = useState({
    full_name: defaultName,
    phone: defaultPhone,
    password: '',
    password2: '',
    email: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const c = getCustomer();
      setExisting(c);
      setForm((f) => ({ ...f, phone: defaultPhone || f.phone, full_name: defaultName || f.full_name }));
      setError('');
      setMode('choose');
    }
  }, [isOpen, defaultPhone, defaultName]);

  if (!isOpen) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    if (!form.phone.trim() || !form.password) {
      setError('الهاتف وكلمة المرور مطلوبان');
      return;
    }
    setLoading(true);
    try {
      const c = await loginCustomer({ phone: form.phone, password: form.password });
      onSuccess?.(c);
      onClose?.();
    } catch (err) {
      setError(err.message || 'تعذّر الدخول');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (!form.full_name.trim() || form.full_name.trim().length < 3) {
      setError('الاسم مطلوب (3 أحرف على الأقل)');
      return;
    }
    if (!form.phone.trim()) { setError('رقم الهاتف مطلوب'); return; }
    if (!form.password || form.password.length < 4) { setError('كلمة المرور 4 أحرف على الأقل'); return; }
    if (form.password !== form.password2) { setError('كلمتا المرور غير متطابقتين'); return; }
    setLoading(true);
    try {
      const c = await registerCustomer({
        full_name: form.full_name,
        phone: form.phone,
        password: form.password,
        email: form.email,
        address: form.address,
      });
      onSuccess?.(c);
      onClose?.();
    } catch (err) {
      setError(err.message || 'تعذّر التسجيل');
    } finally {
      setLoading(false);
    }
  }

  function handleGuest() {
    setError('');
    if (!form.full_name.trim() || form.full_name.trim().length < 3) {
      setError('الاسم مطلوب (3 أحرف على الأقل)');
      return;
    }
    if (!form.phone.trim() || form.phone.replace(/[^0-9]/g, '').length < 9) {
      setError('رقم الهاتف مطلوب');
      return;
    }
    const guest = saveGuestSession({
      full_name: form.full_name.trim(),
      phone: form.phone.replace(/[^0-9]/g, ''),
      address: form.address?.trim() || null,
    });
    onSuccess?.(guest);
    onClose?.();
  }

  return (
    <div className="mng-modal-bg" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="mng-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="mng-modal-handle" />
        
        {/* إذا يوجد جلسة موجودة */}
        {existing && mode === 'choose' && (
          <>
            <h3 className="mng-modal-title">مرحباً {existing.full_name}</h3>
            <div style={{ padding: 16, background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 12, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--n-500)', marginBottom: 4 }}>تسجيل دخولك</div>
              <div style={{ fontSize: 14, fontWeight: 900 }}>{existing.full_name}</div>
              <div style={{ fontSize: 12, color: 'var(--n-500)', marginTop: 4, direction: 'ltr' }}>{existing.phone}</div>
            </div>
            <button
              onClick={() => { onSuccess?.(existing); onClose?.(); }}
              type="button"
              style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: 'pointer', marginBottom: 8 }}
            >
              ✓ استمرار بهذا الحساب
            </button>
            <button
              onClick={() => setMode('login')}
              type="button"
              style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
            >
              🔄 تبديل الحساب
            </button>
          </>
        )}

        {/* اختيار */}
        {!existing && mode === 'choose' && (
          <>
            <h3 className="mng-modal-title">🎉 أهلاً بك</h3>
            <p style={{ fontSize: 13, color: 'var(--n-500)', textAlign: 'center', marginBottom: 20, lineHeight: 1.7 }}>
              سجّل دخولك أو تابع كضيف لإتمام العملية
            </p>

            <button
              onClick={() => setMode('register')}
              type="button"
              style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: 'pointer', marginBottom: 10 }}
            >
              ✨ حساب جديد (سريع)
            </button>

            <button
              onClick={() => setMode('login')}
              type="button"
              style={{ width: '100%', padding: 14, background: 'rgba(14,165,233,.15)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,.3)', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: 'pointer', marginBottom: 10 }}
            >
              🔐 لديّ حساب — تسجيل دخول
            </button>

            <button
              onClick={() => setMode('guest')}
              type="button"
              style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
            >
              👤 استمرار كضيف (بدون حساب)
            </button>
          </>
        )}

        {/* تسجيل جديد */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <h3 className="mng-modal-title">✨ حساب جديد</h3>

            <div className="new-service-field">
              <label className="new-service-label">الاسم الكامل *</label>
              <input className="new-service-input" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="الاسم الثلاثي" />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">📞 رقم الهاتف *</label>
              <input className="new-service-input" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="09XXXXXXXX" style={{ direction: 'ltr', textAlign: 'right' }} />
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">كلمة المرور *</label>
                <input className="new-service-input" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="4 أحرف+" />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">تأكيد *</label>
                <input className="new-service-input" type="password" value={form.password2} onChange={(e) => update('password2', e.target.value)} placeholder="أعد كلمة المرور" />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">📍 العنوان (اختياري)</label>
              <input className="new-service-input" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="الحي — البلدة" />
            </div>

            {error && <div style={{ padding: 12, background: 'rgba(220,38,38,.15)', borderRadius: 12, color: '#f87171', fontSize: 12.5, marginBottom: 12, textAlign: 'center' }}>⚠️ {error}</div>}

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setMode('choose')} type="button">→ رجوع</button>
              <button className="mng-btn primary" type="submit" disabled={loading}>
                {loading ? '... جارٍ' : '✓ إنشاء'}
              </button>
            </div>
          </form>
        )}

        {/* تسجيل دخول */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <h3 className="mng-modal-title">🔐 تسجيل الدخول</h3>

            <div className="new-service-field">
              <label className="new-service-label">📞 رقم الهاتف</label>
              <input className="new-service-input" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="09XXXXXXXX" style={{ direction: 'ltr', textAlign: 'right' }} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">كلمة المرور</label>
              <input className="new-service-input" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••" />
            </div>

            {error && <div style={{ padding: 12, background: 'rgba(220,38,38,.15)', borderRadius: 12, color: '#f87171', fontSize: 12.5, marginBottom: 12, textAlign: 'center' }}>⚠️ {error}</div>}

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setMode('choose')} type="button">→ رجوع</button>
              <button className="mng-btn primary" type="submit" disabled={loading}>
                {loading ? '... جارٍ' : '🔐 دخول'}
              </button>
            </div>
          </form>
        )}

        {/* ضيف */}
        {mode === 'guest' && (
          <form onSubmit={(e) => { e.preventDefault(); handleGuest(); }}>
            <h3 className="mng-modal-title">👤 استمرار كضيف</h3>
            <div style={{ padding: 12, background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.3)', borderRadius: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#fbbf24', marginBottom: 8 }}>
                🎯 صلاحيات الزائر:
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', lineHeight: 1.7 }}>
                ✅ تصفح كامل<br />
                ✅ شراء وحجز<br />
                ✅ تقييم<br />
                ⚠️ بدون سجل طلبات دائم<br />
                ⚠️ بدون نقاط ولاء
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الاسم الكامل *</label>
              <input className="new-service-input" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="الاسم الثلاثي" />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">📞 رقم الهاتف *</label>
              <input className="new-service-input" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="09XXXXXXXX" style={{ direction: 'ltr', textAlign: 'right' }} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">📍 العنوان (اختياري)</label>
              <input className="new-service-input" value={form.address} onChange={(e) => update('address', e.target.value)} />
            </div>

            {error && <div style={{ padding: 12, background: 'rgba(220,38,38,.15)', borderRadius: 12, color: '#f87171', fontSize: 12.5, marginBottom: 12, textAlign: 'center' }}>⚠️ {error}</div>}

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setMode('choose')} type="button">→ رجوع</button>
              <button className="mng-btn primary" type="submit">✓ متابعة</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
