'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import InvoiceView from '@/components/InvoiceView';
import { downloadInvoicePdf, shareInvoicePdf } from '@/lib/invoicePdf';

export default function InvoiceViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const invoiceRef = useRef(null);

  const [invoice, setInvoice] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) return;
    loadInvoice();
  }, [user, userLoading, dataOwnerName, id]);

  async function loadInvoice() {
    if (!supabase || !id) return;
    setLoading(true);
    try {
      const { data: inv } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
      if (!inv) { toastError('الفاتورة غير موجودة'); router.push('/merchant/invoices'); return; }
      const { data: prov } = await supabase.from('entities').select('*').eq('display_name', dataOwnerName).maybeSingle();
      setInvoice(inv);
      setProvider(prov);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleDownloadPdf() {
    if (!invoiceRef.current) return;
    setActionLoading('pdf');
    try {
      await downloadInvoicePdf(invoiceRef.current, `فاتورة-${invoice.invoice_number}.pdf`);
      success('✅ تم تنزيل الفاتورة');
    } catch (err) {
      console.error(err);
      toastError('فشل إنشاء PDF');
    } finally { setActionLoading(null); }
  }

  async function handleSharePdf() {
    if (!invoiceRef.current) return;
    setActionLoading('share');
    try {
      const result = await shareInvoicePdf(invoiceRef.current, invoice, provider);
      if (result.shared) success('✅ تمت المشاركة');
      else if (result.downloaded) success('📥 تم تنزيل PDF (المتصفح لا يدعم المشاركة المباشرة)');
    } catch (err) {
      console.error(err);
      toastError('فشل المشاركة');
    } finally { setActionLoading(null); }
  }

  function handleWhatsApp() {
    const text = `*فاتورة ${invoice.invoice_number}*\n\nمن: ${provider?.display_name || 'سند'}\nإلى: ${invoice.customer_name}\n\n*الإجمالي:* ${Number(invoice.total).toLocaleString()} ${invoice.currency}\n${Number(invoice.paid_amount) > 0 ? `*المدفوع:* ${Number(invoice.paid_amount).toLocaleString()} ${invoice.currency}\n` : ''}${invoice.due_date ? `*الاستحقاق:* ${new Date(invoice.due_date).toLocaleDateString('ar-SY')}` : ''}`;
    const phone = (invoice.customer_phone || '').replace(/[^0-9]/g, '');
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function handlePrint() {
    window.print();
  }

  async function markAsPaid() {
    if (!confirm('تأكيد استلام كامل المبلغ؟')) return;
    setActionLoading('pay');
    try {
      const { error } = await supabase.from('invoices').update({
        status: 'paid',
        paid_amount: invoice.total,
        updated_at: new Date().toISOString()
      }).eq('id', invoice.id);
      if (error) throw error;
      setInvoice({ ...invoice, status: 'paid', paid_amount: invoice.total });
      success('✅ تم تسجيل الدفع');
    } catch (err) { toastError('فشل'); }
    finally { setActionLoading(null); }
  }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳ جارٍ التحميل...</div>;
  if (!invoice) return null;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        {/* Header */}
        <div className="no-print" style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/merchant/invoices')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ color: '#fff', fontSize: 16, fontWeight: 900, margin: 0, fontFamily: 'monospace' }}>{invoice.invoice_number}</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{invoice.customer_name}</div>
          </div>
          <Link href={`/merchant/invoices/${invoice.id}/edit`} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>✏️ تعديل</Link>
        </div>

        {/* Actions Bar */}
        <div className="no-print" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <ActionButton onClick={handlePrint} icon="🖨️" label="طباعة" color="#0f4d3a" />
          <ActionButton onClick={handleDownloadPdf} loading={actionLoading === 'pdf'} icon="📥" label="PDF" color="#ef4444" />
          <ActionButton onClick={handleSharePdf} loading={actionLoading === 'share'} icon="📤" label="مشاركة" color="#8b5cf6" />
          <ActionButton onClick={handleWhatsApp} icon="💬" label="واتساب" color="#25D366" />
        </div>

        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <div className="no-print" style={{ padding: '12px', background: '#fff' }}>
            <button onClick={markAsPaid} disabled={actionLoading === 'pay'} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              {actionLoading === 'pay' ? '⏳ جارٍ...' : '✅ تأكيد الدفع الكامل'}
            </button>
          </div>
        )}

        {/* Invoice Preview */}
        <div style={{ padding: 16, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div style={{ transform: 'scale(1)', transformOrigin: 'top center' }}>
            <div id="invoice-print-area" style={{ display: 'inline-block', background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 8, overflow: 'hidden' }}>
              <InvoiceView ref={invoiceRef} invoice={invoice} provider={provider} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ActionButton({ onClick, icon, label, color, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '10px 8px',
        background: `${color}10`,
        color: color,
        border: `1px solid ${color}30`,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: loading ? 'wait' : 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ fontSize: 18 }}>{loading ? '⏳' : icon}</div>
      <div style={{ fontSize: 10, fontWeight: 900 }}>{label}</div>
    </button>
  );
}
