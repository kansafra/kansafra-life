'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import ImageUploader from '@/components/ImageUploader';
import FileUploader from '@/components/FileUploader';

async function getModerationStatus(supabase, entity) {
  try {
    const { data: settings } = await supabase.from('app_settings').select('key, value').in('key', ['moderation_enabled', 'auto_publish_all']);
    const s = {};
    (settings || []).forEach((x) => { s[x.key] = x.value; });
    if (s.moderation_enabled === 'false' || s.moderation_enabled === undefined) return { status: 'approved' };
    if (s.auto_publish_all === 'true') return { status: 'approved' };
    const { data: ent } = await supabase.from('entities').select('is_trusted').eq('id', entity.id).maybeSingle();
    if (ent?.is_trusted) return { status: 'auto' };
    return { status: 'pending' };
  } catch (e) { return { status: 'approved' }; }
}


export default function EventsPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [form, setForm] = useState({});

  useEffect(() => {
    let s = null;
    try { s = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!s) { router.replace('/login'); return; }
    setEntity(s);
    load(s);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const { data } = await supabase.from('sports_events').select('*').eq('entity_name', ent.display_name).order('event_date', { ascending: false });
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setForm({ title: '', description: '', event_date: '', location: '', registration_fee: 0, max_participants: 0 });
  }

  function openEdit(x) {
    setMode('edit');
    setEditing(x);
    setForm({ ...x });
  }

  async function save() {
    if (!form.title?.trim()) { alert('العنوان مطلوب'); return; }
    const payload = {
      entity_name: entity.display_name,
      title: form.title.trim(),
      description: form.description?.trim() || null,
      event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
      location: form.location?.trim() || null,
      registration_fee: Number(form.registration_fee) || 0,
      max_participants: Number(form.max_participants) || 0,
      image_url: f.image_url || null,
      file_url: fileUrl || null,
      is_published: true,
    };
    let err;
    if (mode === 'add') { const moderation = await getModerationStatus(supabase, e); const { error: err } = await supabase.from('sports_events').insert({ ...{ ...payload, moderation_status: moderation.status }, moderation_status: moderation.status }); }
    else { ({ error: err } = await supabase.from('sports_events').update(payload).eq('id', editing.id)); }
    if (err) { alert('تعذّر'); return; }
    setMode(null); setEditing(null); load(entity);
  }

  async function del(x) {
    if (!confirm('حذف؟')) return;
    await supabase.from('sports_events').delete().eq('id', x.id);
    load(entity);
  }

  if (!entity) {
    return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;
  }

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">🎯 الفعاليات</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ فعالية</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : items.length === 0 ? (
        <div className="sect-empty"><span className="em">🎯</span><p>لا توجد فعاليات</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {items.map((x) => (
            <div key={x.id} className="debt-card" style={{ borderRightColor: '#14b8a6' }}>
              <div className="debt-customer">🎯 {x.title}</div>
              {x.event_date && <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 3 }}>📅 {new Date(x.event_date).toLocaleDateString('ar-EG')}</div>}
              {x.location && <div style={{ fontSize: 11.5, color: 'var(--n-500)' }}>📍 {x.location}</div>}
              <div className="debt-actions">
                <button className="debt-action edit" onClick={() => openEdit(x)} type="button">✏️</button>
                <button className="debt-action del" onClick={() => del(x)} type="button">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode && (
        <div className="mng-modal-bg" onClick={() => { setMode(null); setEditing(null); }}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{mode === 'add' ? '➕ فعالية جديدة' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">العنوان *</label>
              <input className="new-service-input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الوصف</label>
              <textarea className="new-service-textarea" rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">التاريخ</label>
              <input className="new-service-input" type="datetime-local" value={form.event_date ? form.event_date.slice(0, 16) : ''} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الموقع</label>
              <input className="new-service-input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => { setMode(null); setEditing(null); }} type="button">إلغاء</button>
              <div className="new-service-field">
              <ImageUploader
                label="📸 صورة الفعالية"
                folder="events"
                value={f.image_url}
                onUpload={(url) => setF({ ...f, image_url: url })}
                aspect="16/9"
              />
            <FileUploader
              label="📎 ملف / جدول الفعالية"
              folder="events-files"
              value={fileUrl}
              onUpload={(url) => setFileUrl(url)}
              maxSize={15}
            />
            </div>

            <button className="mng-btn primary" onClick={save} type="button">✓ حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
