'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { addToCart, getCart, cartTotals } from '@/lib/cart';
import { useToast } from '@/components/Toast';
import ReviewsSummary from '@/components/ReviewsSummary';
import Reviews from '@/components/Reviews';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function StorePage() {
  const router = useRouter();
  const params = useParams();
  const provider = decodeURIComponent(params?.provider || '');
  const { success, error: tE } = useToast();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [totals, setTotals] = useState({ count: 0, subtotal: 0, total: 0, discount: 0, currency: 'SYP' });

  useEffect(() => {
    if (!provider) return;
    loadStore();
    loadProducts();
    refreshCart();
    window.addEventListener('sanad-cart-updated', refreshCart);
    return () => window.removeEventListener('sanad-cart-updated', refreshCart);
  }, [provider]);

  async function loadStore() {
    if (!supabase) return;
    const { data } = await supabase.from('entities').select('*').eq('display_name', provider).maybeSingle();
    setStore(data);
  }

  async function loadProducts() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('products').select('*').eq('provider_name', provider).eq('is_active', true).order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }

  function refreshCart() {
    const c = getCart();
    setCart(c);
    setTotals(cartTotals());
  }

  function handleAdd(product) {
    try {
      addToCart({
        id: product.id,
        title: product.title,
        price: Number(product.price) || 0,
        currency: product.currency || 'SYP',
        image: product.image_url,
        provider_name: product.provider_name,
        qty: 1,
      });
      success('✅ أضيف للسلة');
      refreshCart();
    } catch (e) { tE('تعذّر: ' + e.message); }
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
      list = list.filter(p => (p.title || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }
    return list;
  }, [products, search, category]);

  const getFinalPrice = (p) => {
    const price = Number(p.price) || 0;
    const disc = Number(p.discount_percent) || 0;
    return Math.round(price - (price * disc / 100));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16 }}>
        <div style={{ height: 140, background: '#0f4d3a', margin: -16, marginBottom: 16, borderRadius: '0 0 20px 20px' }} />
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(15,77,58,.95)', backdropFilter: 'blur(10px)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>→</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{store?.display_name || provider}</div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{filtered.length} منتج</div>
        </div>
        <button onClick={() => setCartOpen(true)} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
          🛒
          {totals.count > 0 && <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 900 }}>{totals.count}</span>}
        </button>
      </div>

      {/* Cover & Info */}
      <div style={{ position: 'relative', marginBottom: 60 }}>
        <div style={{ height: 160, background: store?.cover_url ? `url(${store.cover_url}) center/cover` : 'linear-gradient(135deg,#0f4d3a,#075640)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: 20, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          {store?.logo_url ? (
            <img src={store.logo_url} alt="" style={{ width: 80, height: 80, borderRadius: 16, border: '4px solid #fff', objectFit: 'cover', background: '#fff' }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, border: '4px solid #fff' }}>🏪</div>
          )}
          <div style={{ background: '#fff', padding: '8px 14px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>{store?.is_verified ? '✅ موثق' : '🏪 متجر'}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{store?.display_name || provider}</h1>
        {store?.bio && <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 6 }}>{store.bio}</p>}
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b', flexWrap: 'wrap' }}>
          {store?.city && <span>📍 {store.city}</span>}
          {store?.phone && <span>📞 {store.phone}</span>}
          {store?.opening_hours && <span>🕐 {store.opening_hours}</span>}
        </div>
      </div>

      {/* Search & Category */}
      <div style={{ padding: '0 16px 12px' }}>
        <input type="text" placeholder="🔍 ابحث في المتجر..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 8 }} />
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{ padding: '6px 12px', background: category === c ? '#0f4d3a' : '#fff', color: category === c ? '#fff' : '#64748b', border: `1px solid ${category === c ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{c === 'all' ? 'الكل' : c}</button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="📦" title="لا توجد منتجات" description={search ? 'جرّب البحث بكلمات مختلفة' : 'لم يضف المتجر منتجات بعد'} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {filtered.map(p => (
              <div key={p.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Link href={`/product/${p.id}`} style={{ textDecoration: 'none' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} loading="lazy" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: 120, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>
                  )}
                </Link>
                <div style={{ padding: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <Link href={`/product/${p.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 900, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                    </Link>
                    {p.discount_percent > 0 && <span style={{ background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 900 }}>-{p.discount_percent}%</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f4d3a' }}>{getFinalPrice(p).toLocaleString()} <span style={{ fontSize: 9, color: '#64748b' }}>{p.currency || 'SYP'}</span></div>
                    <button onClick={() => handleAdd(p)} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setCartOpen(false)}>
          <div style={{ background: '#fff', width: '85%', maxWidth: 380, height: '100%', padding: 20, overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900 }}>🛒 السلة ({totals.count})</h3>
              <button onClick={() => setCartOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>×</button>
            </div>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>السلة فارغة</div>
            ) : (
              <>
                {cart.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                    {item.image && <img src={item.image} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 900 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{item.qty} × {item.price.toLocaleString()} {item.currency}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0f4d3a' }}>{(item.price * item.qty).toLocaleString()}</div>
                  </div>
                ))}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '2px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, marginBottom: 16 }}>
                    <span>المجموع</span>
                    <span style={{ color: '#0f4d3a' }}>{totals.total.toLocaleString()} {totals.currency}</span>
                  </div>
                  <Link href="/cart" onClick={() => setCartOpen(false)} style={{ display: 'block', width: '100%', padding: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontWeight: 900, fontSize: 15 }}>
                    إتمام الطلب
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart */}
      {totals.count > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)} style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
          padding: '14px 28px', borderRadius: 16, fontSize: 14, fontWeight: 900,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 8px 24px rgba(16,185,129,.4)', zIndex: 9,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          🛒 عرض السلة ({totals.count}) · {totals.total.toLocaleString()} {totals.currency}
        </button>
      )}
    <div style={{ padding: '0 16px 20px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
          <Reviews targetType="store" targetId={store?.id || provider} targetName={store?.display_name || provider} />
        </div>
      </div>
    </div>
  );
}
