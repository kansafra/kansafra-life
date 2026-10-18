'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { notifyNewOrder } from '@/lib/notify';
import CustomerAuthModal from '@/components/CustomerAuthModal';
import { getCustomer, saveGuestSession } from '@/lib/customerAuth';
import { getCart, clearCart, cartTotals, getCartByProvider } from '@/lib/cart';

const genCode = () => {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${yy}${mm}${dd}-${rand}`;
};

export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [totals, setTotals] = useState({ count:0, subtotal:0, total:0, discount:0, currency:'SYP' });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doneCode, setDoneCode] = useState('');
  const [doneOrderId, setDoneOrderId] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('cash');

  useEffect(() => {
    setCart(getCart());
    setTotals(cartTotals());
  }, []);

  useEffect(() => {
    const c = getCustomer();
    if (c) {
      setCustomer(c);
      setName(c.full_name || '');
      setPhone(c.phone || '');
      setAddress(c.address || '');
    }
  }, []);

  useEffect(() => {
    async function loadPaymentMethods() {
      if (!supabase) return;
      const { data } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (Array.isArray(data)) setPaymentMethods(data);
    }
    loadPaymentMethods();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim() || name.trim().length < 3) { setError('الاسم مطلوب'); return; }
    if (!phone.trim() || phone.trim().length < 9) { setError('رقم الهاتف مطلوب'); return; }
    
    // إذا لا يوجد حساب — نطلب واحد
    if (!customer) {
      saveGuestSession({ full_name: name.trim(), phone: phone.trim(), address: address.trim() });
      setShowAuthModal(true);
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) { setError('رقم الهاتف مطلوب'); return; }
    if (cart.length === 0) { setError('السلة فارغة'); return; }
    if (!supabase) { setError('قاعدة البيانات غير متصلة'); return; }

    setLoading(true);

    const byProvider = getCartByProvider();
    const providers = Object.keys(byProvider);
    const firstCode = genCode();
    let firstOrderId = null;

    for (let i = 0; i < providers.length; i++) {
      const prov = providers[i];
      const items = byProvider[prov];
      const subtotal = items.reduce((s, x) => s + (x.original_price || x.price) * x.qty, 0);
      const total = items.reduce((s, x) => s + x.price * x.qty, 0);
      const discount = subtotal - total;
      const code = i === 0 ? firstCode : genCode();

      // نجيب رقم هاتف التاجر
      let providerPhone = null;
      let providerLogo = null;
      try {
        const { data: entData } = await supabase
          .from('entities')
          .select('phone, logo_url')
          .eq('display_name', prov)
          .maybeSingle();
        providerPhone = entData?.phone || null;
        providerLogo = entData?.logo_url || null;
      } catch {}

      const { data, error: err } = await supabase.from('orders').insert({
        order_code: code,
        provider_name: prov,
        payment_method: selectedPayment,
        provider_phone: providerPhone,
        provider_logo: providerLogo,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_address: address.trim() || null,
        items: items,
        subtotal, discount, total,
        currency: items[0]?.currency || 'SYP',
        status: 'new',
        notes: notes.trim() || null,
      }).select('id').single();

      if (err) {
        console.error(err);
        setError('تعذّر: ' + (err.message || JSON.stringify(err)));
        setLoading(false);
        return;
      }
      if (i === 0) firstOrderId = data?.id;
    }

    setLoading(false);
    clearCart();
    // ═══ إشعار للتاجر ═══
    try {
      if (providers.length > 0) {
        await notifyNewOrder(providers[0], firstCode, name.trim());
      }
    } catch (e) { console.warn('notify failed:', e); }
    setDoneCode(firstCode);
    setDoneOrderId(firstOrderId || '');
    // ⚠️ ما نوجّه للفاتورة تلقائياً — ننتظر التاجر
  }

  if (cart.length === 0 && !doneCode) {
    return (
      <div className="store-page">
        <header className="prod-header">
          <Link href="/" className="prod-back">→</Link>
          <span className="prod-header-title">إتمام الطلب</span>
        </header>
        <div className="ol-empty-state" style={{ padding: 80 }}>
          <span className="em">🛒</span>
          <p>سلتك فارغة</p>
        </div>
      </div>
    );
  }

  if (doneCode) {
    return (
      <div className="new-prod-page">
        <div className="new-service-success">
          <div className="chk-circle">✓</div>
          <h2>تم إرسال طلبك</h2>
          <p>رقم الطلب: <strong style={{ fontFamily:'monospace', direction:'ltr', display:'inline-block' }}>{doneCode}</strong></p>
          <p style={{ fontSize: 13, color: '#f59e0b', fontWeight: 800, marginTop: 8 }}>
            ⏳ طلبك قيد المراجعة من التاجر
          </p>
          <p style={{ fontSize: 12, color: 'var(--n-400)', lineHeight: 1.7 }}>
            سيتم تجهيز طلبك قريباً، وتقدر تتابع الحالة من زر التتبع.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24, maxWidth: 340, margin: '24px auto 0' }}>
            <Link
              href={doneOrderId ? `/order/${doneOrderId}` : '/'}
              style={{
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 900,
                textDecoration: 'none',
                textAlign: 'center'
              }}
            >
              📦 تتبع الطلب
            </Link>
            <Link
              href="/"
              style={{
                padding: '12px 24px',
                background: 'rgba(255,255,255,.06)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.15)',
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
                textAlign: 'center'
              }}
            >
              🏠 العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="store-page">
      <header className="prod-header">
        <Link href="/" className="prod-back">→</Link>
        <span className="prod-header-title">إتمام الطلب</span>
      </header>

      <form className="checkout-form" onSubmit={submit}>

        <div className="checkout-summary">
          {cart.map((it) => (
            <div key={it.id} className="checkout-summary-row">
              <span>{it.qty}× {it.title}</span>
              <span>{(it.price * it.qty).toLocaleString()} {it.currency}</span>
            </div>
          ))}
          {totals.discount > 0 && (
            <div className="checkout-summary-row" style={{ color:'#16a34a' }}>
              <span>الخصم</span>
              <span>− {totals.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="checkout-summary-row total">
            <span>المجموع</span>
            <span>{totals.total.toLocaleString()} {totals.currency}</span>
          </div>
        </div>

        <div className="new-service-field">
          <label className="new-service-label">الاسم الكامل <span className="req">*</span></label>
          <input className="new-service-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="محمد أحمد علي" />
        </div>

        <div className="new-service-field">
          <label className="new-service-label">رقم الهاتف <span className="req">*</span></label>
          <input className="new-service-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09XXXXXXXX" />
        </div>

        <div className="new-service-field">
          <label className="new-service-label">العنوان</label>
          <input className="new-service-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="الحي — كنصفرة" />
        </div>

        <div className="new-service-field">
          <label className="new-service-label">ملاحظات</label>
          <textarea className="new-service-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أي تفاصيل إضافية..." />
        </div>

        {error && <div style={{ padding:14, background:'rgba(220,38,38,.14)', border:'1px solid rgba(220,38,38,.35)', borderRadius:14, color:'#dc2626', fontSize:13, fontWeight:600 }}>{error}</div>}

        {paymentMethods.length > 0 && (
          <div className="new-service-field" style={{ marginTop: 16 }}>
            <label className="new-service-label">💳 طريقة الدفع</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setSelectedPayment(pm.method_type)}
                  style={{
                    padding: 12,
                    background: selectedPayment === pm.method_type ? 'rgba(34,197,94,.15)' : 'rgba(255,255,255,.04)',
                    border: selectedPayment === pm.method_type ? '2px solid #22c55e' : '1px solid rgba(255,255,255,.1)',
                    borderRadius: 12,
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{pm.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, textAlign: 'center' }}>{pm.name_ar}</span>
                </button>
              ))}
            </div>
            {paymentMethods.find((p) => p.method_type === selectedPayment)?.instructions && (
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, lineHeight: 1.6, padding: 10, background: 'rgba(148,163,184,.08)', borderRadius: 10 }}>
                ℹ️ {paymentMethods.find((p) => p.method_type === selectedPayment)?.instructions}
              </div>
            )}
          </div>
        )}

        <button className="new-service-submit" type="submit" disabled={loading}>
          {loading ? '... جارٍ الإرسال' : '✓ تأكيد الطلب'}
        </button>
      </form>

      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(c) => {
          setCustomer(c);
          setName(c.full_name || '');
          setPhone(c.phone || '');
          setAddress(c.address || '');
          setShowAuthModal(false);
          // نكمل العملية بعد ثانية
          setTimeout(() => {
            document.querySelector('form')?.requestSubmit?.();
          }, 300);
        }}
        defaultPhone={phone}
        defaultName={name}
      />
    </div>
  );
}
