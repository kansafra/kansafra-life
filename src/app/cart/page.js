
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCart, updateQty, removeFromCart, clearCart, cartTotals } from '@/lib/cart';
import { useToast } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';

export default function CartPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
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
    success('تم حذف المنتج من السلة');
    refresh();
  }

  function handleClear() {
    if (!window.confirm('هل أنت متأكد من مسح السلة بالكامل؟')) return;
    clearCart();
    success('تم مسح السلة');
    refresh();
  }

  function handleCheckout() {
    try {
      const customer = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      if (!customer) {
        router.push('/login?next=/checkout');
      } else {
        router.push('/checkout');
      }
    } catch (e) {
      router.push('/login?next=/checkout');
    }
  }

  const byProvider = useMemo(() => {
    const map = {};
    cart.forEach(item => {
      const prov = item.provider_name || 'متجر غير معروف';
      if (!map[prov]) map[prov] = [];
      map[prov].push(item);
    });
    return map;
  }, [cart]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 24, animation: 'spin 1s linear infinite' }}>⏳</div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
        <Header title="🛒 السلة" />
        <div style={{ padding: '20px 16px', marginTop: 40 }}>
          <EmptyState 
            icon="🛒" 
            title="سلتك فارغة" 
            description="يبدو أنك لم تضف أي منتجات بعد. تصفح المتاجر وابدأ التسوق!" 
            actionLabel="تصفح المتاجر" 
            actionHref="/stores" 
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', position: 'relative' }}>
      <Header title={`🛒 السلة (${totals.count})`} subtitle={`${Object.keys(byProvider).length} متجر`} onClear={handleClear} />

      <div style={{ padding: '16px', paddingBottom: '140px' }}>
        {Object.entries(byProvider).map(([provider, items]) => {
          const providerTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
          
          return (
            <div key={provider} style={{ background: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: 32, height: 32, background: 'rgba(16,185,129,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏪</div>
                <Link href={`/store/${encodeURIComponent(provider)}`} style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', textDecoration: 'none' }}>
                  {provider}
                </Link>
              </div>

              {items.map(item => (
                <div key={`${item.id}-${provider}`} style={{ display: 'flex', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f8fafc' }}>
                  <Link href={`/product/${item.id}`} style={{ flexShrink: 0 }}>
                    {item.image ? (
                      <img src={item.image} alt={item.title} style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                    ) : (
                      <div style={{ width: 72, height: 72, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, border: '1px solid #e2e8f0' }}>📦</div>
                    )}
                  </Link>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <Link href={`/product/${item.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      </Link>
                      <div style={{ fontSize: 13, color: '#0f4d3a', fontWeight: 900 }}>
                        {(item.price * item.qty).toLocaleString()} {item.currency || 'SYP'}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                        <button onClick={() => changeQty(item.id, provider, item.qty - 1)} style={btnQtyStyle}>−</button>
                        <div style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{item.qty}</div>
                        <button onClick={() => changeQty(item.id, provider, item.qty + 1)} style={btnQtyStyle}>+</button>
                      </div>
                      <button onClick={() => removeItem(item.id, provider)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', width: 36, height: 36, borderRadius: 10, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>مجموع {provider}</span>
                <span style={{ fontSize: 14, color: '#0f4d3a', fontWeight: 900 }}>{providerTotal.toLocaleString()} {totals.currency}</span>
              </div>
            </div>
          );
        })}

        <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginTop: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 16, color: '#0f172a' }}>📋 ملخص الطلب</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
            <span style={{ color: '#64748b', fontWeight: 700 }}>المجموع الفرعي</span>
            <span style={{ fontWeight: 800, color: '#1e293b' }}>{totals.subtotal.toLocaleString()} {totals.currency}</span>
          </div>
          
          {totals.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12, color: '#10b981' }}>
              <span style={{ fontWeight: 700 }}>الخصم</span>
              <span style={{ fontWeight: 800 }}>− {totals.discount.toLocaleString()} {totals.currency}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, paddingTop: 16, borderTop: '2px dashed #e2e8f0' }}>
            <span style={{ color: '#0f172a' }}>المجموع الإجمالي</span>
            <span style={{ color: '#0f4d3a' }}>{totals.total.toLocaleString()} {totals.currency}</span>
          </div>
        </div>
      </div>

      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        background: '#fff', 
        borderTop: '1px solid #e2e8f0', 
        padding: '16px', 
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', 
        boxShadow: '0 -10px 30px rgba(0,0,0,0.05)', 
        zIndex: 50 
      }}>
        <button 
          onClick={handleCheckout} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 8, 
            width: '100%', 
            padding: '16px', 
            background: 'linear-gradient(135deg, #10b981, #059669)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 16, 
            fontWeight: 900, 
            fontSize: 16, 
            boxShadow: '0 8px 20px rgba(16,185,129,0.3)', 
            cursor: 'pointer', 
            fontFamily: 'inherit',
            transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span>✓</span>
          <span>إتمام الطلب · {totals.total.toLocaleString()} {totals.currency}</span>
        </button>
      </div>
    </div>
  );
}

function Header({ title, subtitle, onClear }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(15, 77, 58, 0.95)', backdropFilter: 'blur(10px)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>{title}</div>
        {subtitle && <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2, fontWeight: 700 }}>{subtitle}</div>}
      </div>
      {onClear && (
        <button onClick={onClear} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fff', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ مسح</button>
      )}
    </div>
  );
}

const btnQtyStyle = {
  width: 36,
  height: 36,
  background: 'none',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
  fontFamily: 'inherit',
  color: '#0f172a',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
