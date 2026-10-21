'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginEntity } from '@/lib/auth';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!identifier.trim()) { tE('اسم المستخدم أو رقم الهاتف مطلوب'); return; }
    if (!password) { tE('كلمة المرور مطلوبة'); return; }

    setLoading(true);
    try {
      const isPhone = /^[0-9+\s-]+$/.test(identifier.trim());
      await loginEntity({
        phone: isPhone ? identifier : null,
        username: isPhone ? null : identifier.trim(),
        password,
      });
      success('✅ تم تسجيل الدخول بنجاح');
      router.push('/merchant');
    } catch (err) {
      tE(err.message || 'تعذّر تسجيل الدخول');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a1f16 0%, #061410 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'rgba(255,255,255,.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, padding: '40px 24px', maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: 32, marginBottom: 16, boxShadow: '0 8px 24px rgba(16,185,129,.3)' }}>
            🌿
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8 }}>مرحباً بك في سند</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>سجل دخولك لإدارة أعمالك</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.8)', marginBottom: 6 }}>رقم الهاتف / اسم المستخدم</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder=""
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', textAlign: 'right' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.8)', marginBottom: 6 }}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontSize: 16 }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: 8, padding: 16, background: loading ? 'rgba(255,255,255,.1)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 8px 24px rgba(16,185,129,.3)' }}>
            {loading ? '... جارٍ الدخول' : 'دخول'}
          </button>
        </form>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.1)', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 16 }}>ليس لديك حساب؟</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/register" style={{ flex: 1, padding: '12px 0', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
              حساب مزود
            </Link>
            <Link href="/employee/login" style={{ flex: 1, padding: '12px 0', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
              حساب موظف
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>← العودة للرئيسية</Link>
        </div>
      </div>
    </div>
  );
}
