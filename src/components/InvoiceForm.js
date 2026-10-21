'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const STATUS_OPTIONS = [
  { key: 'draft', label: 'مسودة', icon: '📝' },
  { key: 'sent', label: 'مرسلة', icon: '📤' },
  { key: 'paid', label: 'مدفوعة', icon: '✅' },
  { key: 'partial', label: 'مدفوعة جزئياً', icon: '⏳' },
  { key: 'cancelled', label: 'ملغاة', icon: '❌' },
];

function generateInvoiceNumber() {
  const date = new Date();
  const ymd = date.getFullYear().toString() + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${ymd}-${random}`;
}

export default function InvoiceForm({ invoiceId = null }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [loading, setLoading] = useState(!!invoiceId);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    invoice_number: '',
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    customer_email: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'draft',
    discount_type: 'fixed',
    discount_value: '0',
    tax_rate: '0',
    notes: '',
    terms: '',
    currency: 'SYP',
    items: [{ description: '', quantity: '1', unit_price: '' }],
    paid_amount: '0',
  });

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) return;

    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) {
      supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => {
        if (data) setEntityId(data.id);
      });
    }

    if (invoiceId) {
      loadInvoice();
    } else {
      setForm(f => ({ ...f, invoice_number: generateInvoiceNumber() }));
    }
  }, [user, userLoading, dataOwnerName, invoiceId]);

  async function loadInvoice() {
    if (!supabase || !invoiceId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('invoices').select('*').eq('id', invoiceId).maybeSingle();
      if (error) throw error;
      if (!data) { toastError('الفاتورة غير موجودة'); router.push('/merchant/invoices'); return; }

      setForm({
        invoice_number: data.invoice_number || '',
        customer_name: data.customer_name || '',
        customer_phone: data.customer_phone || '',
        customer_address: data.customer_address || '',
        customer_email: data.customer_email || '',
        issue_date: data.issue_date || new Date().toISOString().split('T')[0],
        due_date: data.due_date || '',
        status: data.status || 'draft',
        discount_type: data.discount_type || 'fixed',
        discount_value: String(data.discount_value || '0'),
        tax_rate: String(data.tax_rate || '0'),
        notes: data.notes || '',
        terms: data.terms || '',
        currency: data.currency || 'SYP',
        items: Array.isArray(data.items) && data.items.length > 0 ? data.items : [{ description: '', quantity: '1', unit_price: '' }],
        paid_amount: String(data.paid_amount || '0'),
      });
    } catch (err) {
      console.error(err);
      toastError('فشل تحميل الفاتورة');
    } finally { setLoading(false); }
  }

  // حساب المجاميع
  const subtotal = form.items.reduce((s, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    return s + (qty * price);
  }, 0);

  const discountAmount = form.discount_type === 'percentage'
    ? Math.round(subtotal * (Number(form.discount_value) || 0) / 100)
    : (Number(form.discount_value) || 0);

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(afterDiscount * (Number(form.tax_rate) || 0) / 100);
  const total = afterDiscount + taxAmount;

  function updateItem(index, field, value) {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, { description: '', quantity: '1', unit_price: '' }] });
  }

  function removeItem(index) {
    if (form.items.length === 1) { toastError('يجب أن تحتوي الفاتورة على بند واحد على الأقل'); return; }
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.customer_name.trim()) { toastError('اسم العميل مطلوب'); return; }
    if (form.items.some(it => !it.description.trim())) { toastError('يجب إدخال وصف لكل بند'); return; }
    if (form.items.some(it => !it.unit_price || Number(it.unit_price) <= 0)) { toastError('يجب إدخال سعر لكل بند'); return; }

    setSaving(true);
    try {
      const payload = {
        entity_id: entityId,
        provider_name: dataOwnerName,
        invoice_number: form.invoice_number || generateInvoiceNumber(),
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || null,
        customer_address: form.customer_address.trim() || null,
        customer_email: form.customer_email.trim() || null,
        issue_date: form.issue_date || null,
        due_date: form.due_date || null,
        status: form.status,
        items: form.items.map(it => ({
          description: it.description.trim(),
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
          total: (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
        })),
        subtotal: subtotal,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value) || 0,
        discount_amount: discountAmount,
        tax_rate: Number(form.tax_rate) || 0,
        tax_amount: taxAmount,
        total: total,
        currency: form.currency || 'SYP',
        paid_amount: Number(form.paid_amount) || 0,
        notes: form.notes.trim() || null,
        terms: form.terms.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (form.paid_amount >= total && total > 0) {
        payload.status = 'paid';
      }

      if (invoiceId) {
        const { error } = await supabase.from('invoices').update(payload).eq('id', invoiceId);
        if (error) throw error;
        success('✅ تم تحديث الفاتورة');
      } else {
        const { error } = await supabase.from('invoices').insert(payload);
        if (error) throw error;
        success('🎉 تم إنشاء الفاتورة');
      }
      router.push('/merchant/invoices');
    } catch (err) {
      console.error(err);
      toastError('فشل الحفظ');
    } finally { setSaving(false); }
  }

  if (userLoading || loading) {
    return <div style={{ padding: 80, textAlign: 'center' }}>⏳ جارٍ التحميل...</div>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 16, maxWidth: 800, margin: '0 auto', paddingBottom: 100 }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', borderRadius: 16, padding: 20, color: '#fff', marginBottom: 16, boxShadow: '0 6px 20px rgba(15,77,58,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>رقم الفاتورة</div>
          <input
            value={form.invoice_number}
            onChange={e => setForm({ ...form, invoice_number: e.target.value })}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 900, fontFamily: 'monospace', textAlign: 'center', width: 180 }}
          />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>{invoiceId ? 'تعديل الفاتورة' : 'فاتورة جديدة'}</h2>
      </div>

      {/* Customer Info */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginTop: 0, marginBottom: 16 }}>👤 بيانات العميل</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>الاسم *</label>
            <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required style={inputStyle} placeholder="اسم العميل" />
          </div>
          <div>
            <label style={labelStyle}>الهاتف</label>
            <input value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} style={inputStyle} placeholder="09xxxxxxxx" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>البريد الإلكتروني</label>
            <input type="email" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} style={inputStyle} placeholder="email@example.com" />
          </div>
          <div>
            <label style={labelStyle}>العنوان</label>
            <input value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })} style={inputStyle} placeholder="الحي، المدينة..." />
          </div>
        </div>
      </div>

      {/* Dates & Status */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>تاريخ الإصدار</label>
            <input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>تاريخ الاستحقاق</label>
            <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>الحالة</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
              {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.icon} {s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', margin: 0 }}>📦 بنود الفاتورة</h3>
          <button type="button" onClick={addItem} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ إضافة بند</button>
        </div>

        {form.items.map((item, index) => (
          <div key={index} style={{ background: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b' }}>بند {index + 1}</div>
              {form.items.length > 1 && (
                <button type="button" onClick={() => removeItem(index)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ حذف</button>
              )}
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={labelStyle}>الوصف *</label>
              <input value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} required style={inputStyle} placeholder="اسم المنتج أو الخدمة" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>الكمية</label>
                <input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} min={1} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>سعر الوحدة</label>
                <input type="number" value={item.unit_price} onChange={e => updateItem(index, 'unit_price', e.target.value)} min={0} style={inputStyle} placeholder="0" />
              </div>
              <div>
                <label style={labelStyle}>الإجمالي</label>
                <div style={{ padding: '12px 14px', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 900, color: '#0f4d3a', textAlign: 'center' }}>
                  {((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Discount & Tax */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginTop: 0, marginBottom: 16 }}>💸 الخصم والضريبة</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>نوع الخصم</label>
            <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })} style={inputStyle}>
              <option value="fixed">مبلغ ثابت</option>
              <option value="percentage">نسبة مئوية (%)</option>
            </select>
            <div style={{ marginTop: 8 }}>
              <label style={labelStyle}>قيمة الخصم</label>
              <input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} min={0} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>نسبة الضريبة (%)</label>
            <input type="number" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} min={0} max={100} style={inputStyle} />
            <div style={{ marginTop: 8 }}>
              <label style={labelStyle}>المبلغ المدفوع</label>
              <input type="number" value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value })} min={0} style={inputStyle} />
            </div>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '2px solid #0f4d3a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>المجموع الفرعي</span>
          <span style={{ fontSize: 14, fontWeight: 800 }}>{subtotal.toLocaleString()} {form.currency}</span>
        </div>
        {discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#ef4444' }}>
            <span style={{ fontSize: 13 }}>الخصم</span>
            <span style={{ fontSize: 14, fontWeight: 800 }}>- {discountAmount.toLocaleString()} {form.currency}</span>
          </div>
        )}
        {taxAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#0ea5e9' }}>
            <span style={{ fontSize: 13 }}>الضريبة ({form.tax_rate}%)</span>
            <span style={{ fontSize: 14, fontWeight: 800 }}>+ {taxAmount.toLocaleString()} {form.currency}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '2px dashed #e2e8f0', marginTop: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>الإجمالي</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#0f4d3a' }}>{total.toLocaleString()} {form.currency}</span>
        </div>
      </div>

      {/* Notes */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>ملاحظات</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} placeholder="ملاحظات داخلية..." />
        </div>
        <div>
          <label style={labelStyle}>الشروط والأحكام</label>
          <textarea value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} placeholder="شروط الدفع، سياسة الاسترجاع..." />
        </div>
      </div>

      {/* Save Button */}
      <button type="submit" disabled={saving} style={{ width: '100%', padding: 16, background: saving ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
        {saving ? '⏳ جارٍ الحفظ...' : (invoiceId ? '💾 حفظ التعديلات' : '➕ إنشاء الفاتورة')}
      </button>
    </form>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
