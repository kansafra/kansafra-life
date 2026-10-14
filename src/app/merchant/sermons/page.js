'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SermonsPage() {
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
    const { data } = await supabase.from('friday_sermons').select('*').eq('mosque_name', ent.display_name).order('sermon_date', { ascending: false });
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setForm({ title: '', khatib: '', sermon_text: '', audio_url: '', video_url: '', sermon_date: new Date().toISOString().slice(0, 10) });
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
      mosque_name: entity.display_name,
      title: form.title.trim(),
      khatib: form.khatib?.trim() || null,
      sermon_text: form.sermon_text?.trim() || null,
      audio_url: form.audio_url?.trim() || null,
      video_url: form.video_url?.trim() || null,
      sermon_date: form.sermon_date || null,
      is_published: true,
    };
    let err;
    if (mode === 'add') {
      ({ error: err } = await supabase.from('friday_sermons').insert(payload));
    } else {
      ({ error: err } = await supabase.from('friday_sermons').update(payload).eq('id', editing.id));
    }
    setSaving(false);
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    setMode(null); setEditing(null);
    load(entity);
  }

  async function del(item) {
    if (!confirm('حذف الخطبة؟')) return;
    await supabase.from('friday_sermons').delete().eq('id', item.id);
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">📖 خطب الجمعة</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ خطبة</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : items.length === 0 ? (
        <div className="sect-empty"><span className="em">📖</span><p>لا توجد خطب بعد</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {items.map((s) => (
            <div key={s.id} className="debt-card" style={{ borderRightColor: '#059669' }}>
              <div className="debt-head">
                <div>
                  <div className="debt-customer">📖 {s.title}</div>
                  {s.khatib && <div style={{ fontSize: 12, color: 'var(--n-500)', marginTop: 3 }}>🎤 {s.khatib}</div>}
                </div>
              </div>
              {s.sermon_date && (
                <div style={{ fontSize: 11.5, color: 'var(--n-500)', fontWeight: 700, marginTop: 8 }}>
                  📅 {new Date(s.sermon_date).toLocaleDateString('ar-EG')}
                </div>
              )}
              {s.sermon_text && (
                <div style={{ fontSize: 12.5, color: 'var(--n-600)', marginTop: 8, lineHeight: 1.7, maxHeight: 60, overflow: 'hidden' }}>
                  {s.sermon_text.slice(0, 150)}{s.sermon_text.length > 150 ? '...' : ''}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {s.audio_url && <a href={s.audio_url} target="_blank" rel="noopener noreferrer" className="debt-action call" style={{ textDecoration: 'none', flex: 1 }}>🎧 صوت</a>}
                {s.video_url && <a href={s.video_url} target="_blank" rel="noopener noreferrer" className="debt-action call" style={{ textDecoration: 'none', flex: 1 }}>🎬 فيديو</a>}
              </div>
              <div className="debt-actions">
                <button className="debt-action edit" onClick={() => openEdit(s)} type="button">✏️ تعديل</button>
                <button className="debt-action del" onClick={() => del(s)} type="button">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode && (
        <div className="mng-modal-bg" onClick={() => { setMode(null); setEditing(null); }}>
          <div className="mng-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{mode === 'add' ? '➕ خطبة جديدة' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">العنوان *</label>
              <input className="new-service-input" value={form.title || ''} onChange={(ev) => setForm({ ...form, title: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الخطيب</label>
              <input className="new-service-input" value={form.khatib || ''} onChange={(ev) => setForm({ ...form, khatib: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">تاريخ الخطبة</label>
              <input className="new-service-input" type="date" value={form.sermon_date || ''} onChange={(ev) => setForm({ ...form, sermon_date: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">نص الخطبة</label>
              <textarea className="new-service-textarea" rows={6} value={form.sermon_text || ''} onChange={(ev) => setForm({ ...form, sermon_text: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">رابط الصوت</label>
              <input className="new-service-input" type="url" value={form.audio_url || ''} onChange={(ev) => setForm({ ...form, audio_url: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">رابط الفيديو</label>
              <input className="new-service-input" type="url" value={form.video_url || ''} onChange={(ev) => setForm({ ...form, video_url: ev.target.value })} />
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
