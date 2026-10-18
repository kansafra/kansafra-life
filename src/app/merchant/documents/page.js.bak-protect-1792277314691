'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

const DOC_TYPES = [
  { k: 'residence', l: '🏠 شهادة سكن' },
  { k: 'birth', l: '👶 شهادة ميلاد' },
  { k: 'death', l: '⚰️ شهادة وفاة' },
  { k: 'marriage', l: '💍 عقد زواج' },
  { k: 'building_permit', l: '🏗️ تصريح بناء' },
  { k: 'business_permit', l: '💼 رخصة مهنة' },
  { k: 'other', l: '📋 أخرى' },
];

const STATUSES = {
  pending: { l: 'قيد المراجعة', color: '#f59e0b' },
  approved: { l: 'موافق', color: '#16a34a' },
  rejected: { l: 'مرفوض', color: '#dc2626' },
  issued: { l: 'صادر', color: '#0891b2' },
};

export default function DocumentsPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let stored = null;
    try { stored = getSession(); } catch (e) {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const { data } = await supabase.from('civil_documents').select('*').eq('entity_name', ent.display_name).order('created_at', { ascending: false });
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setForm({ doc_type: 'residence', title: '', requester_name: '', requester_phone: '', status: 'pending', fee: 0, notes: '' });
  }

  function openEdit(item) {
    setMode('edit');
    setEditing(item);
    setForm({ ...item });
  }

  async function save() {
    if (!form.title?.trim()) { alert('العنوان مطلوب'); return; }
    setSaving(true);
    const payload = {
      entity_name: entity.display_name,
      doc_type: form.doc_type,
      title: form.title.trim(),
      requester_name: form.requester_name?.trim() || null,
      requester_phone: form.requester_phone?.trim() || null,
      status: form.status,
      fee: Number(form.fee) || 0,
      notes: form.notes?.trim() || null,
      issued_at: form.status === 'issued' ? new Date().toISOString() : null,
    };
    let err;
    if (mode === 'add') {
      ({ error: err } = await supabase.from('civil_documents').insert(payload));
    } else {
      ({ error: err } = await supabase.from('civil_documents').update(payload).eq('id', editing.id));
    }
    setSaving(false);
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    setMode(null); setEditing(null);
    load(entity);
  }

  async function updateStatus(item, status) {
    await supabase.from('civil_documents').update({ status, issued_at: status === 'issued' ? new Date().toISOString() : item.issued_at }).eq('id', item.id);
    load(entity);
  }

  async function del(item) {
    if (!confirm('حذف؟')) return;
    await supabase.from('civil_documents').delete().eq('id', item.id);
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);
  const docLabel = (k) => DOC_TYPES.find((t) => t.k === k)?.l || k;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">📜 الشهادات والتصاريح</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ جديد</button>
      </div>

      <div className="store-cat-scroll" style={{ paddingTop: 14 }}>
        {[
          { k: 'all', l: 'الكل' },
          { k: 'pending', l: 'قيد المراجعة' },
          { k: 'approved', l: 'موافق' },
          { k: 'issued', l: 'صادر' },
          { k: 'rejected', l: 'مرفوض' },
        ].map((f) => (
          <button key={f.k} className={`store-cat-chip ${filter === f.k ? 'active' : ''}`} onClick={() => setFilter(f.k)} type="button">
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">📜</span><p>لا توجد طلبات</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {filtered.map((item) => {
            const st = STATUSES[item.status] || STATUSES.pending;
            return (
              <div key={item.id} className="debt-card">
                <div className="debt-head">
                  <div>
                    <div className="debt-customer">{docLabel(item.doc_type)}</div>
                    <div style={{ fontSize: 12, color: 'var(--n-600)', fontWeight: 700, marginTop: 3 }}>{item.title}</div>
                    {item.requester_name && <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 3 }}>👤 {item.requester_name}</div>}
                    {item.requester_phone && <div style={{ fontSize: 11.5, color: 'var(--n-500)', direction: 'ltr', textAlign: 'right' }}>{item.requester_phone}</div>}
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 900, background: `${st.color}1a`, color: st.color }}>
                    {st.l}
                  </span>
                </div>
                {item.fee > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--n-500)', fontWeight: 700, marginTop: 6 }}>
                    💰 الرسوم: {Number(item.fee).toLocaleString()} ل.س
                  </div>
                )}
                {item.notes && <div style={{ fontSize: 12, color: 'var(--n-500)', marginTop: 6, lineHeight: 1.6 }}>{item.notes}</div>}
                <div className="debt-actions">
                  {item.status === 'pending' && (
                    <>
                      <button className="debt-action pay" onClick={() => updateStatus(item, 'approved')} type="button">✓ موافقة</button>
                      <button className="debt-action del" onClick={() => updateStatus(item, 'rejected')} type="button">✕ رفض</button>
                    </>
                  )}
                  {item.status === 'approved' && (
                    <button className="debt-action pay" onClick={() => updateStatus(item, 'issued')} type="button">📤 إصدار</button>
                  )}
                  <button className="debt-action edit" onClick={() => openEdit(item)} type="button">✏️</button>
                  <button className="debt-action del" onClick={() => del(item)} type="button">🗑️</button>
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
            <h3 className="mng-modal-title">{mode === 'add' ? '➕ طلب جديد' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">نوع المستند</label>
              <select className="new-service-select" value={form.doc_type} onChange={(ev) => setForm({ ...form, doc_type: ev.target.value })}>
                {DOC_TYPES.map((t) => <option key={t.k} value={t.k}>{t.l}</option>)}
              </select>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">العنوان *</label>
              <input className="new-service-input" value={form.title || ''} onChange={(ev) => setForm({ ...form, title: ev.target.value })} />
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">الاسم</label>
                <input className="new-service-input" value={form.requester_name || ''} onChange={(ev) => setForm({ ...form, requester_name: ev.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">الهاتف</label>
                <input className="new-service-input" type="tel" value={form.requester_phone || ''} onChange={(ev) => setForm({ ...form, requester_phone: ev.target.value })} />
              </div>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">الحالة</label>
                <select className="new-service-select" value={form.status} onChange={(ev) => setForm({ ...form, status: ev.target.value })}>
                  <option value="pending">قيد المراجعة</option>
                  <option value="approved">موافق</option>
                  <option value="issued">صادر</option>
                  <option value="rejected">مرفوض</option>
                </select>
              </div>
              <div className="new-service-field">
                <label className="new-service-label">الرسوم</label>
                <input className="new-service-input" type="number" value={form.fee || 0} onChange={(ev) => setForm({ ...form, fee: ev.target.value })} />
              </div>
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
