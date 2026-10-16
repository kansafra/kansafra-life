'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function SubjectsPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession(s);
    load(s);
  }, [router]);

  async function load(s) {
    if (!supabase) { setLoading(false); return; }
    const [subRes, clsRes, tchRes] = await Promise.all([
      supabase.from('subjects').select('*').eq('entity_name', s.display_name).order('name'),
      supabase.from('classes').select('*').eq('entity_name', s.display_name).order('grade'),
      supabase.from('teachers').select('*').eq('entity_name', s.display_name).order('full_name'),
    ]);
    setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
    setClasses(Array.isArray(clsRes.data) ? clsRes.data : []);
    setTeachers(Array.isArray(tchRes.data) ? tchRes.data : []);
    setLoading(false);
  }

  function openNew() {
    setEditing('new');
    setForm({ name: '', class_id: '', teacher_id: '', weekly_hours: 3 });
  }

  function openEdit(sub) {
    setEditing(sub.id);
    setForm({ ...sub });
  }

  async function save() {
    if (!form.name?.trim()) { alert('اسم المادة مطلوب'); return; }
    const payload = {
      entity_id: session.id,
      entity_name: session.display_name,
      name: form.name.trim(),
      class_id: form.class_id || null,
      teacher_id: form.teacher_id || null,
      weekly_hours: parseInt(form.weekly_hours) || 3,
    };
    let err;
    if (editing === 'new') {
      ({ error: err } = await supabase.from('subjects').insert(payload));
    } else {
      ({ error: err } = await supabase.from('subjects').update(payload).eq('id', editing));
    }
    if (err) { alert('تعذّر: ' + err.message); return; }
    setEditing(null);
    load(session);
  }

  async function del(sub) {
    if (!confirm(`حذف "${sub.name}"؟`)) return;
    await supabase.from('subjects').delete().eq('id', sub.id);
    load(session);
  }

  const className = (id) => classes.find((c) => c.id === id)?.grade || 'عام';
  const teacherName = (id) => teachers.find((t) => t.id === id)?.full_name || 'غير محدد';

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant/school" className="inv-back">→</Link>
        <span className="inv-title">📖 المواد الدراسية</span>
        <button className="mng-add-btn" onClick={openNew} type="button">+ مادة</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : subjects.length === 0 ? (
        <div className="sect-empty"><span className="em">📖</span><p>لا توجد مواد</p></div>
      ) : (
        <div style={{ padding: 16 }}>
          {subjects.map((sub) => (
            <div key={sub.id} className="debt-card" style={{ borderRightColor: '#f59e0b', marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>📖 {sub.name}</div>
              <div style={{ fontSize: 12, color: 'var(--n-500)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>🏫 {className(sub.class_id)}</span>
                <span>👨‍🏫 {teacherName(sub.teacher_id)}</span>
                <span>⏰ {sub.weekly_hours} حصة/أسبوع</span>
              </div>
              <div className="debt-actions">
                <button className="debt-action edit" onClick={() => openEdit(sub)} type="button">✏️</button>
                <button className="debt-action del" onClick={() => del(sub)} type="button">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="mng-modal-bg" onClick={() => setEditing(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{editing === 'new' ? '➕ مادة جديدة' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">اسم المادة *</label>
              <input className="new-service-input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: رياضيات" />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">🏫 الصف</label>
              <select className="new-service-select" value={form.class_id || ''} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
                <option value="">— اختر —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.grade} {c.section || ''}</option>
                ))}
              </select>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">👨‍🏫 الأستاذ</label>
              <select className="new-service-select" value={form.teacher_id || ''} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}>
                <option value="">— اختر —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">⏰ عدد الحصص الأسبوعية</label>
              <input className="new-service-input" type="number" value={form.weekly_hours || 3} onChange={(e) => setForm({ ...form, weekly_hours: e.target.value })} />
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
