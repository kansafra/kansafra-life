'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const METHODS = [
  { key: 'sham_cash', icon: '🏦', label: 'شام كاش', desc: 'حوالة عبر شام كاش' },
  { key: 'bank_transfer', icon: '🏛️', label: 'حوالة بنكية', desc: 'تحويل بنكي مباشر' },
  { key: 'cash', icon: '💵', label: 'نقداً', desc: 'دفع عند الاستلام' },
  { key: 'card', icon: '💳', label: 'بطاقة', desc: 'فيزا / ماستر' },
  { key: 'paypal', icon: '🅿️', label: 'PayPal', desc: 'للمغتربين' },
  { key: 'custom', icon: '🔗', label: 'مخصص', desc: 'طريقة أخرى' },
];

export default function MerchantPayments() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('payment_methods').select('*').eq('entity_name', ent.display_name);
    setMethods(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setForm({ method_type: 'sham_cash', account_number: '', account_name: '', qr_code_url: '', instructions: '' });
    setEditing({ _new: true });
  }

  function openEdit(m) {
    setEditing(m);
    setForm({
      method_type: m.method_type,
      account_number: m.account_number || '',
      account_name: m.account_name || '',
      qr_code_url: m.qr_code_url || '',
      instructions: m.instructions || '',
    });
  }

  async function save() {
    if (!editing || !entity) return;
    setSaving(true);
    const payload = {
      entity_name: entity.display_name,
      method_type: form.method_type,
      account_number: form.account_number.trim() || null,
      account_name: form.account_name.trim() || null,
      qr_code_url: form.qr_code_url.trim() || null,
      instructions: form.instructions.trim() || null,
    };
    let err;
    if (editing._new) {
      ({ error: err } = await supabase.from('payment_methods').insert(payload));
    } else {
      ({ error: err } = await supabase.from('payment_methods').update(payload).eq('id', editing.id));
    }
    setSaving(false);
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    setEditing(null);
    load(entity);
  }

  async function del(m) {
    if (!confirm('حذف طريقة الدفع؟')) return;
    await supabase.from('payment_methods').delete().eq('id', m.id);
    load(entity);
  }

  async function toggleActive(m) {
    await supabase.from('payment_methods').update({ is_active: !m.is_active }).eq('id', m.id);
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="mng-page">
      <div className="mng-header">
        <Link href="/merchant" className="mng-back">→</Link>
        <span className="mng-title">💳 طرق الدفع</span>
        <span className="mng-count">{methods.length}</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ إضافة</button>
      </div>

      <div style={{ padding: '16px 20px 0', fontSize: 12, color: 'var(--n-500)', fontWeight: 600, lineHeight: 1.6 }}>
        أضف طرق الدفع التي تقبلها — سيظهر للعميل عند إتمام الطلب
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : methods.length === 0 ? (
        <div className="sect-empty">
          <span className="em">💳</span>
          <p>لم تُضف طرق دفع بعد</p>
          <button className="mng-add-btn" onClick={openAdd} type="button" style={{ marginTop: 16 }}>+ إضافة الأولى</button>
        </div>
      ) : (
        <div className="mng-rows">
          {methods.map((m) => {
            const info = METHODS.find((x) => x.key === m.method_type) || METHODS[5];
            return (
              <div key={m.id} className="mng-row">
                <div className="mng-row-head">
                  <span style={{ fontSize: 24 }}>{info.icon}</span>
                  <div className="mng-row-title">{info.label}</div>
                  <span className={`admin-badge ${m.is_active ? 'active' : 'warn'}`} style={{ fontSize: 10 }}>
                    {m.is_active ? 'نشطة' : 'موقوفة'}
                  </span>
                </div>
                <div className="mng-row-fields">
                  {m.account_number && <div className="mng-row-field"><strong>الحساب:</strong> {m.account_number}</div>}
                  {m.account_name && <div className="mng-row-field"><strong>الاسم:</strong> {m.account_name}</div>}
                  {m.qr_code_url && <div className="mng-row-field"><strong>QR:</strong> موجود</div>}
                </div>
                <div className="mng-row-actions">
                  <button className="mng-btn edit" onClick={() => openEdit(m)} type="button">✏️ تعديل</button>
                  <button className="mng-btn" onClick={() => toggleActive(m)} type="button" style={{ background: 'var(--c-100)', color: 'var(--n-700)' }}>
                    {m.is_active ? '⏸' : '▶'}
                  </button>
                  <button className="mng-btn del" onClick={() => del(m)} type="button">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="mng-modal-bg" onClick={() => setEditing(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">
              {editing._new ? '➕ إضافة طريقة دفع' : '✏️ تعديل طريقة الدفع'}
            </h3>

            <div className="new-service-field">
              <label className="new-service-label">نوع الطريقة</label>
              <select className="new-service-select" value={form.method_type} onChange={(e) => setForm({ ...form, method_type: e.target.value })}>
                {METHODS.map((m) => (
                  <option key={m.key} value={m.key}>{m.icon} {m.label}</option>
                ))}
              </select>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">رقم الحساب / المعرف</label>
              <input className="new-service-input" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} placeholder="مثال: 0912345678" />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">اسم الحساب</label>
              <input className="new-service-input" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="مثال: محمد أحمد" />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">رابط صورة الباركود / QR</label>
              <input className="new-service-input" type="url" value={form.qr_code_url} onChange={(e) => setForm({ ...form, qr_code_url: e.target.value })} placeholder="https://..." />
            </div>

            {form.qr_code_url && (
              <div className="pay-qr">
                <img src={form.qr_code_url} alt="QR" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}

            <div className="new-service-field">
              <label className="new-service-label">تعليمات الدفع</label>
              <textarea className="new-service-textarea" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="مثال: أرسل المبلغ ثم صورة الحوالة" />
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setEditing(null)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} disabled={saving} type="button">
                {saving ? '...' : '✓ حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
