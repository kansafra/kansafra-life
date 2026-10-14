'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
    const { data } = await supabase.from('sports_news').select('*').eq('entity_name', ent.display_name).order('published_at', { ascending: false });
    setItems(Array.isArray(data) ? data : []);
    setL(false);
  }

  function add() {
    setM('add');
    setF({ title: '', body: '', image_url: '', category: 'club', is_published: true });
  }

  function edit(x) { setM('edit'); setEd(x); setF({ ...x }); }

  async function save() {
    if (!f.title?.trim()) { alert('العنوان مطلوب'); return; }
    const p = {
      entity_name: e.display_name,
      title: f.title.trim(),
      body: f.body?.trim() || null,
      image_url: f.image_url?.trim() || null,
      category: f.category || 'club',
      is_published: true,
    };
    let err;
    if (m === 'add') ({ error: err } = await supabase.from('sports_news').insert(p));
    else ({ error: err } = await supabase.from('sports_news').update(p).eq('id', ed.id));
    if (err) { alert('تعذّر'); return; }
    setM(null); setEd(null); load(e);
  }

  async function del(x) {
    if (!confirm('حذف؟')) return;
    await supabase.from('sports_news').delete().eq('id', x.id);
    load(e);
  }

  if (!e) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">📰 الأخبار الرياضية</span>
        <button className="mng-add-btn" onClick={add} type="button">+ خبر</button>
      </div>

      {L ? <div className="sect-empty"><span className="em">⏳</span></div> : items.length === 0 ? (
        <div className="sect-empty"><span className="em">📰</span><p>لا توجد أخبار</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {items.map((x) => (
            <div key={x.id} className="debt-card" style={{ borderRightColor: '#14b8a6' }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--n-900)', lineHeight: 1.4 }}>{x.title}</div>
              {x.body && <div style={{ fontSize: 12.5, color: 'var(--n-600)', marginTop: 6, lineHeight: 1.7 }}>{x.body.slice(0, 120)}</div>}
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
            <h3 className="mng-modal-title">{m === 'add' ? '➕ خبر جديد' : '✏️ تعديل'}</h3>
            <div className="new-service-field">
              <label className="new-service-label">العنوان *</label>
              <input className="new-service-input" value={f.title || ''} onChange={(ev) => setF({ ...f, title: ev.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">المحتوى</label>
              <textarea className="new-service-textarea" rows={4} value={f.body || ''} onChange={(ev) => setF({ ...f, body: ev.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">رابط الصورة</label>
              <input className="new-service-input" type="url" value={f.image_url || ''} onChange={(ev) => setF({ ...f, image_url: ev.target.value })} />
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
