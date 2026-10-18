'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function InventoryPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isSectionAdmin, hasPermission, dataOwnerName } = useCurrentUser();
  const { success, error: toastError } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      let q = supabase.from('products').select('id, title, stock, price, currency, image_url, low_stock_threshold').order('title');
      if (!isSectionAdmin) q = q.eq('provider_name', dataOwnerName);
      const { data, error } = await q;
      if (error) throw error;
      setProducts(data || []);
    } catch (e) { toastError('تعذّر التحميل'); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter(p => (p.title || '').toLowerCase().includes(q));
  }, [products, search]);

  const stats = useMemo(() => {
    let total = 0, low = 0, out = 0;
    products.forEach(p => {
      const stock = Number(p.stock) || 0;
      const threshold = Number(p.low_stock_threshold) || 5;
      total += stock;
      if (stock === 0) out++;
      else if (stock <= threshold) low++;
    });
    return { total, low, out };
  }, [products]);

  async function updateStock() {
    if (!editing) return;
    const stock = parseInt(newStock, 10);
    if (isNaN(stock) || stock < 0) { toastError('أدخل رقماً صحيحاً'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('products').update({ stock }).eq('id', editing.id);
      if (error) throw error;
      success('✅ تم تحديث المخزون');
      setEditing(null);
      load();
    } catch (e) { toastError('تعذّر: ' + e.message); }
    setSaving(false);
  }

  if (userLoading || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>📦 المخزون</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 }}>{filtered.length} منتج</div>
        </div>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>إجمالي القطع</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#0f4d3a' }}>{stats.total}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>على وشك النفاد</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#f59e0b' }}>{stats.low}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius: 12, padding: 12, textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 10, opacity: 0.9, fontWeight: 700, marginBottom: 4 }}>نفدت الكمية</div>
          <div style={{ fontSize: 16, fontWeight: 900 }}>{stats.out}</div>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <input type="text" placeholder="🔍 ابحث عن منتج..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="📦" title="لا توجد منتجات" description="أضف منتجات لتتمكن من إدارة مخزونها" actionLabel="+ إضافة منتج" actionHref="/merchant/products/new" />
        ) : filtered.map(p => {
          const stock = Number(p.stock) || 0;
          const threshold = Number(p.low_stock_threshold) || 5;
          const isOut = stock === 0;
          const isLow = stock > 0 && stock <= threshold;

          return (
            <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 12, marginBottom: 10, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
              {p.image_url ? (
                <img src={p.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
              )}
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{Number(p.price).toLocaleString()} {p.currency || 'SYP'}</div>
              </div>

              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>المخزون</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981' }}>
                  {stock}
                </div>
              </div>

              <button onClick={() => { setEditing(p); setNewStock(stock); }} style={{ padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✏️</button>
            </div>
          );
        })}
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setEditing(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 8, textAlign: 'center' }}>تعديل المخزون</h3>
            <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>{editing.title}</p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
              <button onClick={() => setNewStock(Math.max(0, parseInt(newStock || 0) - 1))} style={{ width: 44, height: 44, borderRadius: '50%', background: '#f1f5f9', border: 'none', fontSize: 24, cursor: 'pointer' }}>-</button>
              <input type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} style={{ width: 100, padding: 12, border: '2px solid #0f4d3a', borderRadius: 12, fontSize: 20, fontWeight: 900, textAlign: 'center', fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={() => setNewStock(parseInt(newStock || 0) + 1)} style={{ width: 44, height: 44, borderRadius: '50%', background: '#f1f5f9', border: 'none', fontSize: 24, cursor: 'pointer' }}>+</button>
            </div>

            <button onClick={updateStock} disabled={saving} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
              {saving ? '...' : '✓ حفظ التعديل'}
            </button>
            <button onClick={() => setEditing(null)} style={{ width: '100%', padding: 12, background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
