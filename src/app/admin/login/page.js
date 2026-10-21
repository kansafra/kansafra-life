'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sanad_salt_v1');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

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
      const existing = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
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
      const uname = form.username.trim().toLowerCase();
      const hashed = await hashPassword(form.password);

      let { data: account } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('username', uname)
        .maybeSingle();

      if (!account) {
        const { data: u } = await supabase
          .from('admin_users')
          .select('*')
          .eq('username', uname)
          .maybeSingle();
        if (u) account = { ...u, display_name: u.full_name };
      }

      if (!account) { toastError('لا يوجد حساب بهذا الاسم'); return; }
      if (account.password_hash !== hashed) { toastError('كلمة المرور غير صحيحة'); return; }
      if (account.is_active === false) { toastError('الحساب معطّل'); return; }

      const admin = {
        id: account.id,
        username: account.username,
        display_name: account.display_name || account.username,
        role: account.role || 'admin',
      };
      localStorage.setItem('sanad_admin', JSON.stringify(admin));
      document.cookie = `sanad_admin=${encodeURIComponent(JSON.stringify({ id: admin.id, username: admin.username }))}; path=/; max-age=86400; SameSite=Lax`;
      success('مرحباً ' + admin.display_name);
      setTimeout(() => router.push(next), 300);
    } catch (err) {
      console.error(err);
      toastError('خطأ: ' + err.message);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc, #e2e8f0)' }}>
      <div style={{ padding: '16px 20px' }}>
        <Link href="/" style={{ color: '#0f4d3a', textDecoration: 'none', fontSize: 14, fontWeight: 900 }}>← العودة</Link>
      </div>
      <div style={{ padding: '0 20px', maxWidth: 440, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32, marginTop: 40 }}>
          <div style={{ width: 88, height: 88, borderRadius: 24, background: 'linear-gradient(135deg, #0f172a, #1e293b)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 16 }}>🛡️</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0 }}>لوحة الإدارة</h1>
        </div>
        <form onSubmit={handleLogin} style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>اسم المستخدم</label>
            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={inputStyle} required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ ...inputStyle, paddingLeft: 44 }} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4 }}>{showPassword ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 16, background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? '⏳' : '🛡️ دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 900, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
