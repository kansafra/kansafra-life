'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

// دالة تجزئة بسيطة (هاش) — تكفي للحماية الأساسية
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sanad_salt_v1');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const { success, error: toastError } = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // حقول الدخول
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  
  // حقول التسجيل
  const [registerForm, setRegisterForm] = useState({ name: '', phone: '', password: '', address: '' });

  useEffect(() => {
    // إذا كان مسجل دخول، أعده لصفحة next مباشرة
    try {
      const existing = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      if (existing?.id) router.replace(next);
    } catch {}
  }, [router, next]);

  function normalizePhone(p) {
    return (p || '').replace(/[^0-9]/g, '');
  }

  async function handleLogin(e) {
    e.preventDefault();
    const phone = normalizePhone(loginForm.phone);
    if (phone.length < 8) { toastError('رقم الهاتف غير صحيح'); return; }
    if (!loginForm.password) { toastError('أدخل كلمة المرور'); return; }
    setLoading(true);
    try {
      // البحث المرن عن الرقم (يتجاهل البداية 0 أو 963 أو 00963)
      const phoneSuffix = phone.slice(-9);
      const { data: matches, error } = await supabase
        .from('customers')
        .select('*')
        .like('phone', '%' + phoneSuffix);
      
      // اختيار الحساب الذي يحتوي على كلمة مرور أولاً
      let data = matches?.find(m => m.password_hash) || matches?.[0] || null;

      if (error) throw error;
      if (!data) { toastError('لا يوجد حساب بهذا الرقم. يمكنك إنشاء حساب جديد.'); return; }
      
      // التحقق من كلمة المرور
      const hashed = await hashPassword(loginForm.password);
      if (data.password_hash && data.password_hash !== hashed) {
        toastError('كلمة المرور غير صحيحة');
        return;
      }
      // إذا لم يكن لديه كلمة مرور، نعتبره حساباً قديماً ونقبل الدخول
      
      const customer = { id: data.id, name: data.name, phone: data.phone, address: data.address };
      localStorage.setItem('sanad_customer', JSON.stringify(customer));
      success('مرحباً بك مجدداً، ' + (data.name || data.phone));
      setTimeout(() => router.push(next), 400);
    } catch (err) {
      console.error(err);
      toastError('تعذر الاتصال بالخادم');
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const phone = normalizePhone(registerForm.phone);
    if (!registerForm.name.trim()) { toastError('أدخل اسمك الكامل'); return; }
    if (phone.length < 8) { toastError('رقم الهاتف غير صحيح'); return; }
    if (registerForm.password.length < 6) { toastError('كلمة المرور يجب أن تكون ٦ أحرف على الأقل'); return; }
    setLoading(true);
    try {
      // هل الرقم مسجل؟
      const { data: existing } = await supabase.from('customers').select('id').eq('phone', phone).maybeSingle();
      if (existing) {
        toastError('هذا الرقم مسجل بالفعل. سجّل دخولك.');
        setMode('login');
        setLoginForm({ phone, password: '' });
        return;
      }

      const hashed = await hashPassword(registerForm.password);
      const { data, error } = await supabase.from('customers').insert({
        name: registerForm.name,
        phone: phone,
        address: registerForm.address,
        password_hash: hashed,
        is_guest: false,
      }).select('id, name, phone, address').single();

      if (error) throw error;
      
      localStorage.setItem('sanad_customer', JSON.stringify(data));
      success('🎉 تم إنشاء حسابك بنجاح!');
      setTimeout(() => router.push(next), 500);
    } catch (err) {
      console.error(err);
      toastError('فشل التسجيل: ' + (err.message || 'خطأ'));
    } finally { setLoading(false); }
  }

  function continueAsGuest() {
    router.push('/');
  }

  function forgotPassword() {
    router.push('/forgot-password');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0fdf4 0%, #f8fafc 40%)', display: 'flex', flexDirection: 'column' }}>
      
      {/* زر العودة */}
      <div style={{ padding: '16px 20px' }}>
        <Link href="/" style={{ color: '#0f4d3a', textDecoration: 'none', fontSize: 14, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← العودة للرئيسية
        </Link>
      </div>

      <div style={{ flex: 1, padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', maxWidth: 500, margin: '0 auto', width: '100%' }}>
        
        {/* الشعار */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #0f4d3a, #075640)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 12, boxShadow: '0 10px 30px rgba(15,77,58,0.25)' }}>
            🏘️
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0 }}>
            {mode === 'login' ? 'أهلاً بعودتك' : 'انضم إلى سند'}
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>
            {mode === 'login' ? 'سجّل دخولك لمتابعة طلباتك' : 'أنشئ حسابك المجاني في دقيقة'}
          </p>
        </div>

        {/* تبديل الوضع */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: 14, padding: 4, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', width: '100%', border: '1px solid #e2e8f0' }}>
          <button onClick={() => setMode('login')} style={{ flex: 1, padding: '12px', background: mode === 'login' ? '#0f4d3a' : 'transparent', color: mode === 'login' ? '#fff' : '#64748b', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>تسجيل الدخول</button>
          <button onClick={() => setMode('register')} style={{ flex: 1, padding: '12px', background: mode === 'register' ? '#0f4d3a' : 'transparent', color: mode === 'register' ? '#fff' : '#64748b', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>حساب جديد</button>
        </div>

        {/* نموذج الدخول */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <Field label="رقم الهاتف">
              <input type="tel" value={loginForm.phone} onChange={e => setLoginForm({ ...loginForm, phone: e.target.value })} placeholder="09xxxxxxxx" style={inputStyle} required />
            </Field>
            <Field label="كلمة المرور">
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="••••••••" style={{ ...inputStyle, paddingLeft: 44 }} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4 }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </Field>
            <div style={{ textAlign: 'left', marginBottom: 20 }}>
              <button type="button" onClick={forgotPassword} style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>هل نسيت كلمة المرور؟</button>
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 16, background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
              {loading ? '⏳ جارٍ الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
        )}

        {/* نموذج التسجيل */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ width: '100%' }}>
            <Field label="الاسم الكامل">
              <input type="text" value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} placeholder="مثال: أحمد محمد" style={inputStyle} required />
            </Field>
            <Field label="رقم الهاتف">
              <input type="tel" value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} placeholder="09xxxxxxxx" style={inputStyle} required />
            </Field>
            <Field label="كلمة المرور">
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="6 أحرف على الأقل" style={{ ...inputStyle, paddingLeft: 44 }} required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4 }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </Field>
            <Field label="العنوان (اختياري)">
              <input type="text" value={registerForm.address} onChange={e => setRegisterForm({ ...registerForm, address: e.target.value })} placeholder="الحي، الشارع..." style={inputStyle} />
            </Field>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 16, background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.3)', marginTop: 8 }}>
              {loading ? '⏳ جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
            </button>
          </form>
        )}

        {/* فاصل */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', margin: '24px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 900 }}>أو</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        {/* متابعة كزائر */}
        <button type="button" onClick={continueAsGuest} style={{ width: '100%', padding: 14, background: '#fff', color: '#0f4d3a', border: '2px solid #0f4d3a', borderRadius: 14, fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
          🛒 متابعة التسوق كزائر
        </button>

        {/* الشروط */}
        <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
          بتسجيلك، أنت توافق على <Link href="/legal/terms" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>شروط الاستخدام</Link> و <Link href="/legal/privacy" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>سياسة الخصوصية</Link>
        </p>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#475569', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontSize: 15,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  outline: 'none',
  background: '#fff',
  color: '#0f172a',
};
