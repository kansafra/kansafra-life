'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const SERVICE_TYPES = [
  { k: 'water', l: '💧 المياه', color: '#0891b2' },
  { k: 'electricity', l: '⚡ الكهرباء', color: '#f59e0b' },
  { k: 'waste', l: '🗑️ النفايات', color: '#16a34a' },
  { k: 'road', l: '🛣️ الطرق', color: '#8b5cf6' },
  { k: 'certificate', l: '📜 الشهادات', color: '#dc2626' },
  { k: 'permit', l: '📋 التصاريح', color: '#3b82f6' },
  { k: 'complaint', l: '📩 الشكاوى', color: '#ea580c' },
  { k: 'project', l: '🏗️ المشاريع', color: '#0891b2' },
];

export default function MunicipalPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const { data } = await supabase.from('municipal_services').select('*').eq('entity_name', ent.display_name).order('created_at', { ascending: false });
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setForm({ service_type: 'water', title: '', description: '', location_text: '', scheduled_at: '', status: 'active' });
  }

  function openEdit(item) {
    setMode('edit');
    setEditing(item);
    setForm({ ...item });
  }

  async function save() {
    if (!form.title?.trim()) { alert('العنوان مطلوب'); return; }
    const payload = {
      entity_name: entity.display_name,
      service_type: form.service_type,
      title: form.title.trim(),
      description: form.description?.trim() || null,
      location_text: form.location_text?.trim() || null,
      scheduled_at: form.scheduled_at || null,
      status: form.status || 'active',
    };
    let err;
    if (mode === 'add') {
      ({ error: err } = await supabase.from('municipal_services').insert(payload));
    } else {
      ({ error: err } = await supabase.from('municipal_services').update(payload).eq('id', editing.id));
    }
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    setMode(null); setEditing(null);
    load(entity);
  }

  async function del(item) {
    if (!confirm('حذف هذا العنصر؟')) return;
    await supabase.from('municipal_services').delete().eq('id', item.id);
    setDeleting(null);
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">🏛️ خدمات البلدية</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ جديد</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : items.length === 0 ? (
        <div className="sect-empty">
          <span className="em">🏛️</span>
          <p>لا توجد خدمات</p>
          <button className="mng-add-btn" onClick={openAdd} type="button" style={{ marginTop: 16 }}>+ إضافة خدمة</button>
        </div>
      ) : (
        <div style={{ padding: 20 }}>
          {items.map((it) => {
            const cfg = SERVICE_TYPES.find((s) => s.k === it.service_type) || SERVICE_TYPES[0];
            return (
              <div key={it.id} className="debt-card" style={{ borderRightColor: cfg.color }}>
                <div className="debt-head">
                  <div>
                    <div className="debt-customer">{cfg.l} — {it.title}</div>
                    {it.location_text && <div className="debt-phone">📍 {it.location_text}</div>}
                  </div>
                  <span className={`debt-badge ${it.status === 'active' ? 'active' : 'paid'}`}>
                    {it.status === 'active' ? 'نشط' : it.status === 'done' ? 'منجز' : it.status}
                  </span>
                </div>
                {it.description && (
                  <div style={{ fontSize: 12, color: 'var(--n-500)', marginTop: 8, lineHeight: 1.6 }}>
                    {it.description}
                  </div>
                )}
                {it.scheduled_at && (
                  <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 6, fontWeight: 700 }}>
                    🕐 {new Date(it.scheduled_at).toLocaleString('ar-EG')}
                  </div>
                )}
                <div className="debt-actions">
                  <button className="debt-action edit" onClick={() => openEdit(it)} type="button">✏️ تعديل</button>
                  <button className="debt-action del" onClick={() => del(it)} type="button">🗑️</button>
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
            <h3 className="mng-modal-title">{mode === 'add' ? '➕ خدمة جديدة' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">نوع الخدمة</label>
              <select className="new-service-select" value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })}>
                {SERVICE_TYPES.map((s) => <option key={s.k} value={s.k}>{s.l}</option>)}
              </select>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">العنوان *</label>
              <input className="new-service-input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الوصف</label>
              <textarea className="new-service-textarea" rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">الموقع</label>
                <input className="new-service-input" value={form.location_text || ''} onChange={(e) => setForm({ ...form, location_text: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">الموعد</label>
                <input className="new-service-input" type="datetime-local" value={form.scheduled_at ? form.scheduled_at.slice(0, 16) : ''} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الحالة</label>
              <select className="new-service-select" value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">نشط</option>
                <option value="pending">قيد التنفيذ</option>
                <option value="done">منجز</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => { setMode(null); setEditing(null); }} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} type="button">✓ حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
