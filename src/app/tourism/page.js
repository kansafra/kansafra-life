'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const PLACE_TYPES = {
  'معلم أثري': '🏛️',
  'طبيعة': '🌄',
  'مطعم': '🍽️',
  'فندق': '🏨',
  'متحف': '🏺',
  'أخرى': '📍',
};

export default function TourismPage() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('touristic_places').select('*').order('created_at', { ascending: false });
      setPlaces(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = places;
    if (typeFilter !== 'all') list = list.filter(p => p.place_type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.location_text || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [places, typeFilter, search]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0284c7,#075985)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🏛️ السياحة</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{filtered.length} معلم</div>
          </div>
          <div style={{ fontSize: 40 }}>🏛️</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث عن مكان..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setTypeFilter('all')} style={{ padding: '8px 14px', background: typeFilter === 'all' ? '#0284c7' : '#fff', color: typeFilter === 'all' ? '#fff' : '#64748b', border: `1px solid ${typeFilter === 'all' ? '#0284c7' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>الكل</button>
          {Object.keys(PLACE_TYPES).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '8px 14px', background: typeFilter === t ? '#0284c7' : '#fff', color: typeFilter === t ? '#fff' : '#64748b', border: `1px solid ${typeFilter === t ? '#0284c7' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{PLACE_TYPES[t]} {t}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 16 }}><SkeletonList count={3} /></div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0 ? (
            <EmptyState icon="🏛️" title={search ? 'لا توجد نتائج' : 'لا توجد أماكن سياحية'} description="ستظهر الأماكن هنا" actionLabel="← الرئيسية" actionHref="/" />
          ) : filtered.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, border: '1px solid #e5e7eb' }}>
              {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} /> : <div style={{ height: 160, background: 'linear-gradient(135deg,#0284c7,#075985)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>{PLACE_TYPES[p.place_type] || '🏛️'}</div>}
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', flex: 1, lineHeight: 1.4 }}>{p.title}</h3>
                  {p.place_type && <span style={{ background: 'rgba(2,132,199,.15)', color: '#0284c7', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap', marginRight: 8 }}>{PLACE_TYPES[p.place_type] || '📍'} {p.place_type}</span>}
                </div>
                {p.description && <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b', marginBottom: 10, flexWrap: 'wrap' }}>
                  {p.location_text && <span>📍 {p.location_text}</span>}
                  {p.opening_hours && <span>🕐 {p.opening_hours}</span>}
                  {Number(p.entry_price) > 0 && <span>💰 {Number(p.entry_price).toLocaleString()} SYP</span>}
                </div>
                {p.phone && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`tel:${p.phone}`} style={{ flex: 1, padding: 10, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📞 اتصال</a>
                    <a href={`https://wa.me/${String(p.phone).replace(/\D/g, '').replace(/^0/, '963')}`} target="_blank" rel="noopener" style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,.1)', color: '#059669', border: '1px solid rgba(37,211,102,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📱 واتساب</a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
