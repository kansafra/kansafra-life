'use client';
import { forwardRef } from 'react';

const STATUS_LABELS = {
  draft: 'مسودة', sent: 'مرسلة', paid: 'مدفوعة',
  partial: 'مدفوعة جزئياً', overdue: 'متأخرة', cancelled: 'ملغاة',
};
const STATUS_COLORS = {
  draft: '#64748b', sent: '#0ea5e9', paid: '#10b981',
  partial: '#f59e0b', overdue: '#ef4444', cancelled: '#94a3b8',
};

const InvoiceView = forwardRef(function InvoiceView({ invoice, provider }, ref) {
  const total = Number(invoice.total) || 0;
  const paid = Number(invoice.paid_amount) || 0;
  const remaining = total - paid;
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const status = invoice.status || 'draft';
  const statusLabel = STATUS_LABELS[status] || status;
  const statusColor = STATUS_COLORS[status] || '#64748b';

  return (
    <div
      ref={ref}
      style={{
        width: 794,
        minHeight: 1123,
        background: '#fff',
        color: '#0f172a',
        padding: 50,
        fontFamily: 'Cairo, Arial, sans-serif',
        direction: 'rtl',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, paddingBottom: 24, borderBottom: '4px solid #0f4d3a' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#0f4d3a', marginBottom: 6 }}>
            {provider?.display_name || 'سند'}
          </div>
          {provider?.phone && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>📞 {provider.phone}</div>}
          {provider?.address && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>📍 {provider.address}</div>}
          {provider?.city && <div style={{ fontSize: 11, color: '#64748b' }}>🏙️ {provider.city}</div>}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#fbbf24', letterSpacing: 3, lineHeight: 1 }}>فاتورة</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f4d3a', fontFamily: 'monospace', marginTop: 10 }}>
            {invoice.invoice_number}
          </div>
          <div style={{ background: statusColor, color: '#fff', padding: '4px 14px', borderRadius: 8, fontSize: 11, fontWeight: 900, marginTop: 8, display: 'inline-block' }}>
            {statusLabel}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginBottom: 32 }}>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', marginBottom: 8, letterSpacing: 1 }}>فاتورة إلى</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>{invoice.customer_name || '—'}</div>
          {invoice.customer_phone && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 3 }}>📞 {invoice.customer_phone}</div>}
          {invoice.customer_email && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 3 }}>✉️ {invoice.customer_email}</div>}
          {invoice.customer_address && <div style={{ fontSize: 12, color: '#64748b' }}>📍 {invoice.customer_address}</div>}
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', marginBottom: 8, letterSpacing: 1 }}>تفاصيل الفاتورة</div>
          {invoice.issue_date && (
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#94a3b8' }}>الإصدار:</span> <strong>{new Date(invoice.issue_date).toLocaleDateString('ar-SY')}</strong>
            </div>
          )}
          {invoice.due_date && (
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#94a3b8' }}>الاستحقاق:</span> <strong>{new Date(invoice.due_date).toLocaleDateString('ar-SY')}</strong>
            </div>
          )}
          <div style={{ fontSize: 12 }}>
            <span style={{ color: '#94a3b8' }}>العملة:</span> <strong>{invoice.currency || 'SYP'}</strong>
          </div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#0f4d3a', color: '#fff' }}>
            <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: 11, fontWeight: 900, borderRadius: '8px 0 0 0' }}>#</th>
            <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: 11, fontWeight: 900 }}>الوصف</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: 11, fontWeight: 900 }}>الكمية</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: 11, fontWeight: 900 }}>سعر الوحدة</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 900, borderRadius: '0 8px 0 0' }}>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const itemTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
            return (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 8px', fontSize: 12, color: '#64748b' }}>{i + 1}</td>
                <td style={{ padding: '10px 8px', fontSize: 13, fontWeight: 800 }}>{item.description}</td>
                <td style={{ padding: '10px 8px', fontSize: 12, textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '10px 8px', fontSize: 12, textAlign: 'center' }}>{Number(item.unit_price || 0).toLocaleString()}</td>
                <td style={{ padding: '10px 8px', fontSize: 13, fontWeight: 900, textAlign: 'left', color: '#0f4d3a' }}>{itemTotal.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 32 }}>
        <div style={{ width: 340 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: 12, color: '#64748b' }}>
            <span>المجموع الفرعي</span>
            <strong>{Number(invoice.subtotal || 0).toLocaleString()} {invoice.currency}</strong>
          </div>
          {Number(invoice.discount_amount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: 12, color: '#ef4444' }}>
              <span>الخصم</span>
              <strong>- {Number(invoice.discount_amount).toLocaleString()} {invoice.currency}</strong>
            </div>
          )}
          {Number(invoice.tax_amount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: 12, color: '#0ea5e9' }}>
              <span>الضريبة ({invoice.tax_rate}%)</span>
              <strong>+ {Number(invoice.tax_amount).toLocaleString()} {invoice.currency}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 14, background: '#0f4d3a', color: '#fff', borderRadius: 10, marginTop: 10, fontSize: 16, fontWeight: 900 }}>
            <span>الإجمالي</span>
            <span style={{ color: '#fbbf24' }}>{total.toLocaleString()} {invoice.currency}</span>
          </div>
          {paid > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: 12, color: '#10b981' }}>
                <span>✅ المدفوع</span>
                <strong>{paid.toLocaleString()} {invoice.currency}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: 12, color: remaining > 0 ? '#ef4444' : '#10b981', fontWeight: 900 }}>
                <span>{remaining > 0 ? '⏳ المتبقي' : '✅ مدفوعة بالكامل'}</span>
                <strong>{remaining > 0 ? remaining.toLocaleString() + ' ' + invoice.currency : ''}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {(invoice.notes || invoice.terms) && (
        <div style={{ marginBottom: 32, background: '#f8fafc', borderRadius: 12, padding: 16 }}>
          {invoice.notes && (
            <div style={{ marginBottom: invoice.terms ? 12 : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', marginBottom: 4 }}>📝 ملاحظات</div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{invoice.notes}</div>
            </div>
          )}
          {invoice.terms && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', marginBottom: 4 }}>📜 الشروط والأحكام</div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{invoice.terms}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 30, left: 50, right: 50, textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: '#0f4d3a' }}>شكراً لتعاملكم معنا 🌿</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>صدرت هذه الفاتورة من منصة سند</div>
      </div>
    </div>
  );
});

export default InvoiceView;
