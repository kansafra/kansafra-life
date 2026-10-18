'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function InvoicePage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) load(params.id);
  }, [params?.id]);

  async function load(id) {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
    setOrder(data);
    setLoading(false);
  }

  function printInvoice() {
    window.print();
  }

  function shareWhatsApp() {
    if (!order) return;
    const lines = [
      `🧾 فاتورة سند`,
      `📋 #${order.order_code}`,
      `📅 ${new Date(order.created_at).toLocaleDateString('ar-EG')}`,
      '',
      `🏪 ${order.provider_name}`,
      `👤 ${order.customer_name}`,
      '',
      ...(order.items || []).map(it => `• ${it.qty}× ${it.title} — ${(it.price * it.qty).toLocaleString()} ${it.currency || 'SYP'}`),
      '',
      `💰 المجموع: ${Number(order.total).toLocaleString()} ${order.currency || 'SYP'}`,
      '',
      'شكراً لتعاملكم مع سند 🌿',
    ];
    const text = lines.join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🧾</div>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>الفاتورة غير موجودة</div>
          <Link href="/" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 800, marginTop: 16 }}>← الرئيسية</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 120 }}>
      {/* Header */}
      <div className="no-print" style={{ background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>←</button>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🧾 الفاتورة</div>
      </div>

      {/* Invoice Paper */}
      <div style={{ padding: 16 }}>
        <div id="invoice-paper" style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', maxWidth: 520, margin: '0 auto' }}>
          {/* Logo & Header */}
          <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '2px dashed #e5e7eb' }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>🌿</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f4d3a', marginBottom: 2 }}>سند</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>كل خدمات مجتمعك بين يديك</div>
          </div>

          {/* Invoice Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>رقم الفاتورة</div>
              <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'monospace', direction: 'ltr', textAlign: 'right', color: '#0f172a' }}>#{order.order_code}</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>التاريخ</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{new Date(order.created_at).toLocaleDateString('ar-EG')}</div>
            </div>
          </div>

          {/* Provider & Customer */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>🏪 البائع</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>{order.provider_name}</div>
              {order.provider_phone && <div style={{ fontSize: 10.5, color: '#64748b', direction: 'ltr', textAlign: 'right', marginTop: 2 }}>{order.provider_phone}</div>}
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>👤 العميل</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>{order.customer_name}</div>
              <div style={{ fontSize: 10.5, color: '#64748b', direction: 'ltr', textAlign: 'right', marginTop: 2 }}>{order.customer_phone}</div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#64748b', fontWeight: 900, padding: '0 0 8px', borderBottom: '2px solid #e5e7eb', marginBottom: 8 }}>
              <span>المنتج</span>
              <span>الإجمالي</span>
            </div>
            {(order.items || []).map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{it.title}</div>
                  <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>{it.qty} × {Number(it.price).toLocaleString()} {it.currency || 'SYP'}</div>
                </div>
                <div style={{ fontWeight: 900, color: '#0f4d3a' }}>{(it.price * it.qty).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ background: 'linear-gradient(135deg,#0f4d3a,#075640)', borderRadius: 12, padding: 16, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>الإجمالي</span>
            <span style={{ fontSize: 22, fontWeight: 900 }}>{Number(order.total).toLocaleString()} <span style={{ fontSize: 12, opacity: 0.8 }}>{order.currency || 'SYP'}</span></span>
          </div>

          {/* Payment Method */}
          {order.payment_method && (
            <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '2px dashed #e5e7eb' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>طريقة الدفع</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>{order.payment_method_details?.name_ar || order.payment_method}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '2px dashed #e5e7eb' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0f4d3a', marginBottom: 4 }}>شكراً لتعاملكم معنا 🌿</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>منصة سند · كنصفرة · إدلب · سوريا</div>
          </div>
        </div>
      </div>

      {/* Actions - Hidden on Print */}
      <div className="no-print" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: 12, display: 'flex', gap: 10, boxShadow: '0 -4px 12px rgba(0,0,0,.05)' }}>
        <button onClick={printInvoice} style={{ flex: 1, padding: 14, background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🖨️ طباعة</button>
        <button onClick={shareWhatsApp} style={{ flex: 1, padding: 14, background: 'linear-gradient(135deg,#25d366,#128c7e)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📱 واتساب</button>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          #invoice-paper { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}
