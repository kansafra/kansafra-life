'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function CustomerFavorites() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let customer = null;
    try { customer = JSON.parse(localStorage.getItem('sanad_customer') || 'null'); } catch {}
    if (!customer) { router.replace('/login'); return; }
    load(customer);
  }, [router]);

  async function load(customer) {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('favorites').select('*').eq('customer_phone', customer.phone).order('created_at', { ascending: false });
      setItems(data || []);
    } catch (e) { tE('تعذّر'); }
    setLoading(false);
  }

  async function remove(item) {
    if (!confirm('إزالة من المفضلة؟')) return;
    await supabase.from('favorites').delete().eq('id', item.id);
    success('✅ تمت الإزالة');
    setItems(prev => prev.filter(x => x.id !== item.id));
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/customer" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>❤️ المفضلة ({items.length})</div>
      </div>

      <div style={{ padding: 16 }}>
        {items.length === 0 ? <EmptyState icon="❤️" title="لا توجد مفضلة" description="أضف منتجات وخدمات للمفضلة للرجوع إليها بسرعة" actionLabel="تصفح المتاجر" actionHref="/stores" /> : items.map(f => {
          const data = f.item_data || {};
          const href = f.item_type === 'product' ? `/product/${f.item_id}` : f.item_type === 'service' ? `/service/${f.item_id}` : '#';
          return (
            <div key={f.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 12, marginBottom: 10, display: 'flex', gap: 12 }}>
              <Link href={href} style={{ flexShrink: 0 }}>
                {data.image_url ? (
                  <img src={data.image_url} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{f.item_type === 'product' ? '📦' : '🛠️'}</div>
                )}
              </Link>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.title || '—'}</div>
                  </Link>
                  {data.provider_name && <div style={{ fontSize: 11, color: '#64748b' }}>🏪 {data.provider_name}</div>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {data.price && <div style={{ fontSize: 15, fontWeight: 900, color: '#0f4d3a' }}>{Number(data.price).toLocaleString()} <span style={{ fontSize: 10 }}>{data.currency || 'SYP'}</span></div>}
                  <button onClick={() => remove(f)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
