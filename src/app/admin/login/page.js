'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLogin() {
  const router = useRouter();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!u.trim() || !p.trim()) { setError('أدخل البيانات'); return; }
    if (!supabase) { setError('لا يوجد اتصال'); return; }
    setLoading(true);
    const { data, error: err } = await supabase.rpc('verify_admin', { un: u.trim(), pw: p });
    setLoading(false);
    if (err) { setError('خطأ يوجد الخادم'); return; }
    if (!data || data.length === 0) { setError('بيانات الدخول غير صحيحة'); return; }
    try { localStorage.setItem('sanad_admin', JSON.stringify(data[0])); } catch {}
    router.push('/admin');
  }

  return (
    <div className="admin-login">
      <div className="admin-login-hero">
        <div className="admin-login-icon"><span>⚙</span></div>
        <h1 className="admin-login-title">لوحة الإدارة</h1>
        <p className="admin-login-sub">دخول المسؤولين فقط</p>
      </div>

      <form className="admin-login-form" onSubmit={submit}>
        <input className="admin-input" type="text" placeholder="اسم المستخدم" value={u} onChange={(e) => setU(e.target.value)} autoCapitalize="none" />
        <input className="admin-input" type="password" placeholder="كلمة المرور" value={p} onChange={(e) => setP(e.target.value)} />
        {error && <div className="admin-warning">{error}</div>}
        <button className="admin-submit" type="submit" disabled={loading}>
          {loading ? '... جارٍ التحقق' : 'دخول آمن →'}
        </button>
      </form>

      <div className="admin-warning">⚠️ هذا القسم مراقب — جميع المحاولات تُسجّل تلقائياً</div>
    </div>
  );
}
