'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function SecurityPage() {
  const router = useRouter();
  const { user, loading: uL, isOwner, isSectionAdmin, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [pw, setPw] = useState({ new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    if (!isOwner && !isSectionAdmin) { router.replace('/merchant'); return; }
    loadSessions();
  }, [user, uL, isOwner, isSectionAdmin]);

  async function loadSessions() {
    if (!supabase || !dataOwnerName) return;
    const { data } = await supabase.from('employees').select('full_name, role, phone, is_active').eq('entity_name', dataOwnerName);
    setSessions(data || []);
  }

  async function changePassword() {
    if (!pw.new || pw.new.length < 6) { tE('كلمة المرور 6 أحرف على الأقل'); return; }
    if (pw.new !== pw.confirm) { tE('كلمتا المرور غير متطابقتين'); return; }
    setSaving(true);
    try {
      const { hashPassword } = await import('@/lib/auth');
      const hash = await hashPassword(pw.new);
      const { error } = await supabase.from('entities').update({ password_hash: hash }).eq('id', user.id);
      if (error) throw error;
      success('✅ تم تغيير كلمة المرور');
      setPw({ new: '', confirm: '' });
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  function logoutAll() {
    if (!confirm('تسجيل الخروج من كل الأجهزة؟')) return;
    localStorage.removeItem('sanad_auth_session');
    localStorage.removeItem('sanad_entity');
    localStorage.removeItem('sanad_admin');
    success('تم تسجيل الخروج');
    setTimeout(() => router.push('/login'), 800);
  }

  if (uL) return <div style={{ padding: 60, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🔒 الأمان</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>🔑 تغيير كلمة المرور</div>
          <input type="password" placeholder="كلمة المرور الجديدة" value={pw.new} onChange={(e) => setPw({ ...pw, new: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 8, boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <input type="password" placeholder="تأكيد كلمة المرور" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <button onClick={changePassword} disabled={saving} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ تغيير'}</button>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>👥 الموظفون ({sessions.length})</div>
          {sessions.length === 0 ? <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: 20 }}>لا يوجد موظفون</div> : sessions.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < sessions.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 12 }}>
              <div><strong>{s.full_name}</strong> · {s.role}</div>
              <span style={{ color: s.is_active ? '#10b981' : '#ef4444', fontWeight: 800 }}>{s.is_active ? '● نشط' : '● معطل'}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(220,38,38,.05)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8, color: '#dc2626' }}>⚠️ تسجيل الخروج</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.6 }}>سيتم تسجيل خروجك من كل الأجهزة.</div>
          <button onClick={logoutAll} style={{ width: '100%', padding: 12, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', borderRadius: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🚪 خروج من كل الأجهزة</button>
        </div>
      </div>
    </div>
  );
}
