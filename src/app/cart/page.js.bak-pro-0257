'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCart, updateQty, removeFromCart, clearCart, cartTotals } from '@/lib/cart';

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [totals, setTotals] = useState({ count: 0, subtotal: 0, total: 0, discount: 0, currency: 'SYP' });

  useEffect(() => {
    refresh();
    window.addEventListener('sanad-cart-updated', refresh);
    return () => window.removeEventListener('sanad-cart-updated', refresh);
  }, []);

  function refresh() {
    setCart(getCart());
    setTotals(cartTotals());
  }

  return (
    <div className="sect-page" style={{ paddingBottom: 120 }}>
      <div className="inv-header">
        <Link href="/" className="inv-back">→</Link>
        <span className="inv-title">🛒 سلة المشتريات</span>
        <span className="mng-count">{totals.count}</span>
      </div>

      {cart.length === 0 ? (
        <div className="sect-empty" style={{ padding: 80 }}>
          <span className="em">🛒</span>
          <p>سلتك فارغة</p>
          <Link href="/" className="mng-add-btn" style={{ marginTop: 16, display: 'inline-block' }}>
            تصفح المنتجات
          </Link>
        </div>
      ) : (
        <>
          <div style={{ padding: 20 }}>
            {cart.map((item) => (
              <div key={item.id} className="cart-item" style={{ background: '#fff', padding: 14, borderRadius: 16, marginBottom: 10, border: '1px solid var(--c-200)' }}>
                <div className="cart-item-img">
                  {item.image_url ? <img src={item.image_url} alt="" /> : '📦'}
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--n-400)', fontWeight: 600 }}>
                    {item.provider_name}
                  </div>
                  <div className="cart-item-price">
                    {(item.price * item.qty).toLocaleString()} {item.currency}
                  </div>
                </div>
                <div className="cart-qty">
                  <button onClick={() => { updateQty(item.id, item.qty - 1); refresh(); }} type="button">−</button>
                  <span className="n">{item.qty}</span>
                  <button onClick={() => { updateQty(item.id, item.qty + 1); refresh(); }} type="button">+</button>
                </div>
                <button
                  onClick={() => { removeFromCart(item.id); refresh(); }}
                  type="button"
                  style={{ marginRight: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              onClick={() => { if (confirm('إفراغ السلة؟')) { clearCart(); refresh(); } }}
              type="button"
              style={{ width: '100%', padding: 12, borderRadius: 12, background: 'rgba(220,38,38,.08)', color: '#dc2626', border: 'none', fontWeight: 800, cursor: 'pointer', marginTop: 8 }}
            >
              🗑️ إفراغ السلة
            </button>

            <div className="cart-totals" style={{ marginTop: 20 }}>
              <div className="cart-total-row">
                <span>المجموع الفرعي</span>
                <span>{totals.subtotal.toLocaleString()} {totals.currency}</span>
              </div>
              {totals.discount > 0 && (
                <div className="cart-total-row">
                  <span>الخصم</span>
                  <span style={{ color: '#16a34a', fontWeight: 900 }}>− {totals.discount.toLocaleString()} {totals.currency}</span>
                </div>
              )}
              <div className="cart-total-row grand">
                <span>المجموع النهائي</span>
                <span>{totals.total.toLocaleString()} {totals.currency}</span>
              </div>
            </div>
          </div>

          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 680, margin: '0 auto', padding: '16px 20px calc(16px + env(safe-area-inset-bottom, 0px))', background: '#fff', borderTop: '1px solid var(--c-200)', zIndex: 40, boxShadow: '0 -8px 24px rgba(8,18,15,.06)' }}>
            <Link
              href="/checkout"
              className="new-service-submit"
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              إتمام الطلب ← {totals.total.toLocaleString()} {totals.currency}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
