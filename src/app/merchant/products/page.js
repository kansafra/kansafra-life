'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function ProductsPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isSectionAdmin, hasPermission, dataOwnerName } = useCurrentUser();
  const { success, error: toastError } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      let q = supabase.from('products').select('*').order('created_at', { ascending: false });
      if (!isSectionAdmin) q = q.eq('provider_name', dataOwnerName);
      const { data, error } = await q;
      if (error) throw error;
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) { toastError('تعذّر التحميل'); }
    setLoading(false);
  }

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (category !== 'all') list = list.filter(p => p.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    // ترتيب
    const sorted = [...list];
    if (sort === 'price_low') sorted.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === 'price_high') sorted.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === 'name') sorted.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ar'));
    return sorted;
  }, [products, search, category, sort]);

  async function handleDelete(id) {
    if (!confirm('حذف هذا المنتج؟')) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      success('✅ تم حذف المنتج');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) { toastError('تعذّر: ' + e.message); }
    setDeleting(null);
  }

  if (!userLoading && user && !isOwner && !isSectionAdmin && !hasPermission('products')) {
    return <div style={{ padding: 60, textAlign: 'center' }}>🔒 ليس لديك صلاحية</div>;
  }
  if (userLoading || (user && loading)) {
    return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;
  }
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(15,77,58,.2)' }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>📦 المنتجات</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{products.length} منتج</div>
        </div>
        <Link href="/merchant/products/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ منتج</Link>
      </div>

      {/* Search + Filters */}
      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث بالاسم أو الوصف..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        
        {/* Sort */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            style={{ flex: 1, padding: 10, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
            <option value="newest">🆕 الأحدث</option>
            <option value="price_low">💰 السعر: الأقل</option>
            <option value="price_high">💎 السعر: الأعلى</option>
            <option value="name">🔤 الاسم</option>
          </select>
        </div>

        {/* Categories */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding: '6px 12px', background: category === c ? '#0f4d3a' : '#fff', color: category === c ? '#fff' : '#64748b',
                border: `1px solid ${category === c ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 8, fontSize: 11, fontWeight: 800,
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}>{c === 'all' ? 'الكل' : c}</button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="📦"
            title={search ? 'لا توجد نتائج' : 'لا توجد منتجات بعد'}
            description={search ? 'جرّب البحث بكلمات مختلفة' : 'ابدأ بإضافة أول منتج'}
            actionLabel={search ? null : '+ إضافة منتج'}
            actionHref={search ? null : '/merchant/products/new'}
          />
        ) : (
          filtered.map((p) => (
            <div key={p.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 12, marginBottom: 10, display: 'flex', gap: 12 }}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.title} loading="lazy" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>📦</div>
              )}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{p.category || 'عام'}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0f4d3a' }}>{Number(p.price || 0).toLocaleString()} <span style={{ fontSize: 10 }}>{p.currency || 'SYP'}</span></div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Link href={`/product/${p.id}`} style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 14 }}>👁️</Link>
                    <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                      style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {deleting === p.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Add Button */}
      {filtered.length > 0 && (
        <Link href="/merchant/products/new" style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
          padding: '14px 28px', borderRadius: 16, fontSize: 14, fontWeight: 900,
          textDecoration: 'none', boxShadow: '0 8px 24px rgba(16,185,129,.4)', zIndex: 9,
        }}>+ إضافة منتج جديد</Link>
      )}
    </div>
  );
}
