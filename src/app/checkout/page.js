'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCart, cartTotals, clearCart } from '@/lib/cart';
import { useToast } from '@/components/Toast';
import { notifyEntity } from '@/lib/notify';

export default function CheckoutPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [totals, setTotals] = useState({ count: 0, subtotal: 0, total: 0, currency: 'SYP' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [merchantPayments, setMerchantPayments] = useState({
    accepts_cash: true,
    accepts_transfer: false,
    accepts_wallet: false,
    bank_account_info: null,
    wallet_number: null,
  });

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      if (c) {
        setCustomer(c);
        setPhone(c.phone || '');
        setAddress(c.address || '');
        setName(c.name || '');
      }
    } catch {}

    const currentCart = getCart();
    if (currentCart.length === 0) { router.push('/cart'); return; }
    setCart(currentCart);
    setTotals(cartTotals());
    setLoading(false);
  }, [router]);

  const byProvider = useMemo(() => {
    const map = {};
    cart.forEach(item => {
      const prov = item.provider_name || 'متجر';
      if (!map[prov]) map[prov] = { items: [], entityId: item.provider_id };
      map[prov].items.push(item);
    });
    return map;
  }, [cart]);

  const providerCount = Object.keys(byProvider).length;
  const deliveryTotal = providerCount * 2;

  useEffect(() => {
    async function loadPayments() {
      if (!supabase || providerCount === 0) return;
      try {
        const entityIds = Object.values(byProvider).map(p => p.entityId).filter(Boolean);
        if (entityIds.length === 0) return;
        const { data } = await supabase.from('entities')
          .select('accepts_cash, accepts_transfer, accepts_wallet, bank_account_info, wallet_number')
          .in('id', entityIds);
        if (data && data.length > 0) {
          const all = {
            accepts_cash: data.every(e => e.accepts_cash !== false),
            accepts_transfer: data.every(e => e.accepts_transfer === true),
            accepts_wallet: data.every(e => e.accepts_wallet === true),
            bank_account_info: data.find(e => e.accepts_transfer)?.bank_account_info || null,
            wallet_number: data.find(e => e.accepts_wallet)?.wallet_number || null,
          };
          setMerchantPayments(all);
          if (!all.accepts_cash && all.accepts_transfer) setPaymentMethod('bank');
          else if (!all.accepts_cash && all.accepts_wallet) setPaymentMethod('wallet');
          else setPaymentMethod('cod');
        }
      } catch (err) { console.error(err); }
    }
    loadPayments();
  }, [byProvider, providerCount]);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const { data: coupon } = await supabase.from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
      
      if (!coupon) { setCouponError('كود غير صحيح أو غير مفعّل'); return; }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) { setCouponError('انتهت صلاحية الكود'); return; }
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) { setCouponError('تم استنفاد الكود'); return; }
      if (coupon.min_order_amount && totals.subtotal < coupon.min_order_amount) {
        setCouponError(`الحد الأدنى: ${Number(coupon.min_order_amount).toLocaleString()} ل.س`);
        return;
      }
      const providerNames = Object.keys(byProvider);
      if (!providerNames.includes(coupon.provider_name)) {
        setCouponError('الكود لا ينطبق على متاجر هذه السلة');
        return;
      }
      setAppliedCoupon(coupon);
      success('✅ تم تطبيق الكود');
    } catch (err) {
      setCouponError('حدث خطأ، حاول مجدداً');
    } finally { setValidatingCoupon(false); }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  }

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percentage') {
      return Math.round(totals.subtotal * Number(appliedCoupon.discount_value) / 100);
    }
    return Math.min(Number(appliedCoupon.discount_value), totals.subtotal);
  }, [appliedCoupon, totals.subtotal]);

  const grandTotal = totals.subtotal - discountAmount + deliveryTotal;

  function handlePreview(e) {
    e.preventDefault();
    if (!name.trim()) { toastError('أدخل اسمك'); return; }
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 8) { toastError('رقم الهاتف غير صحيح'); return; }
    if (!address.trim()) { toastError('أدخل عنوانك'); return; }
    if (paymentMethod === 'bank' && !merchantPayments.accepts_transfer) { toastError('التحويل البنكي غير متاح'); return; }
    if (paymentMethod === 'wallet' && !merchantPayments.accepts_wallet) { toastError('المحفظة غير متاحة'); return; }
    setShowPreview(true);
  }

  async function handleConfirmOrder() {
    setSubmitting(true);
    try {
      let customerId = customer?.id || null;
      if (!customerId) {
        const normalizedPhone = phone.replace(/[^0-9]/g, '');
        const { data: found } = await supabase.from('customers').select('id, name, phone, address').eq('phone', normalizedPhone).maybeSingle();
        if (found) {
          customerId = found.id;
          localStorage.setItem('sanad_customer', JSON.stringify(found));
        } else {
          const { data: newCust, error: custErr } = await supabase.from('customers').insert({
            name, phone: normalizedPhone, address, is_guest: true,
          }).select('id, name, phone, address').single();
          if (custErr) throw custErr;
          customerId = newCust.id;
          localStorage.setItem('sanad_customer', JSON.stringify(newCust));
        }
      } else {
        await supabase.from('customers').update({ name, address }).eq('id', customerId);
      }

      const masterOrderId = crypto.randomUUID();
      const ordersToInsert = [];

      Object.entries(byProvider).forEach(([providerName, data]) => {
        const providerSubtotal = data.items.reduce((s, i) => s + i.price * i.qty, 0);
        let providerDiscount = 0;
        if (appliedCoupon && providerName === appliedCoupon.provider_name) {
          if (appliedCoupon.discount_type === 'percentage') {
            providerDiscount = Math.round(providerSubtotal * Number(appliedCoupon.discount_value) / 100);
          } else {
            providerDiscount = Math.min(Number(appliedCoupon.discount_value), providerSubtotal);
          }
        }
        ordersToInsert.push({
          master_order_id: masterOrderId,
          customer_id: customerId,
          entity_id: data.entityId || null,
          provider_name: providerName,
          customer_name: name,
          customer_phone: phone.replace(/[^0-9]/g, ''),
          customer_address: address,
          items: data.items,
          subtotal: providerSubtotal,
          discount: providerDiscount,
          delivery_fee: 2,
          total: providerSubtotal - providerDiscount + 2,
          currency: totals.currency || 'SYP',
          status: 'pending',
          payment_method: paymentMethod,
          notes,
          order_code: 'ORD-' + Math.floor(Math.random() * 1000000),
        });
      });

      const { data: inserted, error } = await supabase.from('orders').insert(ordersToInsert).select('id, entity_id, order_code, total, currency');
      if (error) throw error;

      if (inserted) {
        await Promise.all(inserted.map(async (ord) => {
          if (ord.entity_id) {
            try {
              await notifyEntity(ord.entity_id, '🛒 طلب جديد', `طلب #${ord.order_code} من ${name} بقيمة ${ord.total} ${ord.currency}`, '/merchant/orders', '🛒');
            } catch {}
          }
        }));
      }

      if (appliedCoupon) {
        await supabase.from('coupons').update({ used_count: (Number(appliedCoupon.used_count) || 0) + 1 }).eq('id', appliedCoupon.id);
      }

      success('✅ تم استلام طلبك بنجاح!');
      clearCart();
      setShowPreview(false);
      router.push(`/order/${masterOrderId}`);
    } catch (err) {
      console.error(err);
      toastError('فشل إرسال الطلب: ' + (err.message || 'حاول مجدداً'));
    } finally { setSubmitting(false); }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳ جارٍ التحضير...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>→</button>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>💳 إتمام الطلب</div>
      </div>

      <form onSubmit={handlePreview} style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, marginTop: 0, marginBottom: 16 }}>👤 بيانات المستلم</h2>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>الاسم الكامل *</label>
            <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} placeholder="اسمك الكامل" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>رقم الهاتف *</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={inputStyle} placeholder="09xxxxxxxx" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>العنوان التفصيلي *</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} required rows={3} style={{ ...inputStyle, resize: 'none' }} placeholder="الحي، الشارع، رقم البناء..." />
          </div>
          <div>
            <label style={labelStyle}>ملاحظات (اختياري)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} placeholder="أي تفاصيل إضافية للمتجر..." />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, marginTop: 0, marginBottom: 12 }}>🎟️ كود الخصم</h2>
          {!appliedCoupon ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }} placeholder="أدخل الكود" style={{ ...inputStyle, flex: 1, letterSpacing: 2, fontWeight: 900 }} />
              <button type="button" onClick={applyCoupon} disabled={validatingCoupon || !couponCode.trim()} style={{ background: validatingCoupon || !couponCode.trim() ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', padding: '0 20px', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: validatingCoupon || !couponCode.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {validatingCoupon ? '⏳' : 'تطبيق'}
              </button>
            </div>
          ) : (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>{appliedCoupon.code}</div>
                <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                  {appliedCoupon.discount_type === 'percentage' ? `خصم ${appliedCoupon.discount_value}% (-${discountAmount.toLocaleString()} ل.س)` : `خصم ${Number(appliedCoupon.discount_value).toLocaleString()} ل.س`}
                </div>
              </div>
              <button type="button" onClick={removeCoupon} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✕ إزالة</button>
            </div>
          )}
          {couponError && <div style={{ marginTop: 8, fontSize: 11, color: '#ef4444', fontWeight: 800 }}>⚠️ {couponError}</div>}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, marginTop: 0, marginBottom: 16 }}>💳 طريقة الدفع</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {merchantPayments.accepts_cash && (
              <PaymentOption active={paymentMethod === 'cod'} onClick={() => setPaymentMethod('cod')} icon="💵" title="الدفع عند الاستلام" desc="ادفع نقداً عند وصول الطلب" color="#10b981" />
            )}
            {merchantPayments.accepts_transfer && (
              <PaymentOption active={paymentMethod === 'bank'} onClick={() => setPaymentMethod('bank')} icon="🏦" title="تحويل بنكي" desc={merchantPayments.bank_account_info || 'تواصل مع المتجر لبيانات الحساب'} color="#0ea5e9" />
            )}
            {merchantPayments.accepts_wallet && (
              <PaymentOption active={paymentMethod === 'wallet'} onClick={() => setPaymentMethod('wallet')} icon="📱" title="محفظة إلكترونية" desc={merchantPayments.wallet_number ? `رقم المحفظة: ${merchantPayments.wallet_number}` : 'سيرياتيل كاش، MTN كاش'} color="#f59e0b" />
            )}
            {!merchantPayments.accepts_cash && !merchantPayments.accepts_transfer && !merchantPayments.accepts_wallet && (
              <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 12 }}>⚠️ لا توجد طرق دفع متاحة — تواصل مع المتجر</div>
            )}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, marginTop: 0, marginBottom: 16 }}>📋 ملخص الفاتورة</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>المجموع ({totals.count} منتج)</span>
            <span style={{ fontWeight: 800 }}>{totals.subtotal.toLocaleString()} {totals.currency}</span>
          </div>
          {appliedCoupon && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#10b981' }}>
              <span>🎟️ الخصم</span>
              <span style={{ fontWeight: 800 }}>- {discountAmount.toLocaleString()} {totals.currency}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>التوصيل ({providerCount} متجر)</span>
            <span style={{ fontWeight: 800 }}>{deliveryTotal} {totals.currency}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '2px dashed #e2e8f0', marginTop: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 900 }}>الإجمالي</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#0f4d3a' }}>{grandTotal.toLocaleString()} {totals.currency}</span>
          </div>
        </div>

        <button type="submit" style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 15, marginTop: 24, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
          📋 معاينة وتأكيد الطلب
        </button>
      </form>

      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderRadius: 20, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', color: '#fff', padding: 20, borderRadius: '20px 20px 0 0' }}>
              <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 700, marginBottom: 4 }}>معاينة الطلب</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{name}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>📱 {phone}</div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 900, marginBottom: 6 }}>📍 العنوان</div>
                <div style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.5 }}>{address}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 900, marginBottom: 6 }}>💳 طريقة الدفع</div>
                <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 800 }}>
                  {paymentMethod === 'cod' && '💵 الدفع عند الاستلام'}
                  {paymentMethod === 'bank' && '🏦 تحويل بنكي'}
                  {paymentMethod === 'wallet' && '📱 محفظة إلكترونية'}
                </div>
              </div>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 900, marginBottom: 10 }}>📦 المنتجات</div>
                {Object.entries(byProvider).map(([prov, data]) => (
                  <div key={prov} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#0f4d3a', marginBottom: 6 }}>🏪 {prov}</div>
                    {data.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 4 }}>
                        <span>• {it.title} × {it.qty}</span>
                        <span style={{ fontWeight: 800 }}>{(it.price * it.qty).toLocaleString()} {totals.currency}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>المجموع الفرعي</span>
                  <span style={{ fontWeight: 800 }}>{totals.subtotal.toLocaleString()} {totals.currency}</span>
                </div>
                {appliedCoupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: '#10b981' }}>
                    <span>🎟️ خصم ({appliedCoupon.code})</span>
                    <span style={{ fontWeight: 800 }}>- {discountAmount.toLocaleString()} {totals.currency}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>التوصيل</span>
                  <span style={{ fontWeight: 800 }}>{deliveryTotal} {totals.currency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px dashed #cbd5e1', fontSize: 16, fontWeight: 900 }}>
                  <span>الإجمالي</span>
                  <span style={{ color: '#0f4d3a' }}>{grandTotal.toLocaleString()} {totals.currency}</span>
                </div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: 12, fontSize: 11, color: '#047857', lineHeight: 1.6, marginBottom: 16 }}>
                ✅ <strong>خصوصيتك محفوظة:</strong> سيصل طلبك فقط للمتاجر التي اشتريت منها.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowPreview(false)} disabled={submitting} style={{ flex: 1, padding: 14, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
                <button onClick={handleConfirmOrder} disabled={submitting} style={{ flex: 2, padding: 14, background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 14, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                  {submitting ? '⏳ جارٍ التأكيد...' : '✓ تأكيد الطلب'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentOption({ active, onClick, icon, title, desc, color }) {
  return (
    <button type="button" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: active ? `2px solid ${color}` : '1px solid #e2e8f0', borderRadius: 12, background: active ? `${color}08` : '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right', width: '100%' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{desc}</div>
      </div>
      {active && <div style={{ color, fontSize: 20 }}>✓</div>}
    </button>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' };
