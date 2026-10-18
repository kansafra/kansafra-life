'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function PharmacyPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('entities')
        .select('*')
        .eq('is_active', true)
        .eq('entity_type', 'pharmacy')
        .order('display_name');
      setItems(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(p =>
      (p.display_name || '').toLowerCase().includes(q) ||
      (p.bio || '').toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>💊 الصيدليات</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{filtered.length} صيدلية</div>
          </div>
          <div style={{ fontSize: 40 }}>💊</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث عن صيدلية..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      {loading ? (
        <div style={{ padding: 16 }}><SkeletonList count={3} /></div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0 ? (
            <EmptyState icon="💊" title={search ? 'لا توجد نتائج' : 'لا توجد صيدليات'} description="ستظهر الصيدليات هنا" actionLabel="← الرئيسية" actionHref="/" />
          ) : filtered.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                {p.logo_url ? (
                  <img src={p.logo_url} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg,#0891b2,#0e7490)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>💊</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{p.display_name}</div>
                    {p.is_verified && <span style={{ fontSize: 12 }}>✅</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#0891b2', fontWeight: 800 }}>💊 صيدلية</div>
                  {p.bio && <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.bio}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b', marginBottom: 12, flexWrap: 'wrap' }}>
                {p.city && <span>📍 {p.city}</span>}
                {p.address && <span>🏠 {p.address}</span>}
                {p.opening_hours && <span>🕐 {p.opening_hours}</span>}
              </div>
              {p.phone && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`tel:${p.phone}`} style={{ flex: 1, padding: 10, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📞 اتصال</a>
                  <a href={`https://wa.me/${String(p.phone).replace(/\D/g, '').replace(/^0/, '963')}`} target="_blank" rel="noopener" style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,.1)', color: '#059669', border: '1px solid rgba(37,211,102,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📱 واتساب</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
