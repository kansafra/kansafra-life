'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import PropertyMap from '@/components/PropertyMap';

export default function RealEstatePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dealType, setDealType] = useState('all');
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('real_estate').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = items;
    if (dealType !== 'all') list = list.filter(i => i.deal_type === dealType);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i => (i.title || '').toLowerCase().includes(q) || (i.location_text || '').toLowerCase().includes(q));
    }
    return list;
  }, [items, search, dealType]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#ea580c,#9a3412)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🏠 العقارات</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{filtered.length} عقار</div>
          </div>
          <div style={{ fontSize: 40 }}>🏠</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث بالعنوان أو الموقع..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all', 'الكل'], ['للبيع', 'للبيع'], ['للإيجار', 'للإيجار']].map(([k, l]) => (
            <button key={k} onClick={() => setDealType(k)} style={{ padding: '8px 14px', background: dealType === k ? '#ea580c' : '#fff', color: dealType === k ? '#fff' : '#64748b', border: `1px solid ${dealType === k ? '#ea580c' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button onClick={() => setViewMode('list')} style={{ flex: 1, padding: 10, background: viewMode === 'list' ? '#ea580c' : '#fff', color: viewMode === 'list' ? '#fff' : '#64748b', border: '1px solid ' + (viewMode === 'list' ? '#ea580c' : '#e5e7eb'), borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📋 قائمة</button>
          <button onClick={() => setViewMode('map')} style={{ flex: 1, padding: 10, background: viewMode === 'map' ? '#ea580c' : '#fff', color: viewMode === 'map' ? '#fff' : '#64748b', border: '1px solid ' + (viewMode === 'map' ? '#ea580c' : '#e5e7eb'), borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🗺️ خريطة</button>
        </div>
      </div>
      {loading ? <div style={{ padding: 16 }}><SkeletonList count={3} /></div> : (
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0 ? <EmptyState icon="🏠" title="لا توجد عقارات" description="ستظهر العقارات هنا" actionLabel="← الرئيسية" actionHref="/" /> : filtered.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ height: 160, background: p.images?.[0] ? `url(${p.images[0]}) center/cover` : 'linear-gradient(135deg,#ea580c,#9a3412)', position: 'relative' }}>
                <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,.6)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{p.deal_type}</span>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{p.title}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#ea580c' }}>{Number(p.price || 0).toLocaleString()} <span style={{ fontSize: 10, color: '#64748b' }}>{p.currency || 'SYP'}</span></div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                  <span>🏠 {p.property_type}</span>
                  {p.rooms && <span>🛏️ {p.rooms} غرف</span>}
                  {p.area_m2 && <span>📏 {p.area_m2} م²</span>}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>📍 {p.location_text}</div>
                <a href={`https://wa.me/${String(p.owner_phone || p.phone).replace(/\D/g, '').replace(/^0/, '963')}`} target="_blank" rel="noopener" style={{ display: 'block', width: '100%', padding: 10, background: 'rgba(234,88,12,.1)', color: '#ea580c', border: '1px solid rgba(234,88,12,.3)', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📱 تواصل مع المالك</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
