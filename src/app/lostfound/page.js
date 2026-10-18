'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function LostFoundPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('lost_found').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = items;
    if (typeFilter !== 'all') list = list.filter(i => i.item_type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i => (i.title || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
    }
    return list;
  }, [items, search, typeFilter]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#dc2626,#991b1b)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🔍 المفقودات</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{filtered.length} بلاغ</div>
          </div>
          <div style={{ fontSize: 40 }}>🔍</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث في البلاغات..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all', 'الكل'], ['مفقود', '🔍 مفقود'], ['وجدته', '✅ وجدته']].map(([k, l]) => (
            <button key={k} onClick={() => setTypeFilter(k)} style={{ padding: '8px 14px', background: typeFilter === k ? '#dc2626' : '#fff', color: typeFilter === k ? '#fff' : '#64748b', border: `1px solid ${typeFilter === k ? '#dc2626' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ padding: 16 }}><SkeletonList count={3} /></div> : (
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0 ? <EmptyState icon="🔍" title="لا توجد بلاغات" description="ستظهر البلاغات هنا" actionLabel="← الرئيسية" actionHref="/" /> : filtered.map(i => (
            <div key={i.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{i.title}</div>
                <span style={{ background: i.item_type === 'وجدته' ? 'rgba(16,185,129,.15)' : 'rgba(220,38,38,.15)', color: i.item_type === 'وجدته' ? '#10b981' : '#dc2626', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{i.item_type}</span>
              </div>
              {i.description && <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 8 }}>{i.description}</div>}
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                {i.location_text && <span>📍 {i.location_text}</span>}
                {i.lost_date && <span>📅 {new Date(i.lost_date).toLocaleDateString('ar-EG')}</span>}
              </div>
              {i.reporter_phone && (
                <a href={`https://wa.me/${String(i.reporter_phone).replace(/\D/g, '').replace(/^0/, '963')}`} target="_blank" rel="noopener" style={{ display: 'block', width: '100%', padding: 10, background: 'rgba(37,211,102,.1)', color: '#059669', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📱 تواصل</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
