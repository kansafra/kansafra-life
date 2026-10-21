'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sanad_salt_v1');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function MerchantLoginPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ identifier: '', password: '' });

  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
      if (existing?.id) router.replace('/merchant');
    } catch {}
  }, [router]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!form.identifier.trim()) { toastError('أدخل اسم المستخدم أو رقم الهاتف'); return; }
    if (!form.password) { toastError('أدخل كلمة المرور'); return; }
    setLoading(true);
    try {
      const identifier = form.identifier.trim();
      const normalizedPhone = identifier.replace(/[^0-9]/g, '');
      const isPhone = normalizedPhone.length >= 8 && /^[0-9+\s-]+$/.test(identifier);
      const uname = identifier.toLowerCase();
      const hashed = await hashPassword(form.password);

      // 1. المالك
      let q = supabase.from('entities').select('*');
      if (isPhone) {
        const suffix = normalizedPhone.slice(-9);
        q = q.like('phone', '%' + suffix);
      } else {
        q = q.eq('username', uname);
      }
      const { data: matches } = await q;
      const entity = (matches || []).find(e => e.password_hash === hashed);

      if (entity) {
        if (entity.approval_status === 'rejected') { toastError('حسابك مرفوض'); return; }
        if (entity.is_active === false) { toastError('حسابك موقوف'); return; }
        const session = {
          id: entity.id,
          display_name: entity.display_name,
          entity_type: entity.entity_type,
          username: entity.username,
          phone: entity.phone,
          is_employee: false,
        };
        localStorage.setItem('sanad_entity', JSON.stringify(session));
        document.cookie = `sanad_entity=${encodeURIComponent(JSON.stringify({ id: session.id }))}; path=/; max-age=86400; SameSite=Lax`;
        success('مرحباً ' + entity.display_name);
        setTimeout(() => router.push('/merchant'), 300);
        return;
      }

      // 2. الموظف
      let eq = supabase.from('employees').select('*').eq('is_active', true);
      if (isPhone) {
        eq = eq.like('phone', '%' + normalizedPhone.slice(-9));
      } else {
        eq = eq.eq('username', uname);
      }
      const { data: empMatches } = await eq;
      const emp = (empMatches || []).find(e => e.password_hash === hashed);

      if (emp) {
        const { data: parent } = await supabase.from('entities').select('*').eq('display_name', emp.entity_name).maybeSingle();
        if (!parent) { toastError('المتجر غير موجود'); return; }
        if (parent.approval_status !== 'approved') { toastError('متجرك غير معتمد'); return; }
        const session = {
          id: emp.id,
          display_name: parent.display_name,
          entity_type: parent.entity_type,
          username: emp.username,
          phone: emp.phone,
          is_employee: true,
          parent_entity_id: parent.id,
          role: emp.role,
          permissions: emp.permissions || [],
          full_name: emp.full_name,
        };
        localStorage.setItem('sanad_entity', JSON.stringify(session));
        document.cookie = `sanad_entity=${encodeURIComponent(JSON.stringify({ id: session.id }))}; path=/; max-age=86400; SameSite=Lax`;
        success('مرحباً ' + emp.full_name);
        setTimeout(() => router.push('/merchant'), 300);
        return;
      }

      toastError('بيانات الدخول غير صحيحة');
    } catch (err) {
      console.error(err);
      toastError('خطأ: ' + err.message);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0fdf4, #f8fafc)' }}>
      <div style={{ padding: '16px 20px' }}>
        <Link href="/" style={{ color: '#0f4d3a', textDecoration: 'none', fontSize: 14, fontWeight: 900 }}>← العودة</Link>
      </div>
      <div style={{ padding: '0 20px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: 'linear-gradient(135deg, #0f4d3a, #075640)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, marginBottom: 12 }}>🏪</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0 }}>بوابة المزودين</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>دخول المالك أو الموظف</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>اسم المستخدم أو رقم الهاتف</label>
            <input type="text" value={form.identifier} onChange={e => setForm({ ...form, identifier: e.target.value })} placeholder="ahmed_123 أو 09xxxxxxxx" style={inputStyle} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" style={{ ...inputStyle, paddingLeft: 44 }} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4 }}>{showPassword ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 16, background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? '⏳ جارٍ الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link href="/forgot-password" style={{ fontSize: 12, color: '#0ea5e9', fontWeight: 900, textDecoration: 'none' }}>🔑 نسيت كلمة المرور؟</Link>
        </div>
      </div>
    </div>
  );
}
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 900, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', color: '#0f172a' };
