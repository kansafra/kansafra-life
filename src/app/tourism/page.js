'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CATEGORIES = {
  religious: { label: 'ديني', icon: '🕌' },
  historical: { label: 'تاريخي', icon: '🏛️' },
  nature: { label: 'طبيعة', icon: '🌳' },
  entertainment: { label: 'ترفيه', icon: '🎡' },
  food: { label: 'مطاعم', icon: '🍽️' },
  park: { label: 'حدائق', icon: '🌷' },
  museum: { label: 'متاحف', icon: '🏛️' },
  other: { label: 'أخرى', icon: '📸' },
};

export default function TourismPage() {
  const router = useRouter();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => { loadPlaces(); }, []);

  async function loadPlaces() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('touristic_places')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });
      setPlaces(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    let list = places;
    if (category !== 'all') list = list.filter(p => p.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q) ||
        (p.address || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [places, category, search]);

  const stats = useMemo(() => {
    const byCat = {};
    places.forEach(p => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
    return { total: places.length, byCat };
  }, [places]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.back()} style={{ color: '#fff', background: 'rgba(255,255,255,.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🏛️ السياحة</h1>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{stats.total} معلم سياحي</div>
          </div>
          <Link href="/merchant/tourism/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ أضف</Link>
        </div>
        <input type="search" placeholder="🔍 ابحث عن معلم سياحي..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit' }} />
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setCategory('all')} style={chipStyle(category === 'all')}>الكل</button>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <button key={k} onClick={() => setCategory(k)} style={chipStyle(category === k)}>
              {v.icon} {v.label} {stats.byCat[k] > 0 && `(${stats.byCat[k]})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🏛️</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>
              {places.length === 0 ? 'لا توجد معالم سياحية بعد' : 'لا توجد نتائج'}
            </div>
            {places.length === 0 && (
              <Link href="/merchant/tourism/new" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900, marginTop: 12 }}>
                + أضف أول معلم
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.map(p => {
              const cat = CATEGORIES[p.category] || CATEGORIES.other;
              const phone = (p.phone || '').replace(/[^0-9]/g, '');
              return (
                <div key={p.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <div style={{ position: 'relative', paddingTop: '60%', background: '#f1f5f9' }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>{cat.icon}</div>
                    )}
                    {p.is_featured && <div style={{ position: 'absolute', top: 10, right: 10, background: '#fbbf24', color: '#0f172a', padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>⭐ مميز</div>}
                    {p.entry_fee > 0 ? (
                      <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>💵 {Number(p.entry_fee).toLocaleString()} ل.س</div>
                    ) : (
                      <div style={{ position: 'absolute', bottom: 10, right: 10, background: '#10b981', color: '#fff', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>🆓 مجاني</div>
                    )}
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{cat.icon} {cat.label}</div>
                    {p.city && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>📍 {p.city}{p.address ? ` · ${p.address}` : ''}</div>}
                    {p.working_hours && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>⏰ {p.working_hours}</div>}
                    {p.description && (
                      <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {phone && <a href={`tel:${phone}`} style={{ flex: 1, padding: 10, background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>📞</a>}
                      {phone && <a href={`https://wa.me/${phone}?text=${encodeURIComponent('مرحباً، مهتم بزيارة: ' + p.title)}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 8, textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>💬</a>}
                      {p.lat && p.lng && <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: 10, background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8, textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>🗺️</a>}
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

function chipStyle(active) {
  return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
}
