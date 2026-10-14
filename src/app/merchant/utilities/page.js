'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const UTILITY_TYPES = [
  { k: 'water', l: '💧 المياه', color: '#0891b2' },
  { k: 'electricity', l: '⚡ الكهرباء', color: '#f59e0b' },
  { k: 'waste', l: '🗑️ النفايات', color: '#16a34a' },
];

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function UtilitiesPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const { data } = await supabase.from('utility_schedules').select('*').eq('entity_name', ent.display_name).order('created_at', { ascending: false });
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setForm({ utility_type: 'water', area: '', schedule_day: 'الأحد', start_time: '08:00', end_time: '10:00', notes: '' });
  }

  function openEdit(item) {
    setMode('edit');
    setEditing(item);
    setForm({ ...item });
  }

  async function save() {
    if (!form.area?.trim()) { alert('المنطقة مطلوبة'); return; }
    setSaving(true);
    const payload = {
      entity_name: entity.display_name,
      utility_type: form.utility_type,
      area: form.area.trim(),
      schedule_day: form.schedule_day,
      start_time: form.start_time,
      end_time: form.end_time,
      notes: form.notes?.trim() || null,
      is_active: form.is_active !== false,
    };
    let err;
    if (mode === 'add') {
      ({ error: err } = await supabase.from('utility_schedules').insert(payload));
    } else {
      ({ error: err } = await supabase.from('utility_schedules').update(payload).eq('id', editing.id));
    }
    setSaving(false);
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    setMode(null); setEditing(null);
    load(entity);
  }

  async function del(item) {
    if (!confirm('حذف هذا الجدول؟')) return;
    await supabase.from('utility_schedules').delete().eq('id', item.id);
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">🏛️ خدمات البلدية</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ جدول</button>
      </div>

      <div style={{ padding: '14px 20px 0', fontSize: 12.5, color: 'var(--n-600)', fontWeight: 600, lineHeight: 1.7 }}>
        جدول المياه والكهرباء والنفايات — يظهر للزوار
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : items.length === 0 ? (
        <div className="sect-empty"><span className="em">🏛️</span><p>لا توجد جداول</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {UTILITY_TYPES.map((type) => {
            const list = items.filter((i) => i.utility_type === type.k);
            if (list.length === 0) return null;
            return (
              <div key={type.k} style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: type.color, marginBottom: 10 }}>{type.l}</h3>
                {list.map((item) => (
                  <div key={item.id} className="debt-card" style={{ borderRightColor: type.color, marginBottom: 8 }}>
                    <div className="debt-head">
                      <div>
                        <div className="debt-customer">📍 {item.area}</div>
                        <div style={{ fontSize: 12, color: 'var(--n-500)', fontWeight: 700, marginTop: 4 }}>
                          📅 {item.schedule_day} · 🕐 {item.start_time} — {item.end_time}
                        </div>
                      </div>
                    </div>
                    {item.notes && <div style={{ fontSize: 12, color: 'var(--n-500)', marginTop: 6 }}>{item.notes}</div>}
                    <div className="debt-actions">
                      <button className="debt-action edit" onClick={() => openEdit(item)} type="button">✏️</button>
                      <button className="debt-action del" onClick={() => del(item)} type="button">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {mode && (
        <div className="mng-modal-bg" onClick={() => { setMode(null); setEditing(null); }}>
          <div className="mng-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{mode === 'add' ? '➕ جدول جديد' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">نوع الخدمة</label>
              <select className="new-service-select" value={form.utility_type} onChange={(ev) => setForm({ ...form, utility_type: ev.target.value })}>
                {UTILITY_TYPES.map((t) => <option key={t.k} value={t.k}>{t.l}</option>)}
              </select>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">المنطقة *</label>
              <input className="new-service-input" value={form.area || ''} onChange={(ev) => setForm({ ...form, area: ev.target.value })} placeholder="مثال: حي المركز" />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">اليوم</label>
              <select className="new-service-select" value={form.schedule_day} onChange={(ev) => setForm({ ...form, schedule_day: ev.target.value })}>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">من</label>
                <input className="new-service-input" type="time" value={form.start_time || ''} onChange={(ev) => setForm({ ...form, start_time: ev.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">إلى</label>
                <input className="new-service-input" type="time" value={form.end_time || ''} onChange={(ev) => setForm({ ...form, end_time: ev.target.value })} />
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
