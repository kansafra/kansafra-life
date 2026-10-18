'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const SERVICE_TYPES = ['دفع فاتورة', 'توصيل هدية', 'دفع رسوم مدارس', 'دعم مشروع', 'شراء أدوية', 'أخرى'];
const CURRENCIES = ['USD', 'EUR', 'SYP', 'TRY', 'SAR', 'AED'];

export default function NewExpat() {
  const router = useRouter();
  const { dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    service_type: 'دفع فاتورة', description: '', recipient_name: '', recipient_phone: '',
    amount: '', currency: 'USD',
  });

  function u(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.description.trim()) { tE('التفاصيل مطلوبة'); return; }
    if (!form.recipient_name.trim()) { tE('اسم المستفيد مطلوب'); return; }
    if (!form.recipient_phone.trim()) { tE('رقم المستفيد مطلوب'); return; }
    if (!form.amount || Number(form.amount) <= 0) { tE('المبلغ مطلوب'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('expat_services').insert({
        expat_name: dataOwnerName,
        service_type: form.service_type,
        description: form.description.trim(),
        recipient_name: form.recipient_name.trim(),
        recipient_phone: form.recipient_phone.trim(),
        amount: Number(form.amount),
        currency: form.currency,
        status: 'pending',
      });
      if (error) throw error;
      success('✅ تم إنشاء الطلب');
      router.push('/merchant/expat');
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#7c3aed', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant/expat" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>←</Link>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🌍 خدمة جديدة</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#7c3aed', marginBottom: 12 }}>📋 نوع الخدمة</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 14 }}>
            {SERVICE_TYPES.map(t => (
              <button key={t} type="button" onClick={() => u('service_type', t)} style={{ padding: 12, background: form.service_type === t ? '#7c3aed' : '#f8fafc', color: form.service_type === t ? '#fff' : '#64748b', border: `1px solid ${form.service_type === t ? '#7c3aed' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>التفاصيل *</label>
          <textarea value={form.description} onChange={(e) => u('description', e.target.value)} rows={3} placeholder="اشرح الخدمة المطلوبة بالتفصيل..." style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#7c3aed', marginBottom: 12 }}>👤 بيانات المستفيد</div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>اسم المستفيد *</label>
          <input type="text" value={form.recipient_name} onChange={(e) => u('recipient_name', e.target.value)} placeholder="اسم الشخص في سوريا" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>رقم الهاتف *</label>
          <input type="tel" value={form.recipient_phone} onChange={(e) => u('recipient_phone', e.target.value)} placeholder="09XXXXXXXX" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', direction: 'ltr', textAlign: 'right' }} />
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#7c3aed', marginBottom: 12 }}>💰 المبلغ</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>المبلغ *</label>
              <input type="number" value={form.amount} onChange={(e) => u('amount', e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', fontWeight: 900 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>العملة</label>
              <select value={form.currency} onChange={(e) => u('currency', e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 12, background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <button onClick={save} disabled={saving} style={{ width: '100%', padding: 16, background: saving ? '#94a3b8' : 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {saving ? '... جارٍ الإنشاء' : '✓ إنشاء الطلب'}
        </button>
      </div>
    </div>
  );
}
