'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const FEE_TYPES = [
  { k: 'tuition', l: '📚 رسوم دراسية' },
  { k: 'transport', l: '🚌 نقل' },
  { k: 'books', l: '📖 كتب' },
  { k: 'uniform', l: '👕 زي مدرسي' },
  { k: 'activities', l: '🎯 أنشطة' },
  { k: 'other', l: '📋 أخرى' },
];

export default function FeesPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const [f, s] = await Promise.all([
      supabase.from('school_fees').select('*').eq('school_name', ent.display_name).order('created_at', { ascending: false }),
      supabase.from('students').select('id,full_name,parent_phone').eq('school_name', ent.display_name).eq('is_active', true).order('full_name'),
    ]);
    setFees(Array.isArray(f.data) ? f.data : []);
    setStudents(Array.isArray(s.data) ? s.data : []);
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setForm({ student_name: '', amount: '', paid: 0, fee_type: 'tuition', due_date: '', notes: '' });
  }

  function openEdit(f) {
    setMode('edit');
    setEditing(f);
    setForm({
      student_name: f.student_name,
      amount: f.amount,
      paid: f.paid || 0,
      fee_type: f.fee_type || 'tuition',
      due_date: f.due_date || '',
      notes: f.notes || '',
      status: f.status || 'pending',
    });
  }

  async function save() {
    if (!form.student_name?.trim()) { alert('اسم الطالب مطلوب'); return; }
    if (!form.amount || Number(form.amount) <= 0) { alert('المبلغ مطلوب'); return; }
    setSaving(true);
    const payload = {
      school_name: entity.display_name,
      student_name: form.student_name.trim(),
      amount: Number(form.amount),
      paid: Number(form.paid) || 0,
      fee_type: form.fee_type || 'tuition',
      due_date: form.due_date || null,
      notes: form.notes?.trim() || null,
      status: form.status || (Number(form.paid) >= Number(form.amount) ? 'paid' : 'pending'),
    };
    let err;
    if (mode === 'add') {
      ({ error: err } = await supabase.from('school_fees').insert(payload));
    } else {
      ({ error: err } = await supabase.from('school_fees').update(payload).eq('id', editing.id));
    }
    setSaving(false);
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    setMode(null); setEditing(null);
    load(entity);
  }

  async function addPayment(fee, amount) {
    const newPaid = (Number(fee.paid) || 0) + amount;
    const status = newPaid >= Number(fee.amount) ? 'paid' : 'pending';
    await supabase.from('school_fees').update({ paid: newPaid, status }).eq('id', fee.id);
    load(entity);
  }

  async function quickPay(fee) {
    const remaining = Number(fee.amount) - (Number(fee.paid) || 0);
    const input = prompt(`المتبقي: ${remaining.toLocaleString()}\n\nأدخل المبلغ المدفوع:`, remaining);
    if (!input) return;
    const amount = Number(input);
    if (isNaN(amount) || amount <= 0) { alert('مبلغ غير صحيح'); return; }
    await addPayment(fee, amount);
  }

  async function del(f) {
    if (!confirm('حذف هذه الرسوم؟')) return;
    await supabase.from('school_fees').delete().eq('id', f.id);
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const filtered = filter === 'all' ? fees : fees.filter((f) => f.status === filter);
  const totalAmount = fees.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + Number(f.paid || 0), 0);

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">💰 الرسوم</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ رسوم</button>
      </div>

      {!loading && fees.length > 0 && (
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div className="debt-stat" style={{ padding: 12 }}>
            <div className="debt-stat-val" style={{ fontSize: 16 }}>{totalAmount.toLocaleString()}</div>
            <div className="debt-stat-lbl">الإجمالي</div>
          </div>
          <div className="debt-stat warn" style={{ padding: 12 }}>
            <div className="debt-stat-val" style={{ fontSize: 16, color: '#16a34a' }}>{totalPaid.toLocaleString()}</div>
            <div className="debt-stat-lbl">مدفوع</div>
          </div>
          <div className="debt-stat danger" style={{ padding: 12 }}>
            <div className="debt-stat-val" style={{ fontSize: 16, color: '#dc2626' }}>{(totalAmount - totalPaid).toLocaleString()}</div>
            <div className="debt-stat-lbl">متبقي</div>
          </div>
        </div>
      )}

      <div className="store-cat-scroll" style={{ paddingTop: 8 }}>
        <button className={`store-cat-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} type="button">الكل</button>
        <button className={`store-cat-chip ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')} type="button">قيد السداد</button>
        <button className={`store-cat-chip ${filter === 'paid' ? 'active' : ''}`} onClick={() => setFilter('paid')} type="button">مسدد</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">💰</span><p>لا توجد رسوم</p></div>
      ) : (
        <div style={{ padding: '14px 20px 30px' }}>
          {filtered.map((f) => {
            const remaining = Number(f.amount) - (Number(f.paid) || 0);
            const progress = (Number(f.paid) / Number(f.amount)) * 100;
            const typeLabel = FEE_TYPES.find((t) => t.k === f.fee_type)?.l || f.fee_type;
            return (
              <div key={f.id} className={`debt-card ${f.status === 'paid' ? 'paid' : remaining > 0 && f.due_date && f.due_date < new Date().toISOString().slice(0, 10) ? 'overdue' : ''}`}>
                <div className="debt-head">
                  <div>
                    <div className="debt-customer">👤 {f.student_name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--n-500)', fontWeight: 700, marginTop: 3 }}>{typeLabel}</div>
                  </div>
                  <span className={`debt-badge ${f.status === 'paid' ? 'paid' : 'active'}`}>
                    {f.status === 'paid' ? 'مسدد' : 'قيد السداد'}
                  </span>
                </div>

                <div className="debt-amounts">
                  <div className="debt-amount-item">
                    <div className="debt-amount-val">{Number(f.amount).toLocaleString()}</div>
                    <div className="debt-amount-lbl">الإجمالي</div>
                  </div>
                  <div className="debt-amount-item">
                    <div className="debt-amount-val green">{Number(f.paid || 0).toLocaleString()}</div>
                    <div className="debt-amount-lbl">مدفوع</div>
                  </div>
                  <div className="debt-amount-item">
                    <div className="debt-amount-val red">{remaining.toLocaleString()}</div>
                    <div className="debt-amount-lbl">متبقي</div>
                  </div>
                </div>

                <div className="debt-progress">
                  <div className="debt-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>

                {f.due_date && (
                  <div style={{ fontSize: 11.5, color: 'var(--n-500)', fontWeight: 700 }}>
                    📅 الاستحقاق: {new Date(f.due_date).toLocaleDateString('ar-EG')}
                  </div>
                )}

                <div className="debt-actions">
                  {f.status !== 'paid' && (
                    <button className="debt-action pay" onClick={() => quickPay(f)} type="button">💰 دفع</button>
                  )}
                  <button className="debt-action edit" onClick={() => openEdit(f)} type="button">✏️</button>
                  <button className="debt-action del" onClick={() => del(f)} type="button">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode && (
        <div className="mng-modal-bg" onClick={() => { setMode(null); setEditing(null); }}>
          <div className="mng-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{mode === 'add' ? '➕ رسوم جديدة' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">الطالب *</label>
              <select className="new-service-select" value={form.student_name} onChange={(ev) => setForm({ ...form, student_name: ev.target.value })}>
                <option value="">— اختر —</option>
                {students.map((s) => <option key={s.id} value={s.full_name}>{s.full_name}</option>)}
              </select>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">نوع الرسوم</label>
              <select className="new-service-select" value={form.fee_type || 'tuition'} onChange={(ev) => setForm({ ...form, fee_type: ev.target.value })}>
                {FEE_TYPES.map((t) => <option key={t.k} value={t.k}>{t.l}</option>)}
              </select>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">المبلغ *</label>
                <input className="new-service-input" type="number" value={form.amount || ''} onChange={(ev) => setForm({ ...form, amount: ev.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">المدفوع</label>
                <input className="new-service-input" type="number" value={form.paid || 0} onChange={(ev) => setForm({ ...form, paid: ev.target.value })} />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">تاريخ الاستحقاق</label>
              <input className="new-service-input" type="date" value={form.due_date || ''} onChange={(ev) => setForm({ ...form, due_date: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">ملاحظات</label>
              <textarea className="new-service-textarea" rows={2} value={form.notes || ''} onChange={(ev) => setForm({ ...form, notes: ev.target.value })} />
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
