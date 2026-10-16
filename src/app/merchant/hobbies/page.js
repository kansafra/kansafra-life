'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

const HOBBY = [
  { k: 'drawing', l: '🎨 رسم' }, { k: 'music', l: '🎵 موسيقى' },
  { k: 'photo', l: '📷 تصوير' }, { k: 'reading', l: '📚 قراءة' },
  { k: 'chess', l: '♟️ شطرنج' }, { k: 'cooking', l: '🍳 طبخ' },
  { k: 'crafts', l: '🧵 حرف' }, { k: 'code', l: '💻 برمجة' },
  { k: 'calligraphy', l: '✒️ خط' }, { k: 'other', l: '🎯 أخرى' },
];

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
    const { data } = await supabase.from('sports_hobbies').select('*').eq('entity_name', ent.display_name).order('created_at', { ascending: false });
    setItems(Array.isArray(data) ? data : []);
    setL(false);
  }

  function add() {
    setM('add');
    setF({ title: '', hobby_type: 'drawing', description: '', age_group: '', schedule: '', price: 0, phone: '' });
  }

  function edit(x) { setM('edit'); setEd(x); setF({ ...x }); }

  async function save() {
    if (!f.title?.trim()) { alert('العنوان مطلوب'); return; }
    const p = {
      entity_name: e.display_name,
      title: f.title.trim(),
      hobby_type: f.hobby_type || 'other',
      description: f.description?.trim() || null,
      age_group: f.age_group?.trim() || null,
      schedule: f.schedule?.trim() || null,
      price: Number(f.price) || 0,
      phone: f.phone?.trim() || null,
      is_active: true,
    };
    let err;
    if (m === 'add') ({ error: err } = await supabase.from('sports_hobbies').insert(p));
    else ({ error: err } = await supabase.from('sports_hobbies').update(p).eq('id', ed.id));
    if (err) { alert('تعذّر'); return; }
    setM(null); setEd(null); load(e);
  }

  async function del(x) {
    if (!confirm('حذف؟')) return;
    await supabase.from('sports_hobbies').delete().eq('id', x.id);
    load(e);
  }

  if (!e) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const lbl = (k) => HOBBY.find((h) => h.k === k)?.l || k;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">🎨 الهوايات</span>
        <button className="mng-add-btn" onClick={add} type="button">+ هواية</button>
      </div>

      {L ? <div className="sect-empty"><span className="em">⏳</span></div> : items.length === 0 ? (
        <div className="sect-empty"><span className="em">🎨</span><p>لا توجد هوايات</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {items.map((x) => (
            <div key={x.id} className="debt-card" style={{ borderRightColor: '#14b8a6' }}>
              <div className="debt-customer">{lbl(x.hobby_type)} — {x.title}</div>
              {x.age_group && <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 3 }}>🎯 {x.age_group}</div>}
              {x.schedule && <div style={{ fontSize: 11.5, color: 'var(--n-500)' }}>📅 {x.schedule}</div>}
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
            <h3 className="mng-modal-title">{m === 'add' ? '➕ هواية جديدة' : '✏️ تعديل'}</h3>
            <div className="new-service-field">
              <label className="new-service-label">النوع</label>
              <select className="new-service-select" value={f.hobby_type || 'drawing'} onChange={(ev) => setF({ ...f, hobby_type: ev.target.value })}>
                {HOBBY.map((h) => <option key={h.k} value={h.k}>{h.l}</option>)}
              </select>
            </div>
            <div className="new-service-field">
              <label className="new-service-label">العنوان *</label>
              <input className="new-service-input" value={f.title || ''} onChange={(ev) => setF({ ...f, title: ev.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">الوصف</label>
              <textarea className="new-service-textarea" rows={3} value={f.description || ''} onChange={(ev) => setF({ ...f, description: ev.target.value })} />
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">الفئة العمرية</label>
                <input className="new-service-input" value={f.age_group || ''} onChange={(ev) => setF({ ...f, age_group: ev.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">السعر</label>
                <input className="new-service-input" type="number" value={f.price || 0} onChange={(ev) => setF({ ...f, price: ev.target.value })} />
              </div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label">الجدول</label>
              <input className="new-service-input" value={f.schedule || ''} onChange={(ev) => setF({ ...f, schedule: ev.target.value })} />
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
