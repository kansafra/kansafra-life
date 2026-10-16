'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function TeachersPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
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
    const { data } = await supabase
      .from('teachers')
      .select('*')
      .eq('entity_name', s.display_name)
      .order('full_name');
    setTeachers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openNew() {
    setEditing('new');
    setForm({ full_name: '', phone: '', email: '', specialization: '', salary: 0 });
  }

  function openEdit(t) {
    setEditing(t.id);
    setForm({ ...t });
  }

  async function save() {
    if (!form.full_name?.trim()) { alert('الاسم مطلوب'); return; }
    const payload = {
      entity_id: session.id,
      entity_name: session.display_name,
      full_name: form.full_name.trim(),
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      specialization: form.specialization?.trim() || null,
      salary: parseFloat(form.salary) || 0,
      is_active: form.is_active !== false,
    };
    let err;
    if (editing === 'new') {
      ({ error: err } = await supabase.from('teachers').insert(payload));
    } else {
      ({ error: err } = await supabase.from('teachers').update(payload).eq('id', editing));
    }
    if (err) { alert('تعذّر: ' + err.message); return; }
    setEditing(null);
    load(session);
  }

  async function del(t) {
    if (!confirm(`حذف "${t.full_name}"؟`)) return;
    await supabase.from('teachers').delete().eq('id', t.id);
    load(session);
  }

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant/school" className="inv-back">→</Link>
        <span className="inv-title">👨‍🏫 الأساتذة</span>
        <button className="mng-add-btn" onClick={openNew} type="button">+ أستاذ</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : teachers.length === 0 ? (
        <div className="sect-empty"><span className="em">👨‍🏫</span><p>لا يوجد أساتذة</p></div>
      ) : (
        <div style={{ padding: 16 }}>
          {teachers.map((t) => (
            <div key={t.id} className="debt-card" style={{ borderRightColor: '#0ea5e9', marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>
                👨‍🏫 {t.full_name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--n-500)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {t.specialization && <span>📚 {t.specialization}</span>}
                {t.phone && <span>📞 {t.phone}</span>}
              </div>
              <div className="debt-actions">
                <button className="debt-action edit" onClick={() => openEdit(t)} type="button">✏️</button>
                <button className="debt-action del" onClick={() => del(t)} type="button">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="mng-modal-bg" onClick={() => setEditing(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{editing === 'new' ? '➕ أستاذ جديد' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">الاسم *</label>
              <input className="new-service-input" value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">📞 الهاتف</label>
                <input className="new-service-input" type="tel" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ direction: 'ltr' }} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">📚 التخصص</label>
                <input className="new-service-input" value={form.specialization || ''} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">📧 الإيميل</label>
              <input className="new-service-input" type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ direction: 'ltr' }} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">💰 الراتب</label>
              <input className="new-service-input" type="number" value={form.salary || 0} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
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
