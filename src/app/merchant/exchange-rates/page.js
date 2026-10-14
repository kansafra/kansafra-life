'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CURRENCIES = [
  { code: 'USD', name: 'دولار أمريكي', flag: '🇺🇸' },
  { code: 'EUR', name: 'يورو', flag: '🇪🇺' },
  { code: 'TRY', name: 'ليرة تركية', flag: '🇹🇷' },
  { code: 'SAR', name: 'ريال سعودي', flag: '🇸🇦' },
  { code: 'AED', name: 'درهم إماراتي', flag: '🇦🇪' },
  { code: 'SYP', name: 'ليرة سورية', flag: '🇸🇾' },
];

export default function MerchantExchangeRates() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
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
    const { data } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('office_name', ent.display_name)
      .order('currency');
    setRates(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openEdit(r) {
    setEditing(r.id);
    setForm({ ...r });
  }

  function openNew(c) {
    setEditing('new');
    setForm({
      currency: c?.code || 'USD',
      buy_price: 0,
      sell_price: 0,
      notes: '',
      is_active: true,
    });
  }

  async function save() {
    if (!form.currency) { alert('اختر العملة'); return; }
    if (!form.buy_price || !form.sell_price) { alert('أدخل السعرين'); return; }

    const payload = {
      office_name: entity.display_name,
      currency: form.currency,
      buy_price: parseFloat(form.buy_price) || 0,
      sell_price: parseFloat(form.sell_price) || 0,
      notes: form.notes?.trim() || null,
      is_active: form.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    let err;
    if (editing === 'new') {
      ({ error: err } = await supabase.from('exchange_rates').insert(payload));
    } else {
      ({ error: err } = await supabase.from('exchange_rates').update(payload).eq('id', editing));
    }
    if (err) { alert('تعذّر: ' + err.message); return; }
    setEditing(null);
    load(entity);
  }

  async function del(r) {
    if (!confirm('حذف ' + r.currency + '؟')) return;
    await supabase.from('exchange_rates').delete().eq('id', r.id);
    load(entity);
  }

  async function toggleActive(r) {
    await supabase.from('exchange_rates')
      .update({ is_active: !r.is_active, updated_at: new Date().toISOString() })
      .eq('id', r.id);
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const existing = new Set(rates.map((r) => r.currency));
  const missing = CURRENCIES.filter((c) => !existing.has(c.code));

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">💱 أسعار الصرف</span>
        <button className="mng-add-btn" onClick={() => openNew(null)} type="button">+ عملة</button>
      </div>

      {missing.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(251,191,36,.08)', borderBottom: '1px solid rgba(251,191,36,.2)' }}>
          <div style={{ fontSize: 11, color: 'rgba(251,191,36,.9)', fontWeight: 800, marginBottom: 8 }}>
            ⚠️ عملات لم تُضف بعد — اضغط للإضافة السريعة:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {missing.map((c) => (
              <button
                key={c.code}
                onClick={() => openNew(c)}
                type="button"
                className="chip"
                style={{ background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.3)' }}
              >
                {c.flag} {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : rates.length === 0 ? (
        <div className="sect-empty">
          <span className="em">💱</span>
          <p>لم تُضف أسعار بعد</p>
          <button className="mng-btn primary" onClick={() => openNew(null)} type="button" style={{ marginTop: 12 }}>
            + إضافة أول عملة
          </button>
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          {rates.map((r) => {
            const cur = CURRENCIES.find((c) => c.code === r.currency);
            return (
              <div
                key={r.id}
                className="debt-card"
                style={{ borderRightColor: r.is_active !== false ? '#14b8a6' : '#666', opacity: r.is_active !== false ? 1 : 0.5 }}
              >
                <div className="debt-customer">
                  {cur?.flag || '💵'} {cur?.name || r.currency}
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                  <div style={{ flex: 1, background: 'rgba(20,184,166,.1)', borderRadius: 10, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--n-500)', fontWeight: 700, marginBottom: 2 }}>شراء (نشتري)</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#14b8a6', direction: 'ltr', textAlign: 'right' }}>
                      {Number(r.buy_price || 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(220,38,38,.1)', borderRadius: 10, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--n-500)', fontWeight: 700, marginBottom: 2 }}>بيع (نبيع)</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#dc2626', direction: 'ltr', textAlign: 'right' }}>
                      {Number(r.sell_price || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {r.notes && (
                  <div style={{ fontSize: 11, color: 'var(--n-500)', marginTop: 8 }}>📝 {r.notes}</div>
                )}

                <div style={{ fontSize: 10, color: 'var(--n-400)', marginTop: 8, textAlign: 'left', direction: 'ltr' }}>
                  آخر تحديث: {new Date(r.updated_at).toLocaleString('ar-EG')}
                </div>

                <div className="debt-actions">
                  <button className="debt-action" onClick={() => toggleActive(r)} type="button" title={r.is_active !== false ? 'إخفاء' : 'إظهار'}>
                    {r.is_active !== false ? '👁️' : '🚫'}
                  </button>
                  <button className="debt-action edit" onClick={() => openEdit(r)} type="button">✏️</button>
                  <button className="debt-action del" onClick={() => del(r)} type="button">🗑️</button>
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
            <h3 className="mng-modal-title">{editing === 'new' ? '➕ عملة جديدة' : '✏️ تعديل السعر'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">العملة *</label>
              <select
                className="new-service-select"
                value={form.currency || ''}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                disabled={editing !== 'new'}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">سعر الشراء *</label>
                <input
                  className="new-service-input"
                  type="number"
                  step="any"
                  value={form.buy_price || ''}
                  onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
                  placeholder="كم تشتري بـ 1"
                />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">سعر البيع *</label>
                <input
                  className="new-service-input"
                  type="number"
                  step="any"
                  value={form.sell_price || ''}
                  onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
                  placeholder="كم تبيع بـ 1"
                />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">ملاحظات</label>
              <textarea
                className="new-service-input"
                style={{ minHeight: 60, fontFamily: 'inherit' }}
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="مثال: أسعار اليوم حسب البورصة"
              />
            </div>

            <div className="new-service-field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={form.is_active !== false}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                id="exch_act"
              />
              <label htmlFor="exch_act" style={{ margin: 0, cursor: 'pointer' }}>مُفعّل (يظهر للزوار)</label>
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setEditing(null)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} type="button">✓ حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
