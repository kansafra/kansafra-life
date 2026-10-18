'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCart, getCartByProvider, clearCart, cartTotals } from '@/lib/cart';
import { useToast } from '@/components/Toast';
import ImageUploader from '@/components/ImageUploader';

export default function CheckoutPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();

  const [cart, setCart] = useState([]);
  const [totals, setTotals] = useState({ count: 0, subtotal: 0, total: 0, discount: 0, currency: 'SYP' });
  const [customer, setCustomer] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentObj, setSelectedPaymentObj] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    let c = null;
    try { c = JSON.parse(localStorage.getItem('sanad_customer') || 'null'); } catch {}
    if (c) {
      setCustomer(c);
      setForm({ name: c.name || c.full_name || '', phone: c.phone || '', address: c.address || '', notes: '' });
    }
    refresh();
    loadPaymentMethods();
    if (c?.phone) loadAddresses(c.phone);
  }, []);

  function refresh() {
    setCart(getCart());
    setTotals(cartTotals());
  }

  async function loadPaymentMethods() {
    if (!supabase) return;
    const { data } = await supabase.from('payment_methods').select('*').eq('is_active', true).order('sort_order');
    setPaymentMethods(data || []);
    if (data && data.length > 0) setSelectedPaymentObj(data[0]);
  }

  async function loadAddresses(phone) {
    if (!supabase) return;
    const { data } = await supabase.from('customer_addresses').select('*').eq('customer_phone', phone).order('is_default', { ascending: false });
    setAddresses(data || []);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 3) { tE('الاسم مطلوب'); return; }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 9) { tE('رقم الهاتف مطلوب'); return; }
    if (cart.length === 0) { tE('السلة فارغة'); return; }

    setLoading(true);
    try {
      const byProvider = getCartByProvider();
      const providers = Object.keys(byProvider);
      const firstCode = 'SN' + Date.now().toString().slice(-8);
      let firstOrderId = null;
      const createdOrders = [];

      for (let i = 0; i < providers.length; i++) {
        const prov = providers[i];
        const items = byProvider[prov];
        const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
        const total = subtotal;
        const code = i === 0 ? firstCode : 'SN' + (Date.now() + i).toString().slice(-8);

        // بيانات المتجر
        let providerPhone = null;
        let providerLogo = null;
        try {
          const { data: ent } = await supabase.from('entities').select('phone, logo_url').eq('display_name', prov).maybeSingle();
          providerPhone = ent?.phone || null;
          providerLogo = ent?.logo_url || null;
        } catch {}

        const payload = {
          order_code: code,
          provider_name: prov,
          customer_name: form.name.trim(),
          customer_phone: form.phone.trim(),
          customer_address: form.address.trim() || null,
          items,
          subtotal,
          discount: 0,
          total,
          currency: items[0]?.currency || 'SYP',
          status: 'new',
          notes: form.notes.trim() || null,
          provider_phone: providerPhone,
          provider_logo: providerLogo,
          payment_method: selectedPaymentObj?.name_ar || 'نقدي',
          payment_method_id: selectedPaymentObj?.id || null,
          payment_method_details: selectedPaymentObj ? {
            id: selectedPaymentObj.id,
            name_ar: selectedPaymentObj.name_ar,
            method_type: selectedPaymentObj.method_type,
            details: selectedPaymentObj.details,
            instructions: selectedPaymentObj.instructions,
            barcode_image_url: selectedPaymentObj.barcode_image_url,
            icon: selectedPaymentObj.icon,
          } : null,
          payment_proof_url: proofUrl || null,
        };

        const { data, error } = await supabase.from('orders').insert(payload).select('id, order_code').single();
        if (error) throw error;
        if (i === 0) firstOrderId = data?.id;
        createdOrders.push(data);
      }

      clearCart();
      setDone({ orderId: firstOrderId, code: firstCode, count: createdOrders.length });
      success('✅ تم إرسال الطلبات');
    } catch (e) {
      tE('تعذّر: ' + (e.message || 'خطأ'));
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0a1f16,#061410)', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, padding: 32, textAlign: 'center', maxWidth: 420, width: '100%' }}>
          <div style={{ width: 80, height: 80, margin: '0 auto 20px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#fff' }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>تم إرسال طلبك!</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', marginBottom: 8 }}>رقم الطلب</p>
          <p style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 900, color: '#fbbf24', direction: 'ltr', marginBottom: 24 }}>{done.code}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginBottom: 24 }}>
            سيتم التواصل معك قريباً لتأكيد الطلب.<br/>تابع حالة الطلب من "طلباتي".
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href={done.orderId ? `/order/${done.orderId}` : '/customer/orders'} style={{ padding: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontWeight: 900, fontSize: 14 }}>
              📦 تتبع الطلب
            </Link>
            <Link href="/" style={{ padding: 12, background: 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontWeight: 800, fontSize: 13 }}>
              ← العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16 }}>
        <div style={{ background: '#0f4d3a', margin: -16, padding: 20, marginBottom: 20 }}>
          <Link href="/cart" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
        </div>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🛒</div>
          <p style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 16 }}>سلتك فارغة</p>
          <Link href="/stores" style={{ display: 'inline-block', padding: '12px 24px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 900 }}>تصفح المتاجر</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/cart" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>💳 إتمام الطلب</div>
      </div>

      <form onSubmit={submit} style={{ padding: 16 }}>
        {/* بيانات المستلم */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#0f4d3a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>1</span>
            بيانات المستلم
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الاسم الكامل *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم الكامل" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>رقم الهاتف *</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09XXXXXXXX" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', direction: 'ltr', textAlign: 'right' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>العنوان</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="الحي — المدينة" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            {addresses.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                {addresses.map(a => (
                  <button key={a.id} type="button" onClick={() => setForm({ ...form, address: a.address })} style={{ padding: '6px 10px', background: '#f1f5f9', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>📍 {a.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* طرق الدفع */}
        {paymentMethods.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#0f4d3a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>2</span>
              طريقة الدفع
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {paymentMethods.map(pm => (
                <button key={pm.id} type="button" onClick={() => setSelectedPaymentObj(pm)} style={{ padding: 12, background: selectedPaymentObj?.id === pm.id ? 'rgba(16,185,129,.1)' : '#f8fafc', border: `2px solid ${selectedPaymentObj?.id === pm.id ? '#10b981' : '#e5e7eb'}`, borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 24 }}>{pm.icon || '💳'}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#334155', textAlign: 'center' }}>{pm.name_ar}</span>
                </button>
              ))}
            </div>

            {/* تفاصيل الطريقة المختارة */}
            {selectedPaymentObj && (selectedPaymentObj.details || selectedPaymentObj.barcode_image_url) && (
              <div style={{ marginTop: 14, padding: 14, background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1px solid #10b981', borderRadius: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#065f46', marginBottom: 10 }}>📋 تفاصيل الدفع</div>
                {selectedPaymentObj.details && (
                  <div style={{ padding: 12, background: '#fff', border: '2px dashed #10b981', borderRadius: 8, fontFamily: 'monospace', fontSize: 16, fontWeight: 900, color: '#065f46', textAlign: 'center', direction: 'ltr', marginBottom: 10, letterSpacing: 1 }}>
                    {selectedPaymentObj.details}
                  </div>
                )}
                {selectedPaymentObj.barcode_image_url && (
                  <div style={{ textAlign: 'center', marginBottom: 10 }}>
                    <img src={selectedPaymentObj.barcode_image_url} alt="barcode" style={{ maxWidth: 220, borderRadius: 10, border: '1px solid #10b981', background: '#fff', padding: 6 }} />
                  </div>
                )}
                {selectedPaymentObj.instructions && (
                  <div style={{ padding: 10, background: 'rgba(255,255,255,.6)', borderRadius: 8, fontSize: 11.5, color: '#065f46', lineHeight: 1.6 }}>💡 {selectedPaymentObj.instructions}</div>
                )}
              </div>
            )}

            {/* رفع إيصال */}
            {selectedPaymentObj && selectedPaymentObj.method_type !== 'cash' && (
              <div style={{ marginTop: 14, padding: 14, background: 'rgba(59,130,246,.05)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#1e40af', marginBottom: 10 }}>📸 إيصال التحويل (اختياري)</div>
                <ImageUploader label="ارفع صورة الإيصال" folder="payment-proofs" value={proofUrl} onUpload={(url) => setProofUrl(url)} />
              </div>
            )}
          </div>
        )}

        {/* ملاحظات */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>📝 ملاحظات (اختياري)</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="أي تفاصيل إضافية..." style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} />
        </div>

        {/* ملخص */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>📋 ملخص الطلب</div>
          {cart.map(item => (
            <div key={`${item.id}-${item.provider_name}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', color: '#334155' }}>
              <span>{item.qty}× {item.title}</span>
              <span style={{ fontWeight: 800 }}>{(item.price * item.qty).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, paddingTop: 12, marginTop: 8, borderTop: '2px solid #e5e7eb' }}>
            <span>المجموع</span>
            <span style={{ color: '#0f4d3a' }}>{totals.total.toLocaleString()} {totals.currency}</span>
          </div>
        </div>
      </form>

      {/* Submit */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: 12, boxShadow: '0 -4px 12px rgba(0,0,0,.05)' }}>
        <button onClick={submit} disabled={loading} style={{ width: '100%', padding: 16, background: loading ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 900, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(16,185,129,.3)' }}>
          {loading ? '... جارٍ الإرسال' : `✓ تأكيد الطلب · ${totals.total.toLocaleString()} ${totals.currency}`}
        </button>
      </div>
    </div>
  );
}
