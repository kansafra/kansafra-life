'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

const TYPES = { outage: 'انقطاع', slow: 'بطء', installation: 'تركيب', other: 'أخرى' };
const STATUS = { open: 'مفتوحة', in_progress: 'قيد المعالجة', resolved: 'محلولة' };

function Content() {
  const router = useRouter();
  const sp = useSearchParams();
  const [s, setS] = useState(null);
  const [tk, setTk] = useState([]);
  const [subs, setSubs] = useState([]);
  const [L, setL] = useState(true);
  const [fl, setFl] = useState(sp?.get('filter') || 'all');
  const [ed, setEd] = useState(null);
  const [f, setF] = useState({});

  useEffect(() => {
    const x = getSession();
    if (!x) { router.replace('/login'); return; }
    setS(x); load(x);
  }, [router]);

  async function load(x) {
    if (!supabase) { setL(false); return; }
    const [a, b] = await Promise.all([
      supabase.from('isp_tickets').select('*').eq('entity_name', x.display_name).order('created_at', { ascending: false }),
      supabase.from('isp_subscribers').select('id, full_name, phone').eq('entity_name', x.display_name),
    ]);
    setTk(Array.isArray(a.data) ? a.data : []);
    setSubs(Array.isArray(b.data) ? b.data : []);
    setL(false);
  }

  function add() {
    setEd('new');
    setF({ subscriber_id: '', ticket_type: 'outage', description: '', status: 'open', priority: 'normal', notes: '' });
  }
  function edit(x) { setEd(x.id); setF({ ...x }); }

  async function save() {
    const sub = subs.find((x) => x.id === f.subscriber_id);
    const p = {
      entity_id: s.id, entity_name: s.display_name,
      subscriber_id: f.subscriber_id || null,
      subscriber_name: sub?.full_name || f.subscriber_name || null,
      subscriber_phone: sub?.phone || f.subscriber_phone || null,
      ticket_type: f.ticket_type || 'outage',
      description: f.description?.trim() || null,
      status: f.status || 'open',
      priority: f.priority || 'normal',
      notes: f.notes?.trim() || null,
    };
    if (p.status === 'resolved' && !f.resolved_at) p.resolved_at = new Date().toISOString();
    let err;
    if (ed === 'new') ({ error: err } = await supabase.from('isp_tickets').insert(p));
    else ({ error: err } = await supabase.from('isp_tickets').update(p).eq('id', ed));
    if (err) { alert('تعذّر: ' + err.message); return; }
    setEd(null); load(s);
  }

  async function updateStatus(x, status) {
    const p = { status };
    if (status === 'resolved') p.resolved_at = new Date().toISOString();
    await supabase.from('isp_tickets').update(p).eq('id', x.id);
    load(s);
  }

  const list = fl === 'all' ? tk : tk.filter((x) => x.status === fl);

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant/internet" className="inv-back">→</Link>
        <span className="inv-title">🛠️ التذاكر والأعطال</span>
        <button className="mng-add-btn" onClick={add} type="button">+ تذكرة</button>
      </div>

      <div className="chips-scroll" style={{ padding: '12px 16px' }}>
        <button className={'chip ' + (fl === 'all' ? 'active' : '')} onClick={() => setFl('all')} type="button">الكل ({tk.length})</button>
        <button className={'chip ' + (fl === 'open' ? 'active' : '')} onClick={() => setFl('open')} type="button">مفتوحة</button>
        <button className={'chip ' + (fl === 'in_progress' ? 'active' : '')} onClick={() => setFl('in_progress')} type="button">قيد المعالجة</button>
        <button className={'chip ' + (fl === 'resolved' ? 'active' : '')} onClick={() => setFl('resolved')} type="button">محلولة</button>
      </div>

      {L ? <div className="sect-empty"><span className="em">⏳</span></div>
       : list.length === 0 ? <div className="sect-empty"><span className="em">🛠️</span><p>لا توجد تذاكر</p></div>
       : <div style={{ padding: 16 }}>
          {list.map((x) => (
            <div key={x.id} className="debt-card" style={{ borderRightColor: x.status === 'resolved' ? '#22c55e' : x.priority === 'urgent' ? '#dc2626' : '#f59e0b', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 900 }}>{TYPES[x.ticket_type] || x.ticket_type}</span>
                <span className={'admin-badge ' + (x.status === 'resolved' ? 'active' : x.status === 'open' ? 'danger' : 'warn')}>{STATUS[x.status]}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>👤 {x.subscriber_name || 'غير محدد'}</div>
              {x.subscriber_phone && <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>📞 {x.subscriber_phone}</div>}
              {x.description && (
                <div style={{ fontSize: 12, color: 'var(--ink-600)', marginTop: 6, padding: 8, background: 'var(--ink-50)', borderRadius: 8, lineHeight: 1.6 }}>
                  {x.description}
                </div>
              )}
              <div className="debt-actions">
                {x.status === 'open' && <button className="debt-action" onClick={() => updateStatus(x, 'in_progress')} type="button" title="بدء">▶</button>}
                {x.status !== 'resolved' && <button className="debt-action ok" onClick={() => updateStatus(x, 'resolved')} type="button" title="حل">✓</button>}
                <button className="debt-action edit" onClick={() => edit(x)} type="button">✏️</button>
              </div>
            </div>
          ))}
        </div>
      }

      {ed && (
        <div className="mng-modal-bg" onClick={() => setEd(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{ed === 'new' ? '➕ تذكرة' : '✏️ تعديل'}</h3>
            <div className="new-service-field">
              <label className="new-service-label">المشترك</label>
              <select className="new-service-select" value={f.subscriber_id || ''} onChange={(e) => setF({ ...f, subscriber_id: e.target.value })}>
                <option value="">— اختر —</option>
                {subs.map((x) => <option key={x.id} value={x.id}>{x.full_name} - {x.phone}</option>)}
              </select>
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">النوع</label>
                <select className="new-service-select" value={f.ticket_type || 'outage'} onChange={(e) => setF({ ...f, ticket_type: e.target.value })}>
                  <option value="outage">انقطاع</option>
                  <option value="slow">بطء</option>
                  <option value="installation">تركيب</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div className="new-service-field">
                <label className="new-service-label">الأولوية</label>
                <select className="new-service-select" value={f.priority || 'normal'} onChange={(e) => setF({ ...f, priority: e.target.value })}>
                  <option value="normal">عادي</option>
                  <option value="urgent">عاجل</option>
                </select>
              </div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label">الوصف</label>
              <textarea className="new-service-textarea" value={f.description || ''} onChange={(e) => setF({ ...f, description: e.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">ملاحظات</label>
              <textarea className="new-service-textarea" value={f.notes || ''} onChange={(e) => setF({ ...f, notes: e.target.value })} />
            </div>
            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setEd(null)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} type="button">✓ حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="sect-empty"><span className="em">⏳</span></div>}><Content /></Suspense>;
}
