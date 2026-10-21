'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const WORKSHOP_TYPES = {
  metal: { label: 'حدادة', icon: '🔨' },
  aluminum: { label: 'ألمنيوم', icon: '🪟' },
  carpentry: { label: 'نجارة', icon: '🪚' },
  blacksmith: { label: 'حدادة فنية', icon: '⚒️' },
  upholstery: { label: 'تنجيد', icon: '🪑' },
  glass: { label: 'زجاج', icon: '🔍' },
  marble: { label: 'رخام', icon: '🪨' },
  other: { label: 'ورشات أخرى', icon: '🏭' },
};

export default function WorkshopsPage() {
  const router = useRouter();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { loadWorkshops(); }, []);

  async function loadWorkshops() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('workshops').select('*').eq('is_active', true).order('created_at', { ascending: false });
      setWorkshops(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    let list = workshops;
    if (typeFilter !== 'all') list = list.filter(w => w.workshop_type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(w =>
        (w.name || '').toLowerCase().includes(q) ||
        (w.description || '').toLowerCase().includes(q) ||
        (w.city || '').toLowerCase().includes(q) ||
        (w.provider_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [workshops, typeFilter, search]);

  const stats = useMemo(() => {
    const byType = {};
    workshops.forEach(w => { byType[w.workshop_type] = (byType[w.workshop_type] || 0) + 1; });
    return { total: workshops.length, byType };
  }, [workshops]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.back()} style={{ color: '#fff', background: 'rgba(255,255,255,.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🏭 ورشات التصنيع</h1>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{stats.total} ورشة متاحة</div>
          </div>
          <Link href="/merchant/workshops/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ ورشة</Link>
        </div>
        <input type="search" placeholder="🔍 ابحث عن ورشة..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit' }} />
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setTypeFilter('all')} style={chip(typeFilter === 'all')}>الكل</button>
          {Object.entries(WORKSHOP_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setTypeFilter(k)} style={chip(typeFilter === k)}>{v.icon} {v.label} {stats.byType[k] > 0 && `(${stats.byType[k]})`}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🏭</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{workshops.length === 0 ? 'لا توجد ورشات بعد' : 'لا نتائج'}</div>
            {workshops.length === 0 && <Link href="/merchant/workshops/new" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900, marginTop: 12 }}>+ أضف أول ورشة</Link>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {filtered.map(w => {
              const type = WORKSHOP_TYPES[w.workshop_type] || WORKSHOP_TYPES.other;
              const phone = (w.phone || '').replace(/[^0-9]/g, '');
              return (
                <div key={w.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  {w.image_url ? <img src={w.image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' }} /> : <div style={{ width: '100%', height: 140, background: 'linear-gradient(135deg, #f0fdf4, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>{type.icon}</div>}
                  <div style={{ padding: 14 }}>
                    <div style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900, display: 'inline-block', marginBottom: 6 }}>{type.icon} {type.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{w.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>🏪 {w.provider_name || '—'}</div>
                    {w.city && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>📍 {w.city}</div>}
                    {w.description && <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{w.description}</div>}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {phone && <a href={`tel:${phone}`} style={{ flex: 1, padding: 10, background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>📞</a>}
                      {phone && <a href={`https://wa.me/${phone}?text=${encodeURIComponent('مرحباً، أبحث عن ورشة: ' + w.name)}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>💬</a>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function chip(active) {
  return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
}
