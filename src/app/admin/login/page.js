'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });

  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem('sanad_admin') || '{}');
      if (existing?.username) router.replace(next);
    } catch {}
  }, [router, next]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      toastError('أدخل اسم المستخدم وكلمة المرور');
      return;
    }
    setLoading(true);
    
    try {
      // الاتصال بالـ API الآمن بدلاً من قاعدة البيانات مباشرة
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: form.username.trim().toLowerCase(), 
          password: form.password 
        })
      });
      
      const data = await res.json();

      if (!res.ok) {
        toastError(data.error || 'بيانات الدخول غير صحيحة');
        return;
      }

      const admin = data.admin;
      localStorage.setItem('sanad_admin', JSON.stringify(admin));
      document.cookie = `sanad_admin=${encodeURIComponent(JSON.stringify(admin))}; path=/; max-age=86400; SameSite=Lax`;
      
      success('مرحباً ' + admin.display_name);
      setTimeout(() => router.push(next), 300);
      
    } catch (err) {
      console.error(err);
      toastError('خطأ في الاتصال بالسيرفر، حاول مجدداً');
    } finally { 
      setLoading(false); 
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px' }}>
        <Link href="/" style={{ color: '#0f4d3a', textDecoration: 'none', fontWeight: 'bold' }}>← العودة</Link>
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px 40px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 88, height: 88, borderRadius: 24, background: '#1e293b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 40 }}>🛡️</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', margin: 0 }}>لوحة الإدارة</h1>
            <p style={{ color: '#64748b', marginTop: 8, fontSize: 14 }}>دخول المشرفين فقط</p>
          </div>

          <form onSubmit={handleLogin} style={{ background: 'white', padding: 32, borderRadius: 24, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 8 }}>اسم المستخدم</label>
              <input 
                type="text" 
                value={form.username} 
                onChange={e => setForm({ ...form, username: e.target.value })}
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: 16 }}
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 8 }}>كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={form.password} 
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: 16 }}
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              style={{ width: '100%', padding: 16, background: '#0f172a', color: 'white', border: 'none', borderRadius: 12, fontSize: 18, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              {loading ? '⏳ جاري التحقق...' : 'دخول 🛡️'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
