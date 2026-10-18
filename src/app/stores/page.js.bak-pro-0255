'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { addToCart as addToCartLib } from '@/lib/cart';

const SORTS = [
  { key: 'newest',   label: '🆕 الأحدث' },
  { key: 'rating',   label: '⭐ الأعلى تقييماً' },
  { key: 'price_asc', label: '💵 السعر: الأقل أولاً' },
  { key: 'price_desc', label: '💰 السعر: الأعلى أولاً' },
  { key: 'name',     label: '🔤 الاسم' },
];

export default function StoresPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('products'); // products | stores

  useEffect(() => {
    load();
  }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [prodRes, entRes] = await Promise.all([
      supabase.from('products').select('*').eq('is_active', true),
      supabase.from('entities').select('*').eq('is_active', true).eq('entity_type', 'merchant'),
    ]);
    setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
    setEntities(Array.isArray(entRes.data) ? entRes.data : []);
    setLoading(false);
  }

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [p.title, p.description, p.provider_name, p.category].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // ترتيب
    switch (sort) {
      case 'rating':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price_asc':
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name':
        list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'newest':
      default:
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return list;
  }, [products, category, search, sort]);

  const addToCart = (product) => {
    try {
      addToCartLib({
        id: product.id,
        title: product.title,
        price: product.price,
        currency: product.currency,
        image: product.image_url,
        provider_name: product.provider_name,
        qty: 1,
      });
      alert('✅ تمت الإضافة للسلة');
    } catch (e) {
      alert('تعذّر: ' + e.message);
    }
  };

  return (
    <div className="sect-page" style={{ paddingBottom: 100 }}>
      {/* الهيدر */}
      <div className="inv-header">
        <button className="inv-back" onClick={() => router.back()} type="button">→</button>
        <span className="inv-title">🛍️ المتاجر والتسوق</span>
        <button
          className="icon-btn"
          onClick={() => router.push('/cart')}
          type="button"
          aria-label="السلة"
        >
          🛒
        </button>
      </div>

      {/* البحث */}
      <div style={{ padding: '12px 16px' }}>
        <div className="search-box">
          <span className="ico">⌕</span>
          <input
            type="text"
            placeholder="ابحث عن منتج أو متجر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* التابات */}
      <div className="chips-scroll" style={{ padding: '0 16px 8px' }}>
        <button
          className={`chip ${viewMode === 'products' ? 'active' : ''}`}
          onClick={() => setViewMode('products')}
          type="button"
        >
          📦 المنتجات ({products.length})
        </button>
        <button
          className={`chip ${viewMode === 'stores' ? 'active' : ''}`}
          onClick={() => setViewMode('stores')}
          type="button"
        >
          🏪 المتاجر ({entities.length})
        </button>
      </div>

      {viewMode === 'products' && (
        <>
          {/* فلتر الفئات */}
          <div className="chips-scroll" style={{ padding: '8px 16px' }}>
            {categories.map((c) => (
              <button
                key={c}
                className={`chip ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
                type="button"
              >
                {c === 'all' ? 'الكل' : c}
              </button>
            ))}
          </div>

          {/* الترتيب */}
          <div className="chips-scroll" style={{ padding: '8px 16px 12px' }}>
            {SORTS.map((s) => (
              <button
                key={s.key}
                className={`chip ${sort === s.key ? 'active' : ''}`}
                onClick={() => setSort(s.key)}
                type="button"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* المنتجات */}
          {loading ? (
            <div className="sect-empty"><span className="em">⏳</span></div>
          ) : filtered.length === 0 ? (
            <div className="sect-empty">
              <span className="em">📦</span>
              <p>لا توجد منتجات مطابقة</p>
            </div>
          ) : (
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="debt-card"
                  style={{ borderRightColor: '#0f4d3a', padding: 10, margin: 0 }}
                >
                  <div
                    onClick={() => router.push('/service/' + p.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.title}
                        style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: 100, borderRadius: 8,
                        background: 'rgba(15,77,58,.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32
                      }}>
                        🛍️
                      </div>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 800, marginTop: 8, lineHeight: 1.3, height: 32, overflow: 'hidden' }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--n-500)', marginTop: 3 }}>
                      🏪 {p.provider_name || 'متجر'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#14b8a6', marginTop: 6, direction: 'ltr', textAlign: 'right' }}>
                      {Number(p.price || 0).toLocaleString()} {p.currency || 'SYP'}
                    </div>
                  </div>
                  <button
                    className="mng-btn primary"
                    onClick={() => addToCart(p)}
                    type="button"
                    style={{ width: '100%', marginTop: 8, padding: 8, fontSize: 12 }}
                  >
                    🛒 أضف للسلة
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* قائمة المتاجر */}
      {viewMode === 'stores' && (
        <div style={{ padding: 16 }}>
          {entities.length === 0 ? (
            <div className="sect-empty">
              <span className="em">🏪</span>
              <p>لا توجد متاجر بعد</p>
            </div>
          ) : (
            entities.map((e) => (
              <button
                key={e.id}
                className="debt-card"
                onClick={() => router.push('/store/' + e.username)}
                style={{
                  borderRightColor: '#0f4d3a', marginBottom: 10,
                  width: '100%', textAlign: 'right', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12
                }}
                type="button"
              >
                <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(15,77,58,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {e.logo_url ? <img src={e.logo_url} style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }} /> : '🏪'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{e.display_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--n-500)', marginTop: 3 }}>
                    {e.bio || e.phone || 'متجر'}
                  </div>
                </div>
                <span style={{ fontSize: 20, color: 'var(--n-500)' }}>›</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
