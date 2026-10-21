'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const STATUS_MAP = {
  draft: { label: 'مسودة', icon: '📝', color: '#64748b', bg: 'rgba(148,163,184,0.15)' },
  sent: { label: 'مرسلة', icon: '📤', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  paid: { label: 'مدفوعة', icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  partial: { label: 'مدفوعة جزئياً', icon: '⏳', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  overdue: { label: 'متأخرة', icon: '⚠️', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  cancelled: { label: 'ملغاة', icon: '❌', color: '#64748b', bg: 'rgba(148,163,184,0.15)' },
};

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'draft', label: '📝 مسودة' },
  { key: 'sent', label: '📤 مرسلة' },
  { key: 'paid', label: '✅ مدفوعة' },
  { key: 'partial', label: '⏳ جزئية' },
  { key: 'overdue', label: '⚠️ متأخرة' },
];

export default function InvoicesListPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadInvoices();
  }, [user, userLoading, dataOwnerName]);

  async function loadInvoices() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('provider_name', dataOwnerName)
        .order('created_at', { ascending: false });
      setInvoices(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // حساب الحالة الفعلية (مع مراعاة التأخير)
  function getRealStatus(inv) {
    if (['paid', 'cancelled', 'draft'].includes(inv.status)) return inv.status;
    if (inv.paid_amount >= inv.total) return 'paid';
    if (inv.paid_amount > 0) return 'partial';
    if (inv.due_date && new Date(inv.due_date) < new Date()) return 'overdue';
    return inv.status || 'draft';
  }

  async function markAsPaid(inv) {
    if (!confirm(`تأكيد استلام كامل المبلغ (${Number(inv.total).toLocaleString()} ${inv.currency})؟`)) return;
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid', paid_amount: inv.total, updated_at: new Date().toISOString() })
      .eq('id', inv.id);
    if (error) toastError('فشل التحديث');
    else {
      success('✅ تم تسجيل الفاتورة كمدفوعة');
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'paid', paid_amount: inv.total } : i));
    }
  }

  async function deleteInvoice(inv) {
    if (!confirm(`حذف الفاتورة ${inv.invoice_number}؟`)) return;
    setDeleting(inv.id);
    const { error } = await supabase.from('invoices').delete().eq('id', inv.id);
    if (error) toastError('فشل الحذف');
    else { success('🗑️ تم الحذف'); setInvoices(prev => prev.filter(i => i.id !== inv.id)); }
    setDeleting(null);
  }

  const stats = useMemo(() => {
    const valid = invoices.filter(i => i.status !== 'cancelled');
    const totalInvoiced = valid.reduce((s, i) => s + Number(i.total || 0), 0);
    const totalPaid = valid.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
    const totalUnpaid = totalInvoiced - totalPaid;
    const overdue = valid.filter(i => getRealStatus(i) === 'overdue').length;
    return { totalInvoiced, totalPaid, totalUnpaid, overdue, count: valid.length };
  }, [invoices]);

  const filtered = useMemo(() => {
    let list = invoices;
    if (filter !== 'all') list = list.filter(i => getRealStatus(i) === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i =>
        (i.invoice_number || '').toLowerCase().includes(q) ||
        (i.customer_name || '').toLowerCase().includes(q) ||
        (i.customer_phone || '').includes(q)
      );
    }
    return list;
  }, [invoices, filter, search]);

  const currency = invoices[0]?.currency || 'SYP';

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>🧾 الفواتير</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{stats.count} فاتورة</div>
          </div>
          <Link href="/merchant/invoices/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ جديدة</Link>
        </div>
        <input
          type="search"
          placeholder="🔍 ابحث برقم الفاتورة أو اسم العميل..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: filter === f.key ? '#fff' : 'rgba(255,255,255,0.1)',
                color: filter === f.key ? '#0f4d3a' : '#fff',
                border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900,
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit'
              }}
            >{f.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        {/* Stats — World Class */}
        <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16, boxShadow: '0 10px 30px rgba(15,77,58,0.15)' }}>
          <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700, marginBottom: 6 }}>إجمالي الفواتير</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>
            {stats.totalInvoiced.toLocaleString()} <span style={{ fontSize: 14, opacity: 0.8 }}>{currency}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 800, marginBottom: 4 }}>✅ محصّل</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#86efac' }}>{stats.totalPaid.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 800, marginBottom: 4 }}>⏳ متبقّي</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>{stats.totalUnpaid.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 800, marginBottom: 4 }}>⚠️ متأخرة</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#fca5a5' }}>{stats.overdue}</div>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 18, color: '#64748b', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🧾</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>
              {invoices.length === 0 ? 'لا توجد فواتير بعد' : 'لا نتائج مطابقة'}
            </div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>
              {invoices.length === 0 ? 'أنشئ فاتورتك الأولى لعملائك' : 'جرّب تغيير الفلتر أو البحث'}
            </div>
            {invoices.length === 0 && (
              <Link href="/merchant/invoices/new" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>
                + إنشاء أول فاتورة
              </Link>
            )}
          </div>
        ) : (
          filtered.map(inv => {
            const status = getRealStatus(inv);
            const st = STATUS_MAP[status] || STATUS_MAP.draft;
            const percentPaid = inv.total > 0 ? Math.round((inv.paid_amount / inv.total) * 100) : 0;
            const isOverdue = status === 'overdue';
            const daysOverdue = isOverdue ? Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000) : 0;

            return (
              <div
                key={inv.id}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  marginBottom: 12,
                  border: isOverdue ? '2px solid #fecaca' : '1px solid #e2e8f0',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div style={{ padding: 16 }}>
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 900, color: '#0f4d3a', marginBottom: 4 }}>
                        {inv.invoice_number || 'INV-????'}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        👤 {inv.customer_name || 'عميل غير محدد'}
                      </div>
                      {inv.customer_phone && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                          📱 {inv.customer_phone}
                        </div>
                      )}
                    </div>
                    <div style={{ background: st.bg, color: st.color, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap' }}>
                      {st.icon} {st.label}
                    </div>
                  </div>

                  {/* Amount Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#0f4d3a' }}>
                        {Number(inv.total || 0).toLocaleString()}
                        <span style={{ fontSize: 11, color: '#64748b', marginRight: 4 }}> {inv.currency}</span>
                      </div>
                      {inv.paid_amount > 0 && inv.paid_amount < inv.total && (
                        <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 800, marginTop: 2 }}>
                          مدفوع: {Number(inv.paid_amount).toLocaleString()} ({percentPaid}%)
                        </div>
                      )}
                    </div>
                    {inv.due_date && (
                      <div style={{ textAlign: 'left', fontSize: 11, color: isOverdue ? '#ef4444' : '#64748b', fontWeight: 800 }}>
                        {isOverdue ? `⚠️ متأخرة ${daysOverdue} يوم` : `📅 ${new Date(inv.due_date).toLocaleDateString('ar-SY')}`}
                      </div>
                    )}
                  </div>

                  {/* Progress Bar for partial */}
                  {percentPaid > 0 && percentPaid < 100 && (
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percentPaid}%`, background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 3, transition: 'width 0.3s' }} />
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Link
                      href={`/merchant/invoices/${inv.id}`}
                      style={{ flex: 1, minWidth: 80, padding: 10, background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}
                    >👁️ عرض</Link>
                    <Link
                      href={`/merchant/invoices/${inv.id}/edit`}
                      style={{ flex: 1, minWidth: 80, padding: 10, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}
                    >✏️ تعديل</Link>
                    {status !== 'paid' && status !== 'cancelled' && (
                      <button
                        onClick={() => markAsPaid(inv)}
                        style={{ flex: 1, minWidth: 80, padding: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}
                      >✅ دفع</button>
                    )}
                    <button
                      onClick={() => deleteInvoice(inv)}
                      disabled={deleting === inv.id}
                      style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: deleting === inv.id ? 'wait' : 'pointer', fontFamily: 'inherit' }}
                    >{deleting === inv.id ? '⏳' : '🗑️'}</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Add Button */}
      <Link href="/merchant/invoices/new" style={{
        position: 'fixed', bottom: 20, left: 20, right: 20,
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff', padding: 16, borderRadius: 14,
        textAlign: 'center', textDecoration: 'none',
        fontSize: 15, fontWeight: 900,
        boxShadow: '0 10px 30px rgba(16,185,129,0.4)',
        zIndex: 30
      }}>
        + إنشاء فاتورة جديدة
      </Link>
    </div>
  );
}
