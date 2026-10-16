'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginEntity } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!phone.trim()) { setError('رقم الهاتف مطلوب'); return; }
    if (!password) { setError('كلمة المرور مطلوبة'); return; }

    setLoading(true);
    try {
      await loginEntity({ phone, password });
      router.push('/merchant');
    } catch (err) {
      setError(err.message || 'تعذّر تسجيل الدخول');
      setLoading(false);
    }
  }

  return (
    <div className="sect-page" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a1f16 0%, #061410 100%)', paddingBottom: 40 }}>
      <div className="inv-header" style={{ background: 'transparent', border: 'none' }}>
        <button
          className="inv-back"
          onClick={() => router.push('/')}
          type="button"
          style={{ color: '#fff', background: 'rgba(255,255,255,.1)' }}
        >
          →
        </button>
        <span className="inv-title" style={{ color: '#fff' }}>تسجيل الدخول</span>
        <span style={{ width: 40 }} />
      </div>

      <div style={{ padding: '40px 24px 30px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>🔐</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
          مرحباً بك مجدداً
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>
          سجّل دخولك للوصول إلى حسابك
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '0 20px' }}>
        <div className="new-service-field" style={{ marginBottom: 12 }}>
          <label style={{ color: '#fff', fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>
            رقم الهاتف
          </label>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(''); }}
            placeholder="09XXXXXXXX"
            className="new-service-input"
            style={{ background: 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid rgba(255,255,255,.12)', direction: 'ltr', textAlign: 'right', fontSize: 16, padding: 14 }}
          />
        </div>

        <div className="new-service-field" style={{ marginBottom: 20 }}>
          <label style={{ color: '#fff', fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>
            كلمة المرور
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="••••••••"
            className="new-service-input"
            style={{ background: 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid rgba(255,255,255,.12)', fontSize: 16, padding: 14 }}
          />
        </div>

        {error && (
          <div style={{ padding: 12, background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.3)', borderRadius: 12, color: '#fca5a5', fontSize: 12.5, marginBottom: 16, textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 16, background: loading ? '#555' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: loading ? 'wait' : 'pointer' }}
        >
          {loading ? '... جارٍ الدخول' : '🔐 تسجيل الدخول'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 24, padding: '0 20px' }}>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', marginBottom: 12 }}>
          ما عندك حساب؟
        </div>
        <Link
          href="/register"
          style={{ display: 'inline-block', padding: '12px 28px', background: 'rgba(34,197,94,.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,.3)', borderRadius: 999, fontSize: 13, fontWeight: 900, textDecoration: 'none' }}
        >
          🎉 إنشاء حساب جديد
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: 'rgba(255,255,255,.3)' }}>
        بالدخول أنت توافق على الشروط وسياسة الخصوصية
      </div>
    </div>
  );
}
