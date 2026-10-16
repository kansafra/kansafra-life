'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ImageUploader from '@/components/ImageUploader';

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


export default function P() {
  const router = useRouter();
  const [e, setE] = useState(null);
  const [items, setItems] = useState([]);
  const [L, setL] = useState(true);
  const [m, setM] = useState(null);
  const [ed, setEd] = useState(null);
  const [f, setF] = useState({});

  useEffect(() => {
    let s = null;
    try { s = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!s) { router.replace('/login'); return; }
    setE(s); load(s);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const { data } = await supabase.from('sports_venues').select('*').eq('entity_name', ent.display_name).order('created_at', { ascending: false });
    setItems(Array.isArray(data) ? data : []);
    setL(false);
  }

  function add() {
    setM('add');
    setF({ name: '', venue_type: 'field', location: '', capacity: 0, price_per_hour: 0, phone: '' });
  }

  function edit(x) {
    setM('edit'); setEd(x); setF({ ...x });
  }

  async function save() {
    if (!f.name?.trim()) { alert('الاسم مطلوب'); return; }
    const p = {
      entity_name: e.display_name,
      name: f.name.trim(),
      venue_type: f.venue_type || 'field',
      location: f.location?.trim() || null,
      capacity: Number(f.capacity) || 0,
      price_per_hour: Number(f.price_per_hour) || 0,
      phone: f.phone?.trim() || null,
      image_url: f.image_url || null,
      is_available: true,
    };
    let err;
    if (m === 'add') { const moderation = await getModerationStatus(supabase, e); const { error: err } = await supabase.from('sports_venues').insert({ ...{ ...p, moderation_status: moderation.status }, moderation_status: moderation.status }); }
    else ({ error: err } = await supabase.from('sports_venues').update(p).eq('id', ed.id));
    if (err) { alert('تعذّر'); return; }
    setM(null); setEd(null); load(e);
  }

  async function del(x) {
    if (!confirm('حذف؟')) return;
    await supabase.from('sports_venues').delete().eq('id', x.id);
    load(e);
  }

  if (!e) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">🏟️ الملاعب</span>
        <button className="mng-add-btn" onClick={add} type="button">+ ملعب</button>
      </div>

      {L ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : items.length === 0 ? (
        <div className="sect-empty"><span className="em">🏟️</span><p>لا توجد ملاعب</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {items.map((x) => (
            <div key={x.id} className="debt-card" style={{ borderRightColor: '#14b8a6' }}>
              <div className="debt-customer">🏟️ {x.name}</div>
              {x.location && <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 3 }}>📍 {x.location}</div>}
              {x.price_per_hour > 0 && (
                <div style={{ fontSize: 13, color: '#14b8a6', fontWeight: 900, marginTop: 8, direction: 'ltr', textAlign: 'right' }}>
                  {Number(x.price_per_hour).toLocaleString()} / ساعة
                </div>
              )}
              <div className="debt-actions">
                <button className="debt-action edit" onClick={() => edit(x)} type="button">✏️</button>
                <button className="debt-action del" onClick={() => del(x)} type="button">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {m && (
        <div className="mng-modal-bg" onClick={() => { setM(null); setEd(null); }}>
          <div className="mng-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{m === 'add' ? '➕ ملعب جديد' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">الاسم *</label>
              <input className="new-service-input" value={f.name || ''} onChange={(ev) => setF({ ...f, name: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">النوع</label>
              <select className="new-service-select" value={f.venue_type || 'field'} onChange={(ev) => setF({ ...f, venue_type: ev.target.value })}>
                <option value="field">⚽ ملعب كرة</option>
                <option value="basketball">🏀 سلة</option>
                <option value="tennis">🎾 تنس</option>
                <option value="gym">🏋️ صالة</option>
                <option value="pool">🏊 مسبح</option>
                <option value="other">🎯 أخرى</option>
              </select>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الموقع</label>
              <input className="new-service-input" value={f.location || ''} onChange={(ev) => setF({ ...f, location: ev.target.value })} />
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">السعة</label>
                <input className="new-service-input" type="number" value={f.capacity || 0} onChange={(ev) => setF({ ...f, capacity: ev.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">السعر/ساعة</label>
                <input className="new-service-input" type="number" value={f.price_per_hour || 0} onChange={(ev) => setF({ ...f, price_per_hour: ev.target.value })} />
              </div>
            </div>

            <div className="new-service-field">
              <ImageUploader
                label="📸 صورة الملعب"
                folder="venues"
                value={f.image_url}
                onUpload={(url) => setF({ ...f, image_url: url })}
                aspect="16/9"
              />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الهاتف</label>
              <input className="new-service-input" type="tel" value={f.phone || ''} onChange={(ev) => setF({ ...f, phone: ev.target.value })} />
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => { setM(null); setEd(null); }} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} type="button">✓ حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
