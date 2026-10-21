'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { notifyCustomer } from '@/lib/notify';
import Link from 'next/link';

const STATUS_MAP = {
  new: { label: 'جديد', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  preparing: { label: 'قيد التحضير', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  delivering: { label: 'في التوصيل', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  done: { label: 'مكتمل', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  cancelled: { label: 'ملغي', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'new', label: 'جديد' },
  { key: 'preparing', label: 'تحضير' },
  { key: 'delivering', label: 'توصيل' },
  { key: 'done', label: 'مكتمل' },
];

export default function MerchantOrdersPage() {
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Driver Form
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [activeAssignId, setActiveAssignId] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    
    loadOrders();

    // Realtime: تحديث الطلبات لحظياً
    const channel = supabase
      .channel('merchant-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.new && payload.new.provider_name === dataOwnerName) {
          if (payload.eventType === 'INSERT') success('🔔 وصل طلب جديد!');
          loadOrders();
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, userLoading, dataOwnerName]);

  async function loadOrders() {
    if (!supabase || !dataOwnerName) return;
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('provider_name', dataOwnerName)
        .order('created_at', { ascending: false });
      
      setOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId, newStatus) {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) toastError('حدث خطأ أثناء التحديث');
    else {
      success('✅ تم تحديث حالة الطلب');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  }

  async function handleAssignDriver(orderId) {
    if (!driverName || !driverPhone) {
      toastError('يرجى إدخال اسم ورقم السائق');
      return;
    }
    const { error } = await supabase.from('orders').update({
      driver_name: driverName,
      driver_phone: driverPhone,
      status: 'delivering'
    }).eq('id', orderId);

    if (error) toastError('حدث خطأ');
    else {
      success('✅ تم تعيين السائق، الطلب في الطريق');
      // 🔔 إشعار للزبون
      const o = orders.find(x => x.id === orderId);
      if (o?.customer_id) {
        notifyCustomer(
          o.customer_id,
          '🚚 السائق في الطريق',
          `طلبك #${o.order_code} مع السائق ${driverName}`,
          o.master_order_id ? `/order/${o.master_order_id}` : null,
          '🚚'
        ).catch(() => {});
      }
      setActiveAssignId(null);
      setDriverName('');
      setDriverPhone('');
      loadOrders();
    }
  }

  function printInvoice(order) {
    const printWindow = window.open('', '_blank');
    const itemsHtml = (order.items || []).map(item => `
      <tr>
        <td style="border-bottom: 1px solid #ddd; padding: 8px;">${item.title}</td>
        <td style="border-bottom: 1px solid #ddd; padding: 8px; text-align: center;">${item.qty}</td>
        <td style="border-bottom: 1px solid #ddd; padding: 8px; text-align: left;">${item.price} ${order.currency}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
      <head>
        <title>فاتورة #${order.order_code}</title>
        <style>
          body { font-family: 'Cairo', sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #0f4d3a; padding-bottom: 10px; margin-bottom: 20px; }
          .info { margin-bottom: 20px; font-size: 14px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f1f5f9; padding: 10px; text-align: right; border-bottom: 2px solid #ddd; }
          .total { text-align: left; font-size: 18px; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin:0; color: #0f4d3a;">سند</h1>
          <p style="margin: 5px 0 0 0; color: #666;">فاتورة طلب</p>
        </div>
        <div class="info">
          <strong>رقم الطلب:</strong> #${order.order_code}<br>
          <strong>التاريخ:</strong> ${new Date(order.created_at).toLocaleString('ar-SY')}<br>
          <strong>الزبون:</strong> ${order.customer_name} (${order.customer_phone})<br>
          <strong>العنوان:</strong> ${order.customer_address}<br>
          ${order.notes ? `<strong>ملاحظات:</strong> ${order.notes}` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th style="text-align: center;">الكمية</th>
              <th style="text-align: left;">السعر</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="total">
          المجموع الفرعي: ${Number(order.subtotal || 0).toLocaleString()} ${order.currency}<br>
          التوصيل: ${Number(order.delivery_fee || 0).toLocaleString()} ${order.currency}<br>
          <span style="color: #0f4d3a; font-size: 22px;">الإجمالي: ${Number(order.total || 0).toLocaleString()} ${order.currency}</span>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>📦 إدارة الطلبات</h1>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: filter === f.key ? '#fff' : 'rgba(255,255,255,0.1)',
                color: filter === f.key ? '#0f4d3a' : '#fff',
                border: 'none', padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b', background: '#fff', borderRadius: 16 }}>
            لا توجد طلبات في هذا القسم.
          </div>
        ) : (
          filteredOrders.map(order => {
            const status = STATUS_MAP[order.status] || STATUS_MAP.new;
            const items = Array.isArray(order.items) ? order.items : [];
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} style={{ background: '#fff', borderRadius: 16, marginBottom: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                
                {/* Order Header */}
                <div style={{ padding: 16, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, fontFamily: 'monospace' }}>#{order.order_code}</div>
                    <div style={{ background: status.bg, color: status.color, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
                      {status.label}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>👤 {order.customer_name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>📞 {order.customer_phone}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>📍 {order.customer_address}</div>
                </div>

                {/* Items Summary */}
                <div style={{ padding: '12px 16px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                  <div style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>{items.length} منتج · {order.payment_method === 'cod' ? 'دفع عند الاستلام' : 'مدفوع'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f4d3a' }}>{Number(order.total || 0).toLocaleString()} {order.currency}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: 16, borderTop: '1px solid #f1f5f9' }}>
                    {items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                        {item.image ? <img src={item.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} /> : <div style={{ width: 40, height: 40, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>{item.title}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{item.qty} × {item.price} {order.currency}</div>
                        </div>
                      </div>
                    ))}
                    {order.notes && (
                      <div style={{ marginTop: 12, padding: 10, background: 'rgba(251,191,36,0.1)', borderRadius: 8, fontSize: 12, color: '#92400e', border: '1px solid rgba(251,191,36,0.3)' }}>
                        <strong>ملاحظات الزبون:</strong> {order.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions Bar */}
                <div style={{ padding: 16, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  
                  {/* Print & WhatsApp */}
                  <button onClick={() => printInvoice(order)} style={btnStyle('#f1f5f9', '#475569')}>🖨️ طباعة</button>
                  <a href={`https://wa.me/${(order.customer_phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ ...btnStyle('#e0f2fe', '#0284c7'), textDecoration: 'none' }}>💬 واتساب</a>

                  {/* Status Actions */}
                  <div style={{ flex: 1 }}></div>
                  
                  {order.status === 'new' && (
                    <>
                      <button onClick={() => updateStatus(order.id, 'preparing')} style={btnStyle('#10b981', '#fff')}>قبول وبدء التحضير</button>
                      <button onClick={() => updateStatus(order.id, 'cancelled')} style={btnStyle('#fee2e2', '#ef4444')}>رفض</button>
                    </>
                  )}

                  {order.status === 'preparing' && (
                    <>
                      {activeAssignId === order.id ? (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, padding: 12, background: '#f8fafc', borderRadius: 12 }}>
                          <input type="text" placeholder="اسم السائق" value={driverName} onChange={e => setDriverName(e.target.value)} style={inputStyle} />
                          <input type="tel" placeholder="رقم هاتف السائق" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} style={inputStyle} />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleAssignDriver(order.id)} style={{ ...btnStyle('#0f4d3a', '#fff'), flex: 1 }}>تأكيد</button>
                            <button onClick={() => setActiveAssignId(null)} style={{ ...btnStyle('#f1f5f9', '#475569'), flex: 1 }}>إلغاء</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setActiveAssignId(order.id)} style={btnStyle('#8b5cf6', '#fff')}>🚚 تعيين سائق</button>
                      )}
                    </>
                  )}

                  {order.status === 'delivering' && (
                    <button onClick={() => updateStatus(order.id, 'done')} style={btnStyle('#10b981', '#fff')}>✓ تأكيد التوصيل</button>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const btnStyle = (bg, color) => ({ background: bg, color: color, border: 'none', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
