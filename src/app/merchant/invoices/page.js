'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function InvoicesPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isSectionAdmin, hasPermission, dataOwnerName } = useCurrentUser();
  const { success, error: toastError } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | paid | pending | cancelled
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      // نجلب الطلبات كمصدر للفواتير (الطلبات المكتملة = فواتير)
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // المالك يرى طلباته فقط، الأدمن يرى الكل
      if (!isSectionAdmin) {
        query = query.eq('provider_name', dataOwnerName);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toastError('تعذّر تحميل الفواتير');
    }
    setLoading(false);
  }

  // فلترة + بحث
  const filtered = useMemo(() => {
    let list = orders;
    
    if (filter === 'paid')      list = list.filter(o => o.status === 'done');
    else if (filter === 'pending')   list = list.filter(o => ['new', 'preparing', 'delivering'].includes(o.status));
    else if (filter === 'cancelled') list = list.filter(o => o.status === 'cancelled');
    
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(o =>
        (o.order_code || '').toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.customer_phone || '').includes(q)
      );
    }
    
    return list;
  }, [orders, filter, search]);

  // إحصائيات
  const stats = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter(o => o.status === 'done').length;
    const pending = orders.filter(o => ['new', 'preparing', 'delivering'].includes(o.status)).length;
    const revenue = orders
      .filter(o => o.status === 'done')
      .reduce((s, o) => s + Number(o.total || 0), 0);
    return { total, paid, pending, revenue };
  }, [orders]);

  // فحص الصلاحية
  if (!userLoading && user && !isOwner && !isSectionAdmin && !hasPermission('finance')) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 400, boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>ليس لديك صلاحية</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>قسم الفواتير مخصص للمالك والمحاسب</div>
          <a href="/merchant" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 800 }}>← العودة</a>
        </div>
      </div>
    );
  }

  // ═══ تحميل ═══
  if (userLoading || (user && loading)) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16 }}>
        <div style={{ background: '#0f4d3a', margin: '-16px -16px 16px', padding: 20, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,.1)', borderRadius: '50%' }} />
          <div style={{ width: 100, height: 20, background: 'rgba(255,255,255,.2)', borderRadius: 6 }} />
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(15,77,58,.2)' }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>🧾 الفواتير</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{stats.total} فاتورة</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>مدفوعة</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>{stats.paid}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>قيد التحصيل</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b' }}>{stats.pending}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 14, padding: 14, gridColumn: 'span 2', color: '#fff' }}>
          <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 6 }}>إجمالي الإيرادات (مدفوع)</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>
            {stats.revenue.toLocaleString('en-US')} <span style={{ fontSize: 12, opacity: 0.8 }}>SYP</span>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ padding: '0 16px 12px' }}>
        <input
          type="text"
          placeholder="🔍 ابحث برقم الفاتورة / العميل / الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }}
        />
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { k: 'all', l: 'الكل', n: stats.total },
            { k: 'paid', l: 'مدفوعة', n: stats.paid },
            { k: 'pending', l: 'قيد التحصيل', n: stats.pending },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              style={{
                padding: '8px 14px',
                background: filter === f.k ? '#0f4d3a' : '#fff',
                color: filter === f.k ? '#fff' : '#64748b',
                border: `1px solid ${filter === f.k ? '#0f4d3a' : '#e5e7eb'}`,
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
            >
              {f.l} ({f.n})
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="🧾"
            title={search ? 'لا توجد نتائج' : 'لا توجد فواتير بعد'}
            description={search ? 'جرّب البحث بكلمات مختلفة' : 'ستظهر فواتيرك تلقائياً عند اكتمال الطلبات'}
            actionLabel={search ? null : '← العودة للطلبات'}
            actionHref={search ? null : '/merchant/orders'}
          />
        ) : (
          filtered.map((inv) => {
            const status = inv.status === 'done' ? 'paid' : inv.status === 'cancelled' ? 'cancelled' : 'pending';
            const statusConfig = {
              paid: { label: '✓ مدفوعة', color: '#10b981', bg: 'rgba(16,185,129,.1)' },
              pending: { label: '⏳ قيد التحصيل', color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
              cancelled: { label: '✕ ملغاة', color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
            }[status];

            return (
              <div
                key={inv.id}
                style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 14, marginBottom: 10, cursor: 'pointer' }}
                onClick={() => setSelectedInvoice(inv)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', marginBottom: 4 }}>
                      #{inv.order_code}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      👤 {inv.customer_name} · {inv.customer_phone}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      📅 {new Date(inv.created_at).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                  <span style={{ background: statusConfig.bg, color: statusConfig.color, padding: '4px 10px', borderRadius: 8, fontSize: 10.5, fontWeight: 900, whiteSpace: 'nowrap' }}>
                    {statusConfig.label}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {(inv.items || []).length} منتج
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0f4d3a', direction: 'ltr' }}>
                    {Number(inv.total || 0).toLocaleString('en-US')} {inv.currency || 'SYP'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal — تفاصيل الفاتورة */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onUpdate={load}
        />
      )}
    </div>
  );
}

// ═══ Modal تفاصيل الفاتورة + طباعة ═══
function InvoiceModal({ invoice, onClose, onUpdate }) {
  const { success, error: toastError } = useToast();
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(invoice.status || 'new');

  async function changeStatus(newStatus, label) {
    if (!supabase) { toastError('قاعدة البيانات غير متصلة'); return; }
    if (!confirm(`تغيير حالة الفاتورة إلى "${label}"؟`)) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          ...(newStatus === 'done' ? { paid_at: new Date().toISOString() } : {}),
          ...(newStatus === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {}),
        })
        .eq('id', invoice.id);
      
      if (error) throw error;
      
      setCurrentStatus(newStatus);
      success(`تم تحديث الحالة: ${label}`);
      
      if (onUpdate) onUpdate();
      
      // إغلاق بعد لحظة
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      toastError('تعذّر التحديث: ' + (err.message || 'خطأ'));
    } finally {
      setUpdating(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleWhatsApp() {
    if (!invoice.customer_phone) {
      toastError('لا يوجد رقم هاتف للعميل');
      return;
    }
    const clean = String(invoice.customer_phone).replace(/\D/g, '');
    const phone = clean.startsWith('0') ? '963' + clean.slice(1) : clean;
    
    const lines = [
      '━━━━━━━━━━━━━━━━━━━━━',
      '🧾 فاتورة سند',
      '━━━━━━━━━━━━━━━━━━━━━',
      '',
      `📋 #${invoice.order_code}`,
      `📅 ${new Date(invoice.created_at).toLocaleDateString('ar-EG')}`,
      '',
      '🛍️ المنتجات:',
      ...(invoice.items || []).map(it => `• ${it.qty}× ${it.title} — ${(it.price * it.qty).toLocaleString()} ${it.currency || 'SYP'}`),
      '',
      '━━━━━━━━━━━━━━━━━━━━━',
      `💰 المجموع: ${Number(invoice.total).toLocaleString()} ${invoice.currency || 'SYP'}`,
      '━━━━━━━━━━━━━━━━━━━━━',
      '',
      `🏪 ${invoice.provider_name}`,
      'شكراً لتعاملكم معنا 🌿',
    ];
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
    success('جارٍ فتح WhatsApp');
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 0 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto', padding: '24px 20px 30px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, background: '#cbd5e1', borderRadius: 2, margin: '0 auto 20px' }} />
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🧾</div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>فاتورة</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>#{invoice.order_code}</div>
        </div>

        {/* Info */}
        <div style={{ background: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>العميل</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{invoice.customer_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>الهاتف</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', direction: 'ltr' }}>{invoice.customer_phone}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>التاريخ</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{new Date(invoice.created_at).toLocaleDateString('ar-EG')}</span>
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>🛍️ المنتجات</div>
          {(invoice.items || []).map((it, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
              <span style={{ color: '#334155' }}>{it.qty}× {it.title}</span>
              <span style={{ color: '#0f4d3a', fontWeight: 800 }}>{(it.price * it.qty).toLocaleString()} {it.currency || 'SYP'}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 14, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>المجموع</span>
          <span style={{ fontSize: 20, fontWeight: 900 }}>{Number(invoice.total).toLocaleString()} {invoice.currency || 'SYP'}</span>
        </div>

        {/* ═══ تغيير الحالة ═══ */}
        {currentStatus !== 'done' && currentStatus !== 'cancelled' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b', marginBottom: 10, textAlign: 'center' }}>
              تغيير حالة الفاتورة
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => changeStatus('done', 'مدفوعة')}
                disabled={updating}
                style={{
                  flex: 1,
                  padding: 14,
                  background: 'linear-gradient(135deg,#10b981,#059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: updating ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(16,185,129,.3)',
                }}
              >
                {updating ? '...' : '✓ تم الدفع'}
              </button>
              <button
                onClick={() => changeStatus('cancelled', 'ملغاة')}
                disabled={updating}
                style={{
                  flex: 1,
                  padding: 14,
                  background: 'rgba(220,38,38,.1)',
                  color: '#dc2626',
                  border: '1px solid rgba(220,38,38,.3)',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: updating ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {updating ? '...' : '✕ إلغاء'}
              </button>
            </div>
          </div>
        )}

        {/* حالة الفاتورة الحالية */}
        {currentStatus === 'done' && (
          <div style={{ marginBottom: 16, padding: 14, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 900, color: '#10b981' }}>
            ✓ هذه الفاتورة مدفوعة
          </div>
        )}
        {currentStatus === 'cancelled' && (
          <div style={{ marginBottom: 16, padding: 14, background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.3)', borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 900, color: '#dc2626' }}>
            ✕ هذه الفاتورة ملغاة
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handlePrint}
            style={{ flex: 1, padding: 14, background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            🖨️ طباعة
          </button>
          <button
            onClick={handleWhatsApp}
            style={{ flex: 1, padding: 14, background: 'linear-gradient(135deg,#25d366,#128c7e)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            📱 إرسال واتساب
          </button>
        </div>

        <button
          onClick={onClose}
          style={{ width: '100%', marginTop: 10, padding: 12, background: 'transparent', color: '#64748b', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
