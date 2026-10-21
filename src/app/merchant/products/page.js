'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشط' },
  { key: 'hidden', label: 'مخفي' },
];

export default function MerchantProductsPage() {
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadProducts();
  }, [user, userLoading, dataOwnerName]);

  async function loadProducts() {
    if (!supabase || !dataOwnerName) return;
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('provider_name', dataOwnerName)
        .order('created_at', { ascending: false });
      setProducts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(product) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);
    if (error) toastError('حدث خطأ');
    else {
      success(product.is_active ? '👁️ المنتج مخفي الآن' : '✅ المنتج ظاهر للزبائن');
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
    }
  }

  async function handleDelete(product) {
    if (!confirm(`هل تريد حذف "${product.title}" نهائياً؟`)) return;
    setDeleting(product.id);
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      toastError('فشل الحذف');
      setDeleting(null);
    } else {
      success('🗑️ تم الحذف');
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setDeleting(null);
    }
  }

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.is_active).length;
    const hidden = total - active;
    const lowStock = products.filter(p => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 5).length;
    return { total, active, hidden, lowStock };
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (filter === 'active') list = list.filter(p => p.is_active);
    if (filter === 'hidden') list = list.filter(p => !p.is_active);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => (p.title || '').toLowerCase().includes(q));
    }
    return list;
  }, [products, filter, search]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      
      {/* Header */}
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>🛍️ المنتجات</h1>
          <Link href="/merchant/products/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>+ جديد</Link>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="🔍 ابحث عن منتج..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }}
        />

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#fff' : 'rgba(255,255,255,0.1)', color: filter === f.key ? '#0f4d3a' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="نشط" value={stats.active} color="#10b981" />
          <StatBox label="مخفي" value={stats.hidden} color="#94a3b8" />
          <StatBox label="مخزون منخفض" value={stats.lowStock} color="#ef4444" />
        </div>

        {/* Products List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            {products.length === 0 ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>لا توجد منتجات بعد</div>
                <Link href="/merchant/products/new" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>+ أضف أول منتج</Link>
              </>
            ) : (
              <div>لا توجد نتائج مطابقة.</div>
            )}
          </div>
        ) : (
          filtered.map(product => (
            <div key={product.id} style={{ background: '#fff', borderRadius: 16, marginBottom: 12, border: '1px solid #e2e8f0', overflow: 'hidden', opacity: product.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', padding: 12, gap: 12 }}>
                
                {/* Image */}
                <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#0f4d3a' }}>{Number(product.price || 0).toLocaleString()}</span>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{product.currency || 'SYP'}</span>
                    {Number(product.discount_percent) > 0 && (
                      <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '2px 6px', borderRadius: 6, fontWeight: 900 }}>-{product.discount_percent}%</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5 }}>
                    <span style={{ color: product.is_active ? '#10b981' : '#94a3b8', fontWeight: 900 }}>
                      {product.is_active ? '● نشط' : '● مخفي'}
                    </span>
                    {product.stock !== null && product.stock !== undefined && (
                      <span style={{ color: Number(product.stock) <= 5 ? '#ef4444' : '#64748b', fontWeight: 800 }}>
                        · مخزون: {product.stock}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', borderTop: '1px solid #f1f5f9' }}>
                <Link href={`/merchant/products/${product.id}/edit`} style={{ flex: 1, padding: '10px 8px', textAlign: 'center', color: '#0f4d3a', textDecoration: 'none', fontSize: 12, fontWeight: 900, borderLeft: '1px solid #f1f5f9' }}>✏️ تعديل</Link>
                <button onClick={() => toggleActive(product)} style={{ flex: 1, padding: '10px 8px', textAlign: 'center', background: 'none', border: 'none', borderLeft: '1px solid #f1f5f9', color: product.is_active ? '#f59e0b' : '#10b981', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {product.is_active ? '🙈 إخفاء' : '👁️ إظهار'}
                </button>
                <button onClick={() => handleDelete(product)} disabled={deleting === product.id} style={{ flex: 1, padding: '10px 8px', textAlign: 'center', background: 'none', border: 'none', color: '#ef4444', fontSize: 12, fontWeight: 900, cursor: deleting === product.id ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                  {deleting === product.id ? '⏳' : '🗑️ حذف'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Add Button */}
      <Link href="/merchant/products/new" style={{
        position: 'fixed', bottom: 20, left: 20, right: 20,
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff', padding: 16, borderRadius: 14,
        textAlign: 'center', textDecoration: 'none',
        fontSize: 15, fontWeight: 900,
        boxShadow: '0 10px 30px rgba(16,185,129,0.4)',
        zIndex: 30
      }}>
        + إضافة منتج جديد
      </Link>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 10, textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </div>
  );
}
