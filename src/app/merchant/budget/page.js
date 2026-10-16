'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function BudgetPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [tab, setTab] = useState('budget');
  const [budget, setBudget] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = getSession(); } catch (e) {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const [b, p] = await Promise.all([
      supabase.from('municipal_budget').select('*').eq('entity_name', ent.display_name).order('transaction_date', { ascending: false }),
      supabase.from('municipal_projects').select('*').eq('entity_name', ent.display_name).order('created_at', { ascending: false }),
    ]);
    setBudget(Array.isArray(b.data) ? b.data : []);
    setProjects(Array.isArray(p.data) ? p.data : []);
    setLoading(false);
  }

  function openAddBudget() {
    setTab('budget');
    setMode('add-budget');
    setForm({ title: '', transaction_type: 'expense', amount: '', category: '', description: '', transaction_date: new Date().toISOString().slice(0, 10), is_public: true });
  }

  function openAddProject() {
    setTab('projects');
    setMode('add-project');
    setForm({ title: '', description: '', status: 'planned', progress: 0, budget: 0, spent: 0, start_date: '', end_date: '' });
  }

  function openEdit(type, item) {
    setMode('edit-' + type);
    setEditing(item);
    setForm({ ...item });
  }

  async function saveBudget() {
    if (!form.title?.trim()) { alert('العنوان مطلوب'); return; }
    if (!form.amount || Number(form.amount) <= 0) { alert('المبلغ مطلوب'); return; }
    setSaving(true);
    const payload = {
      entity_name: entity.display_name,
      title: form.title.trim(),
      transaction_type: form.transaction_type,
      amount: Number(form.amount),
      category: form.category?.trim() || null,
      description: form.description?.trim() || null,
      transaction_date: form.transaction_date || new Date().toISOString().slice(0, 10),
      is_public: form.is_public !== false,
    };
    let err;
    if (mode === 'add-budget') {
      ({ error: err } = await supabase.from('municipal_budget').insert(payload));
    } else {
      ({ error: err } = await supabase.from('municipal_budget').update(payload).eq('id', editing.id));
    }
    setSaving(false);
    if (err) { alert('تعذّر: ' + err.message); return; }
    setMode(null); setEditing(null);
    load(entity);
  }

  async function saveProject() {
    if (!form.title?.trim()) { alert('العنوان مطلوب'); return; }
    setSaving(true);
    const payload = {
      entity_name: entity.display_name,
      title: form.title.trim(),
      description: form.description?.trim() || null,
      status: form.status || 'planned',
      progress: Number(form.progress) || 0,
      budget: Number(form.budget) || 0,
      spent: Number(form.spent) || 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };
    let err;
    if (mode === 'add-project') {
      ({ error: err } = await supabase.from('municipal_projects').insert(payload));
    } else {
      ({ error: err } = await supabase.from('municipal_projects').update(payload).eq('id', editing.id));
    }
    setSaving(false);
    if (err) { alert('تعذّر: ' + err.message); return; }
    setMode(null); setEditing(null);
    load(entity);
  }

  async function delBudget(item) {
    if (!confirm('حذف؟')) return;
    await supabase.from('municipal_budget').delete().eq('id', item.id);
    load(entity);
  }

  async function delProject(item) {
    if (!confirm('حذف المشروع؟')) return;
    await supabase.from('municipal_projects').delete().eq('id', item.id);
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const income = budget.filter((b) => b.transaction_type === 'income').reduce((s, b) => s + Number(b.amount || 0), 0);
  const expense = budget.filter((b) => b.transaction_type === 'expense').reduce((s, b) => s + Number(b.amount || 0), 0);
  const balance = income - expense;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">💰 الميزانية والمشاريع</span>
        <button className="mng-add-btn" onClick={tab === 'budget' ? openAddBudget : openAddProject} type="button">+ جديد</button>
      </div>

      <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div className="debt-stat" style={{ padding: 12 }}>
          <div className="debt-stat-val" style={{ fontSize: 15, color: '#16a34a' }}>{income.toLocaleString()}</div>
          <div className="debt-stat-lbl">إيرادات</div>
        </div>
        <div className="debt-stat danger" style={{ padding: 12 }}>
          <div className="debt-stat-val" style={{ fontSize: 15, color: '#dc2626' }}>{expense.toLocaleString()}</div>
          <div className="debt-stat-lbl">مصروفات</div>
        </div>
        <div className="debt-stat warn" style={{ padding: 12 }}>
          <div className="debt-stat-val" style={{ fontSize: 15 }}>{balance.toLocaleString()}</div>
          <div className="debt-stat-lbl">الرصيد</div>
        </div>
      </div>

      <div className="store-cat-scroll" style={{ paddingTop: 8 }}>
        <button className={`store-cat-chip ${tab === 'budget' ? 'active' : ''}`} onClick={() => setTab('budget')} type="button">💰 الميزانية</button>
        <button className={`store-cat-chip ${tab === 'projects' ? 'active' : ''}`} onClick={() => setTab('projects')} type="button">🏗️ المشاريع ({projects.length})</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : tab === 'budget' ? (
        budget.length === 0 ? (
          <div className="sect-empty"><span className="em">💰</span><p>لا توجد معاملات</p></div>
        ) : (
          <div style={{ padding: 20 }}>
            {budget.map((b) => (
              <div key={b.id} className="debt-card" style={{ borderRightColor: b.transaction_type === 'income' ? '#16a34a' : '#dc2626' }}>
                <div className="debt-head">
                  <div>
                    <div className="debt-customer">{b.transaction_type === 'income' ? '💰' : '💸'} {b.title}</div>
                    {b.category && <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 3 }}>🏷️ {b.category}</div>}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 900, color: b.transaction_type === 'income' ? '#16a34a' : '#dc2626', direction: 'ltr' }}>
                    {b.transaction_type === 'income' ? '+' : '−'}{Number(b.amount).toLocaleString()}
                  </span>
                </div>
                {b.description && <div style={{ fontSize: 12, color: 'var(--n-600)', marginTop: 6 }}>{b.description}</div>}
                <div style={{ fontSize: 11, color: 'var(--n-400)', marginTop: 6 }}>{new Date(b.transaction_date).toLocaleDateString('ar-EG')}</div>
                <div className="debt-actions">
                  <button className="debt-action edit" onClick={() => openEdit('budget', b)} type="button">✏️</button>
                  <button className="debt-action del" onClick={() => delBudget(b)} type="button">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        projects.length === 0 ? (
          <div className="sect-empty"><span className="em">🏗️</span><p>لا توجد مشاريع</p></div>
        ) : (
          <div style={{ padding: 20 }}>
            {projects.map((p) => (
              <div key={p.id} className="debt-card" style={{ borderRightColor: '#8b5cf6' }}>
                <div className="debt-head">
                  <div>
                    <div className="debt-customer">🏗️ {p.title}</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 900, background: 'rgba(139,92,246,.15)', color: '#8b5cf6' }}>
                    {p.status === 'planned' ? 'مخطط' : p.status === 'in_progress' ? 'قيد التنفيذ' : p.status === 'done' ? 'منجز' : p.status}
                  </span>
                </div>
                {p.description && <div style={{ fontSize: 12, color: 'var(--n-600)', marginTop: 6, lineHeight: 1.6 }}>{p.description}</div>}
                <div className="debt-progress" style={{ marginTop: 10 }}>
                  <div className="debt-progress-fill" style={{ width: `${p.progress}%` }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--n-500)', marginTop: 6, fontWeight: 700 }}>
                  {p.progress}% · 💰 {Number(p.spent).toLocaleString()} / {Number(p.budget).toLocaleString()}
                </div>
                <div className="debt-actions">
                  <button className="debt-action edit" onClick={() => openEdit('project', p)} type="button">✏️</button>
                  <button className="debt-action del" onClick={() => delProject(p)} type="button">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {mode && (
        <div className="mng-modal-bg" onClick={() => { setMode(null); setEditing(null); }}>
          <div className="mng-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">
              {mode.includes('budget') ? '💰 معاملة' : '🏗️ مشروع'}
            </h3>

            {mode.includes('budget') ? (
              <>
                <div className="new-service-field">
                  <label className="new-service-label">العنوان *</label>
                  <input className="new-service-input" value={form.title || ''} onChange={(ev) => setForm({ ...form, title: ev.target.value })} />
                </div>
                <div className="new-prod-row">
                  <div className="new-service-field">
                    <label className="new-service-label">النوع</label>
                    <select className="new-service-select" value={form.transaction_type} onChange={(ev) => setForm({ ...form, transaction_type: ev.target.value })}>
                      <option value="income">💰 إيراد</option>
                      <option value="expense">💸 مصروف</option>
                    </select>
                  </div>
                  <div className="new-service-field">
                    <label className="new-service-label">المبلغ *</label>
                    <input className="new-service-input" type="number" value={form.amount || ''} onChange={(ev) => setForm({ ...form, amount: ev.target.value })} />
                  </div>
                </div>
                <div className="new-service-field">
                  <label className="new-service-label">الفئة</label>
                  <input className="new-service-input" value={form.category || ''} onChange={(ev) => setForm({ ...form, category: ev.target.value })} placeholder="مثال: مياه، كهرباء..." />
                </div>
                <div className="new-service-field">
                  <label className="new-service-label">التاريخ</label>
                  <input className="new-service-input" type="date" value={form.transaction_date || ''} onChange={(ev) => setForm({ ...form, transaction_date: ev.target.value })} />
                </div>
                <div className="new-service-field">
                  <label className="new-service-label">الوصف</label>
                  <textarea className="new-service-textarea" rows={2} value={form.description || ''} onChange={(ev) => setForm({ ...form, description: ev.target.value })} />
                </div>
                <div className="admin-form-actions">
                  <button className="mng-btn ghost" onClick={() => { setMode(null); setEditing(null); }} type="button">إلغاء</button>
                  <button className="mng-btn primary" onClick={saveBudget} disabled={saving} type="button">{saving ? '...' : '✓ حفظ'}</button>
                </div>
              </>
            ) : (
              <>
                <div className="new-service-field">
                  <label className="new-service-label">اسم المشروع *</label>
                  <input className="new-service-input" value={form.title || ''} onChange={(ev) => setForm({ ...form, title: ev.target.value })} />
                </div>
                <div className="new-service-field">
                  <label className="new-service-label">الوصف</label>
                  <textarea className="new-service-textarea" rows={3} value={form.description || ''} onChange={(ev) => setForm({ ...form, description: ev.target.value })} />
                </div>
                <div className="new-prod-row">
                  <div className="new-service-field">
                    <label className="new-service-label">الحالة</label>
                    <select className="new-service-select" value={form.status || 'planned'} onChange={(ev) => setForm({ ...form, status: ev.target.value })}>
                      <option value="planned">مخطط</option>
                      <option value="in_progress">قيد التنفيذ</option>
                      <option value="done">منجز</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                  <div className="new-service-field">
                    <label className="new-service-label">التقدم %</label>
                    <input className="new-service-input" type="number" min="0" max="100" value={form.progress || 0} onChange={(ev) => setForm({ ...form, progress: ev.target.value })} />
                  </div>
                </div>
                <div className="new-prod-row">
                  <div className="new-service-field">
                    <label className="new-service-label">الميزانية</label>
                    <input className="new-service-input" type="number" value={form.budget || 0} onChange={(ev) => setForm({ ...form, budget: ev.target.value })} />
                  </div>
                  <div className="new-service-field">
                    <label className="new-service-label">المصروف</label>
                    <input className="new-service-input" type="number" value={form.spent || 0} onChange={(ev) => setForm({ ...form, spent: ev.target.value })} />
                  </div>
                </div>
                <div className="admin-form-actions">
                  <button className="mng-btn ghost" onClick={() => { setMode(null); setEditing(null); }} type="button">إلغاء</button>
                  <button className="mng-btn primary" onClick={saveProject} disabled={saving} type="button">{saving ? '...' : '✓ حفظ'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
