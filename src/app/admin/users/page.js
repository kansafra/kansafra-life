'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function AdminUsersPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('customers');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router, tab]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const table = tab === 'customers' ? 'customers' : 'employees';
      const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false });
      setUsers(data || []);
    } catch (e) { tE('تعذّر'); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter(u =>
      (u.full_name || u.name || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  async function del(u) {
    if (!confirm('حذف هذا المستخدم نهائياً؟')) return;
    try {
      const table = tab === 'customers' ? 'customers' : 'employees';
      await supabase.from(table).delete().eq('id', u.id);
      success('تم الحذف');
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (e) { tE('تعذّر'); }
  }

  async function toggleActive(u) {
    try {
      const table = tab === 'customers' ? 'customers' : 'employees';
      await supabase.from(table).update({ is_active: !u.is_active }).eq('id', u.id);
      success('تم');
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x));
    } catch (e) { tE('تعذّر'); }
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>👥 المستخدمون ({filtered.length})</div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setTab('customers')} style={{ flex: 1, padding: 12, background: tab === 'customers' ? '#0f4d3a' : '#fff', color: tab === 'customers' ? '#fff' : '#64748b', border: `1px solid ${tab === 'customers' ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>👤 العملاء</button>
          <button onClick={() => setTab('employees')} style={{ flex: 1, padding: 12, background: tab === 'employees' ? '#0f4d3a' : '#fff', color: tab === 'employees' ? '#fff' : '#64748b', border: `1px solid ${tab === 'employees' ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>💼 الموظفون</button>
        </div>
        <input type="text" placeholder="🔍 ابحث بالاسم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>
      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? <EmptyState icon="👥" title="لا يوجد مستخدمون" /> : filtered.map(u => (
          <div key={u.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, flexShrink: 0 }}>{(u.full_name || u.name || '?').charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{u.full_name || u.name || '—'}</div>
                <div style={{ fontSize: 11, color: '#64748b', direction: 'ltr', textAlign: 'right' }}>📞 {u.phone || '—'}</div>
                {tab === 'employees' && u.role && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{u.role} {u.entity_name && `· ${u.entity_name}`}</div>}
              </div>
              {u.is_active !== false ? (
                <span style={{ background: 'rgba(16,185,129,.15)', color: '#10b981', padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900 }}>● نشط</span>
              ) : (
                <span style={{ background: 'rgba(220,38,38,.1)', color: '#dc2626', padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900 }}>● معطل</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => toggleActive(u)} style={{ flex: 1, padding: 8, background: u.is_active !== false ? 'rgba(220,38,38,.1)' : 'rgba(16,185,129,.15)', color: u.is_active !== false ? '#dc2626' : '#10b981', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{u.is_active !== false ? '⏸ إيقاف' : '▶ تفعيل'}</button>
              <button onClick={() => del(u)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
