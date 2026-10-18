'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCart, updateQty, removeFromCart, clearCart, cartTotals } from '@/lib/cart';
import { useToast } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';

export default function CartPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [cart, setCart] = useState([]);
  const [totals, setTotals] = useState({ count: 0, subtotal: 0, total: 0, discount: 0, currency: 'SYP' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh();
    window.addEventListener('sanad-cart-updated', refresh);
    return () => window.removeEventListener('sanad-cart-updated', refresh);
  }, []);

  function refresh() {
    setCart(getCart());
    setTotals(cartTotals());
    setLoading(false);
  }

  function changeQty(id, provider, newQty) {
    if (newQty < 1) { removeItem(id, provider); return; }
    updateQty(id, provider, newQty);
    refresh();
  }

  function removeItem(id, provider) {
    removeFromCart(id, provider);
    success('🗑️ تم الحذف');
    refresh();
  }

  function handleClear() {
    if (!confirm('مسح السلة كاملة؟')) return;
    clearCart();
    success('✅ تم المسح');
    refresh();
  }

  // تجميع حسب المزود
  const byProvider = useMemo(() => {
    const map = {};
    cart.forEach(item => {
      const prov = item.provider_name || 'متجر';
      if (!map[prov]) map[prov] = [];
      map[prov].push(item);
    });
    return map;
  }, [cart]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  if (cart.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
        <div style={{ background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🛒 السلة</div>
        </div>
        <div style={{ padding: 16, marginTop: 40 }}>
          <EmptyState icon="🛒" title="السلة فارغة" description="لم تضف أي منتجات بعد" actionLabel="تصفح المتاجر" actionHref="/stores" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🛒 السلة ({totals.count})</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 }}>{Object.keys(byProvider).length} متجر</div>
        </div>
        <button onClick={handleClear} style={{ background: 'rgba(220,38,38,.2)', color: '#fff', border: '1px solid rgba(220,38,38,.4)', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ مسح</button>
      </div>

      {/* Cart by Provider */}
      <div style={{ padding: 16 }}>
        {Object.entries(byProvider).map(([provider, items]) => {
          const providerTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
          return (
            <div key={provider} style={{ background: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 18 }}>🏪</div>
                <Link href={`/store/${encodeURIComponent(provider)}`} style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', textDecoration: 'none' }}>{provider}</Link>
              </div>
              {items.map(item => (
                <div key={`${item.id}-${provider}`} style={{ display: 'flex', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f8fafc' }}>
                  {item.image ? (
                    <img src={item.image} alt={item.title} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>📦</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/product/${item.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    </Link>
                    <div style={{ fontSize: 12, color: '#0f4d3a', fontWeight: 900, marginBottom: 8 }}>{item.price.toLocaleString()} {item.currency || 'SYP'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 8 }}>
                        <button onClick={() => changeQty(item.id, provider, item.qty - 1)} style={{ width: 32, height: 32, background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>−</button>
                        <div style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: 900 }}>{item.qty}</div>
                        <button onClick={() => changeQty(item.id, provider, item.qty + 1)} style={{ width: 32, height: 32, background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>+</button>
                      </div>
                      <button onClick={() => removeItem(item.id, provider)} style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingTop: 4 }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>مجموع المتجر</span>
                <span style={{ color: '#0f4d3a', fontWeight: 900 }}>{providerTotal.toLocaleString()} {totals.currency}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ margin: '0 16px', background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>📋 ملخص الطلب</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: '#64748b' }}>المجموع الفرعي</span>
          <span style={{ fontWeight: 800 }}>{totals.subtotal.toLocaleString()} {totals.currency}</span>
        </div>
        {totals.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: '#10b981' }}>
            <span>الخصم</span>
            <span style={{ fontWeight: 800 }}>− {totals.discount.toLocaleString()} {totals.currency}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, paddingTop: 12, borderTop: '2px solid #e5e7eb' }}>
          <span>المجموع</span>
          <span style={{ color: '#0f4d3a' }}>{totals.total.toLocaleString()} {totals.currency}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: 12, boxShadow: '0 -4px 12px rgba(0,0,0,.05)' }}>
        <Link href="/checkout" style={{ display: 'block', width: '100%', padding: 16, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontWeight: 900, fontSize: 15, boxShadow: '0 4px 12px rgba(16,185,129,.3)' }}>
          ✓ إتمام الطلب · {totals.total.toLocaleString()} {totals.currency}
        </Link>
      </div>
    </div>
  );
}
