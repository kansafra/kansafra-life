'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
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

  useEffect(() => {
    setCart(getCart());
    setTotals(cartTotals());
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim() || name.trim().length < 3) { setError('الاسم مطلوب'); return; }
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

      const { data, error: err } = await supabase.from('orders').insert({
        order_code: code,
        provider_name: prov,
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
        setError('تعذّر إرسال الطلب');
        setLoading(false);
        return;
      }
      if (i === 0) firstOrderId = data?.id;
    }

    setLoading(false);
    clearCart();
    setDoneCode(firstCode);

    setTimeout(() => {
      router.push(firstOrderId ? `/invoice/${firstOrderId}` : '/');
    }, 1400);
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
          <h2>تم إرسال الطلب</h2>
          <p>رقم الطلب: <strong style={{ fontFamily:'monospace', direction:'ltr', display:'inline-block' }}>{doneCode}</strong></p>
          <p style={{ fontSize: 12, color: 'var(--n-400)' }}>سيتم توجيهك إلى الفاتورة...</p>
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

        <button className="new-service-submit" type="submit" disabled={loading}>
          {loading ? '... جارٍ الإرسال' : '✓ تأكيد الطلب'}
        </button>
      </form>
    </div>
  );
}
