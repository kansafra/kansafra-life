'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function StudentsPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
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
    const [stRes, clsRes] = await Promise.all([
      supabase.from('students').select('*').eq('school_name', s.display_name).order('full_name'),
      supabase.from('classes').select('*').eq('entity_name', s.display_name).order('grade'),
    ]);
    setStudents(Array.isArray(stRes.data) ? stRes.data : []);
    setClasses(Array.isArray(clsRes.data) ? clsRes.data : []);
    setLoading(false);
  }

  function openNew() {
    setEditing('new');
    setForm({ full_name: '', class_id: '', parent_name: '', parent_phone: '', birth_year: '', student_id: '' });
  }

  function openEdit(st) {
    setEditing(st.id);
    setForm({ ...st });
  }

  async function save() {
    if (!form.full_name?.trim()) { alert('الاسم مطلوب'); return; }
    const payload = {
      school_name: session.display_name,
      full_name: form.full_name.trim(),
      class_id: form.class_id || null,
      parent_name: form.parent_name?.trim() || null,
      parent_phone: form.parent_phone?.trim() || null,
      birth_year: parseInt(form.birth_year) || null,
      student_id: form.student_id?.trim() || null,
      is_active: true,
    };
    let err;
    if (editing === 'new') {
      ({ error: err } = await supabase.from('students').insert(payload));
    } else {
      ({ error: err } = await supabase.from('students').update(payload).eq('id', editing));
    }
    if (err) { alert('تعذّر: ' + err.message); return; }
    setEditing(null);
    load(session);
  }

  async function del(st) {
    if (!confirm(`حذف "${st.full_name}"؟`)) return;
    await supabase.from('students').delete().eq('id', st.id);
    load(session);
  }

  const className = (id) => {
    const c = classes.find((x) => x.id === id);
    return c ? `${c.grade} ${c.section || ''}` : 'بدون صف';
  };

  const filtered = students.filter((st) => {
    if (filter !== 'all' && st.class_id !== filter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return st.full_name?.toLowerCase().includes(q) || st.parent_phone?.includes(q);
  });

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant/school" className="inv-back">→</Link>
        <span className="inv-title">👥 الطلاب</span>
        <button className="mng-add-btn" onClick={openNew} type="button">+ طالب</button>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <input
          type="text"
          placeholder="🔍 ابحث بالاسم أو هاتف الأهل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="new-service-input"
        />
      </div>

      <div className="chips-scroll" style={{ padding: '0 16px 12px' }}>
        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} type="button">
          الكل ({students.length})
        </button>
        {classes.map((c) => {
          const count = students.filter((s) => s.class_id === c.id).length;
          return (
            <button key={c.id} className={`chip ${filter === c.id ? 'active' : ''}`} onClick={() => setFilter(c.id)} type="button">
              {c.grade} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">👥</span><p>لا يوجد طلاب</p></div>
      ) : (
        <div style={{ padding: 16 }}>
          {filtered.map((st) => (
            <div key={st.id} className="debt-card" style={{ borderRightColor: '#22c55e', marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>👤 {st.full_name}</div>
              <div style={{ fontSize: 12, color: 'var(--n-500)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>🏫 {className(st.class_id)}</span>
                {st.parent_phone && <span>📞 {st.parent_phone}</span>}
                {st.birth_year && <span>🎂 {st.birth_year}</span>}
              </div>
              <div className="debt-actions">
                <button className="debt-action edit" onClick={() => openEdit(st)} type="button">✏️</button>
                <button className="debt-action del" onClick={() => del(st)} type="button">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="mng-modal-bg" onClick={() => setEditing(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{editing === 'new' ? '➕ طالب جديد' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">الاسم الكامل *</label>
              <input className="new-service-input" value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
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

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">👨‍👩‍👦 اسم ولي الأمر</label>
                <input className="new-service-input" value={form.parent_name || ''} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">📞 هاتف ولي الأمر</label>
                <input className="new-service-input" type="tel" value={form.parent_phone || ''} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} style={{ direction: 'ltr' }} />
              </div>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">🎂 سنة الميلاد</label>
                <input className="new-service-input" type="number" value={form.birth_year || ''} onChange={(e) => setForm({ ...form, birth_year: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">🆔 رقم الطالب</label>
                <input className="new-service-input" value={form.student_id || ''} onChange={(e) => setForm({ ...form, student_id: e.target.value })} />
              </div>
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
