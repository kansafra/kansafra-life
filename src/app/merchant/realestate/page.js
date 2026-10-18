'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function MyRealEstatePage() {
  const router = useRouter();
  const { user, loading: uL, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, uL]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    const { data } = await supabase.from('real_estate').select('*').eq('owner_name', dataOwnerName).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(i => (i.title || '').toLowerCase().includes(q) || (i.location_text || '').toLowerCase().includes(q));
  }, [items, search]);

  async function del(item) {
    if (!confirm(`حذف عقار "${item.title}"؟`)) return;
    await supabase.from('real_estate').delete().eq('id', item.id);
    success('✅ تم الحذف'); load();
  }

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#ea580c', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🏠 عقاراتي</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{items.length} عقار</div>
        </div>
        <Link href="/merchant/realestate/new" style={{ background: '#fff', color: '#ea580c', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ عقار</Link>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث في عقاراتك..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="🏠" title="لا توجد عقارات" description="أضف عقارك الأول ليظهر للزوار" actionLabel="+ إضافة عقار" actionHref="/merchant/realestate/new" />
        ) : filtered.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 10, border: '1px solid #e5e7eb' }}>
            {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }} />}
            <div style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{p.title}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#ea580c' }}>{Number(p.price || 0).toLocaleString()} {p.currency}</div>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                {p.property_type} · {p.deal_type} · 📍 {p.location_text}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Link href={`/realestate/${p.id}`} style={{ flex: 1, padding: 8, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, textDecoration: 'none', textAlign: 'center' }}>👁️ عرض</Link>
                <button onClick={() => del(p)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
