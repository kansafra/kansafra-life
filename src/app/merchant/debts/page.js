'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function MerchantDebts() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
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
    const { data } = await supabase.from('debts').select('*').eq('entity_name', ent.display_name).order('created_at', { ascending: false });
    setDebts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  const today = new Date().toISOString().slice(0, 10);

  const debtStatus = (d) => {
    const amount = Number(d.amount) || 0;
    const paid = Number(d.paid) || 0;
    if (paid >= amount) return 'paid';
    if (d.due_date && d.due_date < today) return 'overdue';
    if (d.due_date && (new Date(d.due_date) - new Date()) / (1000 * 60 * 60 * 24) < 7) return 'warning';
    return 'active';
  };

  const filtered = debts.filter((d) => {
    const st = debtStatus(d);
    if (filter === 'all') return true;
    if (filter === 'paid') return st === 'paid';
    if (filter === 'active') return st === 'active' || st === 'warning';
    if (filter === 'overdue') return st === 'overdue';
    return true;
  });

  // إجماليات
  const totalDebt = debts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalPaid = debts.reduce((sum, d) => sum + (Number(d.paid) || 0), 0);
  const totalRemaining = totalDebt - totalPaid;
  const overdueCount = debts.filter((d) => debtStatus(d) === 'overdue').length;

  function openAdd() {
    setMode('add');
    setForm({ customer_name: '', customer_phone: '', amount: '', paid: '0', currency: 'SYP', description: '', due_date: '', notes: '' });
  }

  function openEdit(d) {
    setMode('edit');
    setEditing(d);
    setForm({
      customer_name: d.customer_name || '',
      customer_phone: d.customer_phone || '',
      amount: String(d.amount || ''),
      paid: String(d.paid || ''),
      currency: d.currency || 'SYP',
      description: d.description || '',
      due_date: d.due_date || '',
      notes: d.notes || '',
    });
  }

  async function save() {
    if (!form.customer_name.trim()) { alert('اسم العميل مطلوب'); return; }
    if (!form.amount || Number(form.amount) <= 0) { alert('المبلغ مطلوب'); return; }
    setSaving(true);
    const payload = {
      entity_name: entity.display_name,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim() || null,
      amount: Number(form.amount),
      paid: Number(form.paid) || 0,
      currency: form.currency,
      description: form.description.trim() || null,
      due_date: form.due_date || null,
      notes: form.notes.trim() || null,
    };
    let err;
    if (mode === 'add') {
      ({ error: err } = await supabase.from('debts').insert(payload));
    } else {
      ({ error: err } = await supabase.from('debts').update(payload).eq('id', editing.id));
    }
    setSaving(false);
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    setMode(null); setEditing(null);
    load(entity);
  }

  async function markPaid(d) {
    const { error } = await supabase.from('debts').update({ paid: d.amount, status: 'paid' }).eq('id', d.id);
    if (!error) load(entity);
  }

  async function del(d) {
    if (!confirm('حذف هذا الدين؟')) return;
    await supabase.from('debts').delete().eq('id', d.id);
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="mng-page">
      <div className="mng-header">
        <Link href="/merchant" className="mng-back">→</Link>
        <span className="mng-title">💰 الديون والأقساط</span>
        <span className="mng-count">{debts.length}</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ إضافة</button>
      </div>

      {!loading && (
        <div className="debt-summary">
          <div className="debt-stat">
            <div className="debt-stat-val">{totalDebt.toLocaleString()}</div>
            <div className="debt-stat-lbl">إجمالي الديون</div>
          </div>
          <div className="debt-stat warn">
            <div className="debt-stat-val">{totalPaid.toLocaleString()}</div>
            <div className="debt-stat-lbl">المدفوع</div>
          </div>
          <div className="debt-stat danger">
            <div className="debt-stat-val">{totalRemaining.toLocaleString()}</div>
            <div className="debt-stat-lbl">المتبقي</div>
          </div>
          <div className="debt-stat danger">
            <div className="debt-stat-val">{overdueCount}</div>
            <div className="debt-stat-lbl">متأخرة</div>
          </div>
        </div>
      )}

      <div className="debt-filters">
        <button className={`debt-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} type="button">الكل</button>
        <button className={`debt-filter ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')} type="button">نشطة</button>
        <button className={`debt-filter ${filter === 'overdue' ? 'active' : ''}`} onClick={() => setFilter('overdue')} type="button">متأخرة</button>
        <button className={`debt-filter ${filter === 'paid' ? 'active' : ''}`} onClick={() => setFilter('paid')} type="button">مسددة</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty">
          <span className="em">💰</span>
          <p>لا توجد ديون</p>
          <button className="mng-add-btn" onClick={openAdd} type="button" style={{ marginTop: 16 }}>+ إضافة الأولى</button>
        </div>
      ) : (
        <div className="mng-rows" style={{ paddingTop: 12 }}>
          {filtered.map((d) => {
            const st = debtStatus(d);
            const amount = Number(d.amount) || 0;
            const paid = Number(d.paid) || 0;
            const remaining = amount - paid;
            const progress = amount > 0 ? (paid / amount) * 100 : 0;
            const statusLabel = st === 'paid' ? 'مسدد' : st === 'overdue' ? 'متأخر' : st === 'warning' ? 'قريب' : 'نشط';
            return (
              <div key={d.id} className={`debt-card ${st}`}>
                <div className="debt-head">
                  <div>
                    <div className="debt-customer">{d.customer_name}</div>
                    {d.customer_phone && <div className="debt-phone">{d.customer_phone}</div>}
                  </div>
                  <span className={`debt-badge ${st}`}>{statusLabel}</span>
                </div>

                <div className="debt-amounts">
                  <div className="debt-amount-item">
                    <div className="debt-amount-val">{amount.toLocaleString()}</div>
                    <div className="debt-amount-lbl">الإجمالي</div>
                  </div>
                  <div className="debt-amount-item">
                    <div className="debt-amount-val green">{paid.toLocaleString()}</div>
                    <div className="debt-amount-lbl">مدفوع</div>
                  </div>
                  <div className="debt-amount-item">
                    <div className="debt-amount-val red">{remaining.toLocaleString()}</div>
                    <div className="debt-amount-lbl">متبقي</div>
                  </div>
                </div>

                <div className="debt-progress">
                  <div className={`debt-progress-fill ${st === 'overdue' ? 'overdue' : ''}`} style={{ width: `${progress}%` }} />
                </div>

                {d.description && (
                  <div style={{ fontSize: 12, color: 'var(--n-500)', marginBottom: 8, lineHeight: 1.6 }}>
                    {d.description}
                  </div>
                )}

                {d.due_date && (
                  <div style={{ fontSize: 11.5, color: 'var(--n-500)', fontWeight: 700, marginBottom: 8 }}>
                    📅 الاستحقاق: {new Date(d.due_date).toLocaleDateString('ar-EG')}
                  </div>
                )}

                <div className="debt-actions">
                  {st !== 'paid' && (
                    <button className="debt-action pay" onClick={() => markPaid(d)} type="button">✓ سدّد</button>
                  )}
                  {d.customer_phone && (
                    <a href={`tel:${d.customer_phone}`} className="debt-action call" style={{ textDecoration: 'none' }}>📞</a>
                  )}
                  <button className="debt-action edit" onClick={() => openEdit(d)} type="button">✏️</button>
                  <button className="debt-action del" onClick={() => del(d)} type="button">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode && (
        <div className="mng-modal-bg" onClick={() => { setMode(null); setEditing(null); }}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{mode === 'add' ? '➕ دين جديد' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">اسم العميل <span className="req">*</span></label>
              <input className="new-service-input" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">رقم الهاتف</label>
              <input className="new-service-input" type="tel" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">المبلغ <span className="req">*</span></label>
                <input className="new-service-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">المدفوع</label>
                <input className="new-service-input" type="number" value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value })} />
              </div>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">العملة</label>
                <select className="new-service-select" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  <option value="SYP">ليرة سورية</option>
                  <option value="USD">دولار</option>
                  <option value="TRY">ليرة تركية</option>
                </select>
              </div>
              <div className="new-service-field">
                <label className="new-service-label">تاريخ الاستحقاق</label>
                <input className="new-service-input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الوصف</label>
              <textarea className="new-service-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => { setMode(null); setEditing(null); }} type="button">إلغاء</button>
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
