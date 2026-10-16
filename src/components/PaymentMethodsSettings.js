'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

const METHODS = [
  { key: 'shama_cash',    label: 'شام كاش',        icon: '💰', color: '#22c55e', fields: ['account_number', 'account_name'] },
  { key: 'cash',          label: 'نقداً عند الاستلام', icon: '💵', color: '#0ea5e9', fields: [] },
  { key: 'bank_transfer', label: 'تحويل بنكي',      icon: '🏦', color: '#8b5cf6', fields: ['account_number', 'account_name', 'bank_name'] },
  { key: 'card',          label: 'بطاقة ائتمان',    icon: '💳', color: '#f59e0b', fields: [] },
];

export default function PaymentMethodsSettings() {
  const [session, setSession] = useState(null);
  const [methods, setMethods] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openMethod, setOpenMethod] = useState(null);

  useEffect(() => {
    const s = getSession();
    if (!s) return;
    setSession(s);
    load(s);
  }, []);

  async function load(s) {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('entity_name', s.display_name);

    const m = {};
    (data || []).forEach((item) => { m[item.method_type] = item; });
    setMethods(m);
    setLoading(false);
  }

  async function toggleMethod(methodKey) {
    if (!session) return;
    setSaving(true);
    const existing = methods[methodKey];
    const isCurrentlyActive = existing?.is_active !== false && existing;

    if (existing) {
      await supabase.from('payment_methods')
        .update({ is_active: !isCurrentlyActive })
        .eq('id', existing.id);
    } else {
      const meta = METHODS.find((x) => x.key === methodKey);
      await supabase.from('payment_methods').insert({
        entity_name: session.display_name,
        method_type: methodKey,
        name: meta?.label || methodKey,
        is_active: true,
      });
    }
    setSaving(false);
    load(session);
  }

  async function saveDetails(methodKey, details) {
    if (!session) return;
    setSaving(true);
    const existing = methods[methodKey];
    const payload = {
      entity_name: session.display_name,
      method_type: methodKey,
      name: METHODS.find((x) => x.key === methodKey)?.label || methodKey,
      account_number: details.account_number || null,
      account_name: details.account_name || null,
      instructions: details.instructions || null,
      is_active: true,
    };

    let err;
    if (existing?.id) {
      ({ error: err } = await supabase.from('payment_methods').update(payload).eq('id', existing.id));
    } else {
      ({ error: err } = await supabase.from('payment_methods').insert(payload));
    }
    setSaving(false);
    if (err) { alert('تعذّر: ' + err.message); return; }
    setOpenMethod(null);
    load(session);
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}><span className="em">⏳</span></div>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: 'var(--ink-800)' }}>
        💳 طرق الدفع المتاحة
      </div>

      {METHODS.map((m) => {
        const active = methods[m.key]?.is_active !== false && methods[m.key];
        const hasDetails = methods[m.key]?.account_number;

        return (
          <div
            key={m.key}
            style={{
              background: '#ffffff',
              border: active ? `1.5px solid ${m.color}` : '1.5px solid var(--ink-200)',
              borderRadius: 16,
              padding: 14,
              marginBottom: 10,
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: active ? `${m.color}20` : 'var(--ink-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                {m.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink-800)' }}>
                  {m.label}
                </div>
                {active && hasDetails && (
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 3, direction: 'ltr', textAlign: 'right' }}>
                    {methods[m.key].account_number}
                  </div>
                )}
                {!active && (
                  <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 3 }}>
                    غير مُفعّلة
                  </div>
                )}
              </div>

              {/* زر التفعيل */}
              <button
                onClick={() => toggleMethod(m.key)}
                disabled={saving}
                type="button"
                style={{
                  padding: '8px 14px',
                  background: active ? `${m.color}` : 'var(--ink-100)',
                  color: active ? '#fff' : 'var(--ink-600)',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 11.5,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                {active ? '✓ مُفعّل' : 'تفعيل'}
              </button>
            </div>

            {/* تفاصيل الحساب */}
            {active && m.fields.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--ink-100)' }}>
                {openMethod === m.key ? (
                  <MethodDetailsForm
                    method={m}
                    initial={methods[m.key]}
                    onSave={(d) => saveDetails(m.key, d)}
                    onCancel={() => setOpenMethod(null)}
                    saving={saving}
                  />
                ) : (
                  <button
                    onClick={() => setOpenMethod(m.key)}
                    type="button"
                    style={{
                      width: '100%', padding: 10,
                      background: 'var(--ink-50)',
                      border: '1px solid var(--ink-200)',
                      borderRadius: 10,
                      fontSize: 12, fontWeight: 900,
                      color: 'var(--ink-700)',
                      cursor: 'pointer',
                    }}
                  >
                    {hasDetails ? '✏️ تعديل بيانات الحساب' : '➕ إضافة بيانات الحساب'}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MethodDetailsForm({ method, initial, onSave, onCancel, saving }) {
  const [d, setD] = useState({
    account_number: initial?.account_number || '',
    account_name: initial?.account_name || '',
    instructions: initial?.instructions || '',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--ink-600)', marginBottom: 4 }}>
          {method.key === 'shama_cash' ? '📱 رقم الحساب' : '🔢 رقم الحساب'}
        </label>
        <input
          className="new-service-input"
          value={d.account_number}
          onChange={(e) => setD({ ...d, account_number: e.target.value })}
          placeholder="09XXXXXXXX"
          style={{ direction: 'ltr', textAlign: 'right' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--ink-600)', marginBottom: 4 }}>
          👤 اسم صاحب الحساب
        </label>
        <input
          className="new-service-input"
          value={d.account_name}
          onChange={(e) => setD({ ...d, account_name: e.target.value })}
          placeholder="الاسم الكامل"
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--ink-600)', marginBottom: 4 }}>
          📝 ملاحظات للعميل
        </label>
        <textarea
          className="new-service-textarea"
          value={d.instructions}
          onChange={(e) => setD({ ...d, instructions: e.target.value })}
          placeholder="مثال: أرسل صورة التحويل"
          rows={2}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onSave(d)}
          disabled={saving}
          type="button"
          style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg, #0f4d3a, #0a6b50)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
        >
          {saving ? '... جارٍ' : '✓ حفظ'}
        </button>
        <button
          onClick={onCancel}
          type="button"
          style={{ padding: '10px 16px', background: 'var(--ink-100)', color: 'var(--ink-600)', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
