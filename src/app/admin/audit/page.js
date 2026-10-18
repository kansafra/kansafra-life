'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const ACTION_LABELS = {
  create: { label: 'إنشاء', color: '#10b981', icon: '➕' },
  update: { label: 'تعديل', color: '#3b82f6', icon: '✏️' },
  delete: { label: 'حذف', color: '#ef4444', icon: '🗑️' },
  login: { label: 'دخول', color: '#8b5cf6', icon: '🔑' },
  approve: { label: 'موافقة', color: '#10b981', icon: '✅' },
  reject: { label: 'رفض', color: '#ef4444', icon: '❌' },
  activate: { label: 'تفعيل', color: '#10b981', icon: '▶️' },
  deactivate: { label: 'إيقاف', color: '#f59e0b', icon: '⏸️' },
};

export default function AdminAudit() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
    setLogs(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = logs;
    if (filter !== 'all') list = list.filter(l => l.action === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(l =>
        (l.admin_name || '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [logs, filter, search]);

  const stats = useMemo(() => {
    const s = { total: logs.length };
    Object.keys(ACTION_LABELS).forEach(k => { s[k] = logs.filter(l => l.action === k).length; });
    return s;
  }, [logs]);

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>📋 سجل التدقيق ({stats.total})</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {[['total', 'الكل', '#0f4d3a'], ['create', 'إنشاء', '#10b981'], ['update', 'تعديل', '#3b82f6'], ['delete', 'حذف', '#ef4444']].map(([k, l, c]) => (
            <div key={k} onClick={() => setFilter(k === 'total' ? 'all' : k)} style={{ background: '#fff', borderRadius: 12, padding: 12, border: filter === (k === 'total' ? 'all' : k) ? `2px solid ${c}` : '1px solid #e5e7eb', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: c }}>{stats[k] || 0}</div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        <input type="text" placeholder="🔍 ابحث بالاسم أو الإجراء..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 12 }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? <EmptyState icon="📋" title="لا توجد سجلات" /> : filtered.map(l => {
          const cfg = ACTION_LABELS[l.action] || { label: l.action, color: '#64748b', icon: '•' };
          return (
            <div key={l.id} style={{ background: '#fff', borderRadius: 14, padding: 12, marginBottom: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{l.admin_name || 'نظام'}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{new Date(l.created_at).toLocaleString('ar-EG')}</div>
                </div>
                <span style={{ background: `${cfg.color}20`, color: cfg.color, padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900, whiteSpace: 'nowrap' }}>{cfg.icon} {cfg.label}</span>
              </div>
              {l.target_type && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>📦 {l.target_type}</div>}
              {l.details && <div style={{ fontSize: 12, color: '#334155', background: '#f8fafc', padding: 8, borderRadius: 6, lineHeight: 1.5 }}>{l.details}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
