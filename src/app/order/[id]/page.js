'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const STATUS_FLOW = ['new', 'preparing', 'delivering', 'done'];
const STATUS_INFO = {
  new: { label: 'جديد', icon: '🆕', color: '#3b82f6' },
  preparing: { label: 'قيد التحضير', icon: '👨‍🍳', color: '#f59e0b' },
  delivering: { label: 'قيد التوصيل', icon: '🚚', color: '#8b5cf6' },
  done: { label: 'مكتمل', icon: '✅', color: '#10b981' },
  cancelled: { label: 'ملغي', icon: '❌', color: '#ef4444' },
};

export default function OrderTracking() {
  const router = useRouter();
  const params = useParams();
  const { success, error: tE } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) load(params.id);
    // تحديث تلقائي كل 15 ثانية
    const interval = setInterval(() => { if (params?.id) load(params.id, true); }, 15000);
    return () => clearInterval(interval);
  }, [params?.id]);

  async function load(id, silent = false) {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      if (data) setOrder(data);
    } catch (e) { if (!silent) tE('تعذّر'); }
    if (!silent) setLoading(false);
  }

  function callProvider() {
    if (!order?.provider_phone) { tE('لا يوجد رقم'); return; }
    window.location.href = `tel:${order.provider_phone}`;
  }

  function whatsapp() {
    if (!order?.provider_phone) { tE('لا يوجد رقم'); return; }
    const clean = String(order.provider_phone).replace(/\D/g, '');
    const phone = clean.startsWith('0') ? '963' + clean.slice(1) : clean;
    const msg = `مرحباً، بخصوص طلبي #${order.order_code}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  async function cancelOrder() {
    if (!confirm('إلغاء الطلب؟')) return;
    try {
      const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
      if (error) throw error;
      success('تم إلغاء الطلب');
      setOrder({ ...order, status: 'cancelled' });
    } catch (e) { tE('تعذّر'); }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>الطلب غير موجود</div>
          <Link href="/" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 800, marginTop: 16 }}>← الرئيسية</Link>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const isDone = order.status === 'done';
  const info = STATUS_INFO[order.status] || STATUS_INFO.new;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${info.color}, ${info.color}dd)`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>تتبع الطلب</div>
          <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 12, fontFamily: 'monospace', marginTop: 2, direction: 'ltr', textAlign: 'right' }}>#{order.order_code}</div>
        </div>
        <div style={{ fontSize: 32 }}>{info.icon}</div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Status Banner */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{info.icon}</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: info.color, marginBottom: 4 }}>{info.label}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {isDone ? 'تم استلام طلبك بنجاح 🎉' : isCancelled ? 'تم إلغاء هذا الطلب' : 'جارٍ معالجة طلبك'}
          </div>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 8 }}>
              {STATUS_FLOW.map((step, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <div key={step} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', marginBottom: 8,
                        background: done ? info.color : '#e5e7eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, color: done ? '#fff' : '#94a3b8', fontWeight: 900,
                        boxShadow: active ? `0 0 0 4px ${info.color}20` : 'none',
                        zIndex: 2,
                      }}>
                        {done ? '✓' : STATUS_INFO[step].icon}
                      </div>
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: done ? '#0f172a' : '#94a3b8' }}>
                      {STATUS_INFO[step].label}
                    </div>
                  </div>
                );
              })}
              {/* Line */}
              <div style={{
                position: 'absolute', top: 20, left: '12.5%', right: '12.5%',
                height: 3, background: '#e5e7eb', zIndex: 1,
              }}>
                <div style={{
                  width: `${(currentIdx / (STATUS_FLOW.length - 1)) * 100}%`,
                  height: '100%', background: info.color, transition: 'width .5s',
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>🛍️ المنتجات</div>
          {(order.items || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < order.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{item.title}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.qty} × {Number(item.price).toLocaleString()} {item.currency || 'SYP'}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f4d3a' }}>{(item.price * item.qty).toLocaleString()}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, paddingTop: 14, marginTop: 8, borderTop: '2px solid #e5e7eb' }}>
            <span>المجموع</span>
            <span style={{ color: '#0f4d3a' }}>{Number(order.total).toLocaleString()} {order.currency || 'SYP'}</span>
          </div>
        </div>

        {/* Payment Details */}
        {order.payment_method_details && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>💳 طريقة الدفع</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 28 }}>{order.payment_method_details.icon || '💳'}</div>
              <div style={{ fontSize: 14, fontWeight: 900 }}>{order.payment_method_details.name_ar}</div>
            </div>
            {order.payment_method_details.details && (
              <div style={{ padding: 12, background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 10, fontFamily: 'monospace', fontSize: 15, fontWeight: 900, textAlign: 'center', direction: 'ltr', color: '#0f4d3a', marginBottom: 10 }}>
                {order.payment_method_details.details}
              </div>
            )}
            {order.payment_method_details.barcode_image_url && (
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <img src={order.payment_method_details.barcode_image_url} alt="barcode" style={{ maxWidth: 200, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', padding: 6 }} />
              </div>
            )}
            {order.payment_proof_url && (
              <div style={{ padding: 10, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 8, fontSize: 12, color: '#10b981', textAlign: 'center', fontWeight: 800 }}>
                ✅ تم إرفاق إيصال التحويل
              </div>
            )}
          </div>
        )}

        {/* Provider Info */}
        {order.provider_name && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>🏪 المتجر</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              {order.provider_logo ? (
                <img src={order.provider_logo} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏪</div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{order.provider_name}</div>
                {order.provider_phone && <div style={{ fontSize: 11, color: '#64748b', direction: 'ltr', textAlign: 'right', marginTop: 2 }}>📞 {order.provider_phone}</div>}
              </div>
            </div>
            {order.provider_phone && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={callProvider} style={{ flex: 1, padding: 12, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📞 اتصال</button>
                <button onClick={whatsapp} style={{ flex: 1, padding: 12, background: 'rgba(37,211,102,.1)', color: '#059669', border: '1px solid rgba(37,211,102,.3)', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📱 واتساب</button>
              </div>
            )}
          </div>
        )}

        {/* Customer Info */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>📍 عنوان التوصيل</div>
          <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 800, marginBottom: 4 }}>{order.customer_name}</div>
          <div style={{ fontSize: 12, color: '#64748b', direction: 'ltr', textAlign: 'right', marginBottom: 4 }}>{order.customer_phone}</div>
          {order.customer_address && <div style={{ fontSize: 12, color: '#64748b' }}>🏠 {order.customer_address}</div>}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isDone && (
            <Link href={`/invoice/${order.id}`} style={{ padding: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontWeight: 900, fontSize: 14 }}>
              🧾 عرض الفاتورة
            </Link>
          )}
          {!isDone && !isCancelled && currentIdx < 2 && (
            <button onClick={cancelOrder} style={{ padding: 12, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✕ إلغاء الطلب
            </button>
          )}
        </div>

        {/* Auto refresh indicator */}
        {!isDone && !isCancelled && (
          <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 16 }}>
            🔄 الصفحة تتحدث تلقائياً كل 15 ثانية
          </div>
        )}
      </div>
    </div>
  );
}
