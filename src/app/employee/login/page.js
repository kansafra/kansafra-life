'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginEmployee } from '@/lib/auth';

export default function EmployeeLoginPage() {
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
      await loginEmployee({ phone, password });
      router.push('/merchant');
    } catch (err) {
      setError(err.message || 'تعذّر الدخول');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a1f16 0%, #061410 100%)', padding: '20px' }}>
      <div style={{ maxWidth: 400, margin: '0 auto', paddingTop: 40 }}>
        <Link href="/login" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, display: 'inline-block', padding: 8, background: 'rgba(255,255,255,.1)', borderRadius: 10 }}>→</Link>
        <div style={{ textAlign: 'center', marginTop: 40, marginBottom: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>👤</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8 }}>دخول الموظف</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>سجّل بحساب الموظف الخاص بك</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input type="tel" placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 14, textAlign: 'right', fontFamily: 'inherit', outline: 'none' }} />
          <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 14, textAlign: 'right', fontFamily: 'inherit', outline: 'none' }} />
          {error && (
            <div style={{ padding: 12, background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.35)', borderRadius: 10, color: '#fecaca', fontSize: 13, textAlign: 'center' }}>{error}</div>
          )}
          <button type="submit" disabled={loading} style={{ padding: 16, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? '...' : 'دخول'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 30, fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
          صاحب متجر؟{' '}
          <Link href="/login" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 700 }}>دخول المزود</Link>
        </div>
      </div>
    </div>
  );
}
