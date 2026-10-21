'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import ReviewsSummary from '@/components/ReviewsSummary';

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    if (!supabase) { // جلب متوسطات التقييمات
      const entityIds = (withCounts || []).map(e => e.id);
      if (entityIds.length > 0) {
        const { data: revs } = await supabase.from('reviews')
          .select('target_id, rating')
          .eq('target_type', 'store')
          .in('target_id', entityIds);
        if (revs) {
          const map = {};
          revs.forEach(r => {
            if (!map[r.target_id]) map[r.target_id] = { total: 0, sum: 0 };
            map[r.target_id].total++;
            map[r.target_id].sum += Number(r.rating || 0);
          });
          const avgMap = {};
          Object.keys(map).forEach(id => {
            avgMap[id] = { avg: map[id].sum / map[id].total, total: map[id].total };
          });
          setRatings(avgMap);
        }
      }
      setLoading(false); return; }
    try {
      // جلب المزودين النشطين
      const { data: entities } = await supabase
        .from('entities')
        .select('id, display_name, entity_type, logo_url, cover_url, bio, phone, is_verified, is_trusted, city, address')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .in('entity_type', ['merchant', 'restaurant', 'pharmacy', 'school', 'hotel', 'office', 'craftsman', 'workshop', 'isp']);

      // جلب عدد المنتجات لكل متجر
      const { data: products } = await supabase.from('products').select('provider_name').eq('is_active', true);

      const productCounts = {};
      (products || []).forEach(p => { productCounts[p.provider_name] = (productCounts[p.provider_name] || 0) + 1; });

      const withCounts = (entities || []).map(e => ({ ...e, products_count: productCounts[e.display_name] || 0 }));
      setStores(withCounts);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = stores;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s =>
        (s.display_name || '').toLowerCase().includes(q) ||
        (s.bio || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sort === 'products') sorted.sort((a, b) => b.products_count - a.products_count);
    else if (sort === 'verified') sorted.sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0));
    else if (sort === 'rating') sorted.sort((a, b) => (ratings[b.id]?.avg || 0) - (ratings[a.id]?.avg || 0));
    return sorted;
  }, [stores, search, sort]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16 }}>
        <div style={{ background: '#0f4d3a', margin: -16, padding: 20, marginBottom: 16 }}>
          <div style={{ width: 100, height: 20, background: 'rgba(255,255,255,.2)', borderRadius: 6 }} />
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🏪 المتاجر</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 }}>{filtered.length} متجر</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث بالاسم أو الوصف..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {[['newest','🆕 الأحدث'],['products','📦 الأكثر منتجات'],['verified','✓ الموثقون']].map(([k, l]) => (
            <button key={k} onClick={() => setSort(k)} style={{ padding: '8px 14px', background: sort === k ? '#0f4d3a' : '#fff', color: sort === k ? '#fff' : '#64748b', border: `1px solid ${sort === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="🏪" title={search ? 'لا توجد نتائج' : 'لا توجد متاجر بعد'} description={search ? 'جرّب البحث بكلمات مختلفة' : 'قريباً ستظهر المتاجر هنا'} actionLabel="← الرئيسية" actionHref="/" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {filtered.map(s => (
              <Link key={s.id} href={`/store/${encodeURIComponent(s.display_name)}`} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 80, background: s.cover_url ? `url(${s.cover_url}) center/cover` : 'linear-gradient(135deg,#0f4d3a,#075640)', position: 'relative' }}>
                  {s.logo_url ? (
                    <img src={s.logo_url} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', position: 'absolute', bottom: -24, right: 12, border: '3px solid #fff', background: '#fff' }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, position: 'absolute', bottom: -24, right: 12, border: '3px solid #fff' }}>🏪</div>
                  )}
                </div>
                <div style={{ padding: '28px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.display_name}</div>
                      <ReviewsSummary targetType="store" targetId={s.id} variant="compact" />
                      {s.is_verified && <span style={{ fontSize: 12 }} title="موثق">✅</span>}
                    </div>
                    {s.bio && <div style={{ fontSize: 10.5, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>{s.bio}</div>}
                    {s.city && <div style={{ fontSize: 10, color: '#94a3b8' }}>📍 {s.city}</div>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700 }}>📦 {s.products_count} منتج</span>
                    <span style={{ fontSize: 10, color: '#10b981', fontWeight: 900 }}>عرض ←</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
