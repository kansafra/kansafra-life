'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const STATUS_FLOW = ['new', 'preparing', 'delivering', 'done'];

const STATUS_INFO = {
  new:        { label: 'بانتظار موافقة التاجر', icon: '⏳', color: '#f59e0b' },
  preparing:  { label: 'قيد التحضير',           icon: '👨‍🍳', color: '#0ea5e9' },
  delivering: { label: 'يوجد التوصيل',            icon: '🚚', color: '#8b5cf6' },
  done:       { label: 'مكتمل',                 icon: '✅', color: '#22c55e' },
  cancelled:  { label: 'ملغي',                  icon: '❌', color: '#dc2626' },
};


function buildWhatsAppLink(order) {
  if (!order?.provider_phone) return null;
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsText = items.map((it) => `• ${it.qty}× ${it.title} = ${(it.price * it.qty).toLocaleString()} ${it.currency || 'SYP'}`).join('\n');
  const msg = `🛍️ *طلب جديد من سند*\n\n` +
    `📋 رقم الطلب: ${order.order_code}\n\n` +
    `👤 العميل: ${order.customer_name}\n` +
    `📞 الهاتف: ${order.customer_phone}\n` +
    (order.customer_address ? `📍 العنوان: ${order.customer_address}\n` : '') +
    `\n*المنتجات:*\n${itemsText}\n\n` +
    `💰 *المجموع:* ${Number(order.total || 0).toLocaleString()} ${order.currency || 'SYP'}\n` +
    (order.notes ? `\n📝 ملاحظات: ${order.notes}\n` : '') +
    `\n🔗 تتبع: ${typeof window !== 'undefined' ? window.location.origin : ''}/order/${order.id}`;
  return `https://wa.me/${order.provider_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!id) return;
    load();
    // تحديث تلقائي كل 10 ثواني
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [id]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
    setOrder(data);
    setLoading(false);
    setRefreshing(false);
  }

  function manualRefresh() {
    setRefreshing(true);
    load();
  }

  if (loading) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;
  if (!order) return (
    <div className="sect-empty" style={{ padding: 80 }}>
      <span className="em">🔍</span>
      <p>الطلب غير موجود</p>
      <Link href="/" className="mng-btn primary" style={{ marginTop: 16 }}>الرئيسية</Link>
    </div>
  );

  const info = STATUS_INFO[order.status] || STATUS_INFO.new;
  const currentStep = STATUS_FLOW.indexOf(order.status);
  const items = Array.isArray(order.items) ? order.items : [];
  const isDone = order.status === 'done';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/" className="inv-back">→</Link>
        <span className="inv-title">📦 تتبع الطلب</span>
        <button className="icon-btn" onClick={manualRefresh} type="button" aria-label="تحديث">
          {refreshing ? '⏳' : '🔄'}
        </button>
      </div>

      {/* بطاقة الحالة الرئيسية */}
      <div style={{ margin: 16, padding: 24, background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)`, borderRadius: 20, color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{info.icon}</div>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>{info.label}</div>
        <div style={{ fontSize: 12, opacity: .85, fontFamily: 'monospace', direction: 'ltr' }}>
          {order.order_code}
        </div>
      </div>

      {/* شريط التقدم */}
      {!isCancelled && (
        <div style={{ margin: '0 16px 20px', padding: 16, background: 'rgba(255,255,255,.04)', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {STATUS_FLOW.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    margin: '0 auto 8px',
                    background: done ? '#22c55e' : 'rgba(255,255,255,.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 900,
                    border: active ? '3px solid #fff' : 'none',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: done ? '#fff' : 'rgba(255,255,255,.4)' }}>
                    {STATUS_INFO[step].label.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* تفاصيل الطلب */}
      <div style={{ margin: '0 16px 16px', padding: 16, background: 'rgba(255,255,255,.04)', borderRadius: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>📋 تفاصيل الطلب</div>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: 13 }}>
            <span>{it.qty}× {it.title}</span>
            <span style={{ color: '#14b8a6', fontWeight: 800 }}>
              {(it.price * it.qty).toLocaleString()} {it.currency || 'SYP'}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: 15, fontWeight: 900 }}>
          <span>المجموع</span>
          <span style={{ color: '#14b8a6' }}>
            {Number(order.total || 0).toLocaleString()} {order.currency || 'SYP'}
          </span>
        </div>
      </div>

      {/* معلومات التاجر */}
      {order.provider_name && (
        <div style={{ margin: '0 16px 16px', padding: 16, background: 'rgba(15,77,58,.08)', borderRadius: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--n-500)', marginBottom: 4 }}>التاجر</div>
          <div style={{ fontSize: 14, fontWeight: 900 }}>🏪 {order.provider_name}</div>
        </div>
      )}

      {/* أزرار الفاتورة */}
      {isDone && (
        <div style={{ padding: '0 16px' }}>
          <Link
            href={`/invoice/${order.id}`}
            style={{
              display: 'block', width: '100%', padding: 16,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff', border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 900,
              textDecoration: 'none', textAlign: 'center',
            }}
          >
            🧾 عرض الفاتورة
          </Link>
        </div>
      )}

      {!isDone && !isCancelled && (
        <div style={{ padding: '0 16px', fontSize: 12, color: 'var(--n-500)', textAlign: 'center', lineHeight: 1.7 }}>
          ⏳ الصفحة تتحدث تلقائياً كل 10 ثواني<br />
          لا حاجة لتحديث يدوي
        </div>
      )}

      {isCancelled && (
        <div style={{ margin: '0 16px', padding: 16, background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.3)', borderRadius: 14, color: '#f87171', fontSize: 13, textAlign: 'center' }}>
          ❌ تم إلغاء هذا الطلب. للاستفسار تواصل مع التاجر.
        </div>
      )}
    </div>
  );
}
