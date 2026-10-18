'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function CustomerSettings() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [pw, setPw] = useState({ new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    let c = null;
    try { c = JSON.parse(localStorage.getItem('sanad_customer') || 'null'); } catch {}
    if (!c) { router.replace('/login'); return; }
    setPhone(c.phone);
  }, [router]);

  async function changePassword() {
    if (!pw.new || pw.new.length < 6) { tE('كلمة المرور 6 أحرف على الأقل'); return; }
    if (pw.new !== pw.confirm) { tE('كلمتا المرور غير متطابقتين'); return; }
    setSaving(true);
    try {
      const { hashPassword } = await import('@/lib/auth');
      const hash = await hashPassword(pw.new);
      const { error } = await supabase.from('customers').update({ password_hash: hash }).eq('phone', phone);
      if (error) throw error;
      success('✅ تم تغيير كلمة المرور');
      setPw({ new: '', confirm: '' });
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  function logout() {
    if (!confirm('تسجيل الخروج؟')) return;
    localStorage.removeItem('sanad_customer');
    localStorage.removeItem('sanad_auth_session');
    router.push('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/customer" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>⚙️ الإعدادات</div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>🔑 تغيير كلمة المرور</div>
          <input type="password" placeholder="كلمة المرور الجديدة" value={pw.new} onChange={(e) => setPw({ ...pw, new: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 8, boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <input type="password" placeholder="تأكيد كلمة المرور" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <button onClick={changePassword} disabled={saving} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ تغيير'}</button>
        </div>
        <div style={{ background: 'rgba(220,38,38,.05)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8, color: '#dc2626' }}>⚠️ تسجيل الخروج</div>
          <button onClick={logout} style={{ width: '100%', padding: 12, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', borderRadius: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🚪 خروج</button>
        </div>
      </div>
    </div>
  );
}
