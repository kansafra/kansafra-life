'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const SALT = 'sanad_salt_2026';

async function hashPassword(pw) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pw + SALT);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) { setError('أدخل البيانات كاملة'); return; }

    setLoading(true);
    try {
      if (!supabase) throw new Error('قاعدة البيانات غير متصلة');
      const hash = await hashPassword(password);
      
      const { data, error: dbErr } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('username', username.trim().toLowerCase())
        .eq('password_hash', hash)
        .eq('is_active', true)
        .maybeSingle();

      if (dbErr) throw dbErr;
      if (!data) throw new Error('بيانات الدخول غير صحيحة');

      // حفظ جلسة الأدمن
      localStorage.setItem('sanad_admin', JSON.stringify({ 
        id: data.id, 
        username: data.username, 
        display_name: data.display_name,
        role: data.role,
        logged_at: new Date().toISOString()
      }));
      
      // تسجيل آخر دخول (اختياري)
      await supabase.from('admin_accounts').update({ last_login: new Date().toISOString() }).eq('id', data.id);

      router.push('/admin');
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a1f16 0%, #061410 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'rgba(255,255,255,.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, padding: '40px 24px', maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 20, background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.3)', fontSize: 28, marginBottom: 16 }}>
            🔐
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>لوحة الإدارة</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>دخول المدراء فقط</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.8)', marginBottom: 6 }}>اسم المستخدم</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="اسم المستخدم" autoComplete="username"
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', textAlign: 'right' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.8)', marginBottom: 6 }}>كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          {error && (
            <div style={{ padding: 12, background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.35)', borderRadius: 10, color: '#fecaca', fontSize: 13, textAlign: 'center', fontWeight: 700 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: 8, padding: 16, background: loading ? 'rgba(255,255,255,.1)' : 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? '... جارٍ الدخول' : 'دخول الإدارة'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>← العودة للرئيسية</Link>
        </div>
      </div>
    </div>
  );
}
