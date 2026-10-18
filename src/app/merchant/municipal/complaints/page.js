'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const STATUS = {
  open: { label: 'جديدة', color: '#f59e0b', icon: '⏳' },
  in_progress: { label: 'قيد المعالجة', color: '#3b82f6', icon: '⚙️' },
  resolved: { label: 'تم الحل', color: '#10b981', icon: '✅' },
  rejected: { label: 'مرفوضة', color: '#ef4444', icon: '❌' },
};

const CATEGORIES = {
  general: 'عام', roads: 'طرق وأرصفة', water: 'مياه', electricity: 'كهرباء',
  garbage: 'نظافة', building: 'مخالفات بناء', other: 'أخرى',
};

export default function MunicipalComplaintsPage() {
  const router = useRouter();
  const { user, loading: uL } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, uL]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
      setComplaints(data || []);
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = complaints;
    if (filter !== 'all') list = list.filter(c => c.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => (c.title || '').toLowerCase().includes(q) || (c.citizen_name || '').toLowerCase().includes(q) || (c.citizen_phone || '').includes(q));
    }
    return list;
  }, [complaints, filter, search]);

  const stats = useMemo(() => ({
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  }), [complaints]);

  async function updateStatus(newStatus) {
    if (!selected) return;
    setSaving(true);
    try {
      const updates = { status: newStatus };
      if (reply.trim()) updates.response = reply.trim();
      const { error } = await supabase.from('complaints').update(updates).eq('id', selected.id);
      if (error) throw error;
      success('✅ تم التحديث');
      setSelected(null); setReply(''); load();
    } catch (e) { tE('تعذّر'); }
    setSaving(false);
  }

  async function sendReply() {
    if (!reply.trim()) { tE('اكتب الرد'); return; }
    await updateStatus(selected.status === 'open' ? 'in_progress' : selected.status);
  }

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e40af', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant/municipal" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>📝 شكاوى المواطنين</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{stats.open} جديدة</div>
        </div>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 10, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{stats.total}</div>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>الكل</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 10, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b' }}>{stats.open}</div>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>جديدة</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 10, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#3b82f6' }}>{stats.in_progress}</div>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>معالجة</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 10, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>{stats.resolved}</div>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>محلولة</div>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <input type="text" placeholder="🔍 ابحث بالعنوان أو الاسم..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all', 'الكل'], ['open', 'جديدة'], ['in_progress', 'معالجة'], ['resolved', 'محلولة'], ['rejected', 'مرفوضة']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 14px', background: filter === k ? '#1e40af' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#1e40af' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="📝" title="لا توجد شكاوى" description="ستظهر هنا شكاوى المواطنين" />
        ) : filtered.map(c => {
          const s = STATUS[c.status] || STATUS.open;
          return (
            <div key={c.id} onClick={() => { setSelected(c); setReply(c.response || ''); }} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${c.status === 'open' ? '#f59e0b' : '#e5e7eb'}`, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>👤 {c.citizen_name} · {c.citizen_phone}</div>
                </div>
                <span style={{ background: `${s.color}20`, color: s.color, padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, height: 'fit-content' }}>{s.icon} {s.label}</span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                📂 {CATEGORIES[c.category] || c.category} · 📅 {new Date(c.created_at).toLocaleDateString('ar-EG')}
              </div>
              {c.description && <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</div>}
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>{selected.title}</h3>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>👤 {selected.citizen_name} · 📞 {selected.citizen_phone}</div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13, color: '#334155', lineHeight: 1.7 }}>{selected.description}</div>
            {selected.location_text && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>📍 {selected.location_text}</div>}
            {selected.image_url && <img src={selected.image_url} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 12 }} />}

            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الرد على المواطن</label>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="اكتب ردك..." style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
              {Object.entries(STATUS).map(([k, v]) => (
                <button key={k} onClick={() => updateStatus(k)} disabled={saving} style={{ padding: 10, background: selected.status === k ? v.color : '#f1f5f9', color: selected.status === k ? '#fff' : '#64748b', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{v.icon} {v.label}</button>
              ))}
            </div>

            {reply !== selected.response && (
              <button onClick={sendReply} disabled={saving || !reply.trim()} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving || !reply.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>{saving ? '...' : '✓ حفظ الرد'}</button>
            )}

            <button onClick={() => setSelected(null)} style={{ width: '100%', padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
