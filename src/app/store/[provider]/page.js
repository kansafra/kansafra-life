'use client';


import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCart, addToCart, updateQty, removeFromCart, cartTotals } from '@/lib/cart';
import Reviews from '@/components/Reviews';
import Comments from '@/components/Comments';
import FavoriteButton from '@/components/FavoriteButton';

const CAT_ICON = {
  food:'🍽️', drink:'🥤', grocery:'🛒', medicine:'💊',
  clothes:'👕', electronics:'📱', home:'🏠', beauty:'💄',
  stationery:'📚', other:'📦',
};

export default function StorePage() {
  const params = useParams();
  const provider = decodeURIComponent(params?.provider || '');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [totals, setTotals] = useState({ count:0, subtotal:0, total:0, discount:0, currency:'SYP' });

  useEffect(() => {
    if (!provider) return;
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('provider_name', provider)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (Array.isArray(data)) setProducts(data);
      setLoading(false);
    }
    load();
    refreshCart();
    window.addEventListener('sanad-cart-updated', refreshCart);
    return () => window.removeEventListener('sanad-cart-updated', refreshCart);
  }, [provider]);

  function refreshCart() {
    setCart(getCart());
    setTotals(cartTotals());
  }

  const cats = ['all', ...new Set(products.map((p) => p.category || 'other'))];
  const filtered = activeCat === 'all' ? products : products.filter((p) => (p.category || 'other') === activeCat);

  const calcFinal = (p) => {
    const price = Number(p.price) || 0;
    const disc = Number(p.discount_percent) || 0;
    return Math.round(price - (price * disc / 100));
  };

  function handleAdd(p) {
    addToCart(p, provider);
    refreshCart();
  }

  return (
    <div className="store-page">
      <header className="store-hero">
        <div className="store-hero-inner">
          <div className="store-topbar">
            <div className="store-logo">
              <span className="store-logo-mark">س</span>
              <span>سند</span>
            </div>
            <button className="store-cart-btn" onClick={() => setCartOpen(true)} type="button">
              🛒
              {totals.count > 0 && <span className="store-cart-badge">{totals.count}</span>}
            </button>
          </div>
          <h1 className="store-title">{provider}</h1>
          <p className="store-sub">{products.length} منتج متاح</p>
        </div>
      </header>

      {cats.length > 1 && (
        <div className="store-cat-scroll">
          {cats.map((c) => (
            <button
              key={c}
              className={`store-cat-chip ${activeCat === c ? 'active' : ''}`}
              onClick={() => setActiveCat(c)}
              type="button"
            >
              {c === 'all' ? '🛍️ الكل' : `${CAT_ICON[c] || '📦'} ${c}`}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="ol-empty-state" style={{ padding: 80 }}>
          <span className="em">⏳</span>
          <p>جارٍ التحميل...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ol-empty-state" style={{ padding: 80 }}>
          <span className="em">📦</span>
          <p>لا توجد منتجات في هذه الفئة</p>
        </div>
      ) : (
        <div className="store-grid">
          {filtered.map((p) => {
            const finalPrice = calcFinal(p);
            const hasDisc = Number(p.discount_percent) > 0;
            const inStock = Number(p.stock) > 0;
            return (
              <div key={p.id} className="store-card">
                <FavoriteButton
                  targetType="product"
                  targetId={p.id}
                  targetName={p.title}
                  targetImage={p.image_url}
                  className="on-card"
                />
                <div className="store-card-img">
                  {hasDisc && <span className="prod-discount-badge">-{p.discount_percent}%</span>}
                  {p.image_url
                    ? <img src={p.image_url} alt={p.title} loading="lazy" />
                    : <div className="store-card-ph">{CAT_ICON[p.category] || '📦'}</div>}
                </div>
                <div className="store-card-body">
                  <div className="store-card-name">{p.title}</div>
                  <div className="store-card-price">
                    <span className="final">{finalPrice.toLocaleString()}</span>
                    {hasDisc && <span className="old">{Number(p.price).toLocaleString()}</span>}
                    <span className="cur">{p.currency || 'ل.س'}</span>
                  </div>
                  {inStock ? (
                    <button className="store-card-add" onClick={() => handleAdd(p)} type="button">
                      🛒 أضف
                    </button>
                  ) : (
                    <button className="store-card-add" style={{ opacity: .4, pointerEvents: 'none' }} type="button">
                      ✗ نفد
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: '0 20px' }}>
        <Reviews targetType="store" targetId={provider} targetName={provider} />
        <Comments targetType="store" targetId={provider} />
      </div>

      {cartOpen && (
        <div className="cart-panel-bg" onClick={() => setCartOpen(false)}>
          <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cart-panel-handle" />
            <h2 className="cart-panel-title">سلة المشتريات</h2>
            {cart.length === 0 ? (
              <div className="ol-empty-state" style={{ padding: 40 }}>
                <span className="em">🛒</span>
                <p>سلتك فارغة</p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-img">
                      {item.image_url ? <img src={item.image_url} alt="" /> : '📦'}
                    </div>
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.title}</div>
                      <div className="cart-item-price">{(item.price * item.qty).toLocaleString()} {item.currency}</div>
                    </div>
                    <div className="cart-qty">
                      <button onClick={() => { updateQty(item.id, item.qty - 1); refreshCart(); }} type="button">−</button>
                      <span className="n">{item.qty}</span>
                      <button onClick={() => { updateQty(item.id, item.qty + 1); refreshCart(); }} type="button">+</button>
                    </div>
                  </div>
                ))}
                <div className="cart-totals">
                  {totals.discount > 0 && (
                    <div className="cart-total-row">
                      <span>الخصم</span>
                      <span style={{ color: '#16a34a', fontWeight: 900 }}>− {totals.discount.toLocaleString()} {totals.currency}</span>
                    </div>
                  )}
                  <div className="cart-total-row grand">
                    <span>المجموع</span>
                    <span>{totals.total.toLocaleString()} {totals.currency}</span>
                  </div>
                </div>
                <button
                  className="cart-checkout-btn"
                  onClick={() => { setCartOpen(false); window.location.href = '/checkout'; }}
                  type="button"
                >
                  إتمام الطلب ←
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
