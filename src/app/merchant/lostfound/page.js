'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function MerchantLostFoundPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadItems();
  }, [user, userLoading, dataOwnerName]);

  async function loadItems() {
    if (!supabase || !dataOwnerName) return;
    try {
      const { data } = await supabase.from('lost_found').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false });
      setItems(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function toggleActive(item) {
    const { error } = await supabase.from('lost_found').update({ is_active: !item.is_active }).eq('id', item.id);
    if (!error) {
      success(item.is_active ? '🙈 مخفي' : '✅ نشط');
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    }
  }

  async function toggleResolved(item) {
    const { error } = await supabase.from('lost_found').update({ is_resolved: !item.is_resolved }).eq('id', item.id);
    if (!error) {
      success(item.is_resolved ? '🔄 أعيد فتحه' : '✅ تم حلّه');
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_resolved: !i.is_resolved } : i));
    }
  }

  async function handleDelete(item) {
    if (!confirm(`حذف "${item.title}"؟`)) return;
    setDeleting(item.id);
    const { error } = await supabase.from('lost_found').delete().eq('id', item.id);
    if (!error) { success('🗑️ تم الحذف'); setItems(prev => prev.filter(i => i.id !== item.id)); }
    setDeleting(null);
  }

  const stats = useMemo(() => ({
    total: items.length,
    lost: items.filter(i => i.post_type === 'lost' && !i.is_resolved).length,
    found: items.filter(i => i.post_type === 'found' && !i.is_resolved).length,
    resolved: items.filter(i => i.is_resolved).length,
  }), [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (filter === 'lost') list = list.filter(i => i.post_type === 'lost');
    if (filter === 'found') list = list.filter(i => i.post_type === 'found');
    if (filter === 'resolved') list = list.filter(i => i.is_resolved);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i => (i.title || '').toLowerCase().includes(q));
    }
    return list;
  }, [items, filter, search]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>🔍 بلاغاتي</h1>
          <Link href="/merchant/lostfound/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ جديد</Link>
        </div>
        <input type="search" placeholder="🔍 ابحث..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto' }}>
          {[{k:'all',l:'الكل'},{k:'lost',l:'🔴 مفقود'},{k:'found',l:'🟢 موجود'},{k:'resolved',l:'✅ محلول'}].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{ background: filter === f.k ? '#fff' : 'rgba(255,255,255,0.1)', color: filter === f.k ? '#0f4d3a' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{f.l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="مفقود" value={stats.lost} color="#ef4444" />
          <StatBox label="موجود" value={stats.found} color="#10b981" />
          <StatBox label="محلول" value={stats.resolved} color="#94a3b8" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{items.length === 0 ? 'لم تنشر بلاغات' : 'لا نتائج'}</div>
            {items.length === 0 && (
              <Link href="/merchant/lostfound/new" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>+ أضف بلاغاً</Link>
            )}
          </div>
        ) : filtered.map(item => {
          const type = item.post_type === 'found'
            ? { label: 'موجود', color: '#10b981', bg: 'rgba(16,185,129,0.1)' }
            : { label: 'مفقود', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
          return (
            <div key={item.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0', opacity: item.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{new Date(item.created_at).toLocaleDateString('ar-SY')}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <span style={{ background: type.bg, color: type.color, padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 }}>{type.label}</span>
                  {item.is_resolved && <span style={{ background: 'rgba(148,163,184,0.15)', color: '#64748b', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 }}>✅</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => toggleActive(item)} style={btnStyle(item.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', item.is_active ? '#f59e0b' : '#10b981')}>{item.is_active ? '🙈' : '👁️'}</button>
                <button onClick={() => toggleResolved(item)} style={btnStyle(item.is_resolved ? 'rgba(148,163,184,0.15)' : 'rgba(16,185,129,0.1)', item.is_resolved ? '#64748b' : '#10b981')}>{item.is_resolved ? '🔄' : '✅'}</button>
                <button onClick={() => handleDelete(item)} disabled={deleting === item.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{deleting === item.id ? '⏳' : '🗑️'}</button>
              </div>
            </div>
          );
        })}
      </div>

      <Link href="/merchant/lostfound/new" style={{ position: 'fixed', bottom: 20, left: 20, right: 20, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: 16, borderRadius: 14, textAlign: 'center', textDecoration: 'none', fontSize: 15, fontWeight: 900, boxShadow: '0 10px 30px rgba(16,185,129,0.4)', zIndex: 30 }}>+ بلاغ جديد</Link>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 10, textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 16, fontWeight: 900, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 9, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </div>
  );
}

const btnStyle = (bg, color) => ({ flex: 1, minWidth: 50, padding: 8, background: bg, color, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
