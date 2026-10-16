'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

const SL = { unpaid: 'غير مدفوعة', paid: 'مدفوعة', overdue: 'متأخرة' };

function Content() {
  const router = useRouter();
  const sp = useSearchParams();
  const [s, setS] = useState(null);
  const [inv, setInv] = useState([]);
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
      supabase.from('isp_invoices').select('*').eq('entity_name', x.display_name).order('created_at', { ascending: false }),
      supabase.from('isp_subscribers').select('id, full_name, phone, plan_name').eq('entity_name', x.display_name).eq('status', 'active'),
    ]);
    setInv(Array.isArray(a.data) ? a.data : []);
    setSubs(Array.isArray(b.data) ? b.data : []);
    setL(false);
  }

  function gen() {
    const d = new Date();
    return 'ISP-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + '-' + Math.floor(Math.random() * 9000 + 1000);
  }

  function add() {
    setEd('new');
    const d = new Date();
    const due = new Date(); due.setDate(due.getDate() + 15);
    setF({ subscriber_id: '', invoice_number: gen(), amount: '', currency: 'SYP', month: d.toISOString().slice(0, 10), due_date: due.toISOString().slice(0, 10), status: 'unpaid', notes: '' });
  }
  function edit(x) { setEd(x.id); setF({ ...x }); }

  async function save() {
    if (!f.subscriber_id) { alert('اختر المشترك'); return; }
    const sub = subs.find((x) => x.id === f.subscriber_id);
    const p = {
      entity_id: s.id, entity_name: s.display_name,
      subscriber_id: f.subscriber_id,
      subscriber_name: sub?.full_name || null,
      subscriber_phone: sub?.phone || null,
      invoice_number: f.invoice_number || gen(),
      plan_name: sub?.plan_name || null,
      amount: parseFloat(f.amount) || 0,
      currency: f.currency || 'SYP',
      month: f.month || null,
      due_date: f.due_date || null,
      status: f.status || 'unpaid',
      notes: f.notes?.trim() || null,
    };
    if (p.status === 'paid' && !f.paid_at) p.paid_at = new Date().toISOString();
    let err;
    if (ed === 'new') ({ error: err } = await supabase.from('isp_invoices').insert(p));
    else ({ error: err } = await supabase.from('isp_invoices').update(p).eq('id', ed));
    if (err) { alert('تعذّر: ' + err.message); return; }
    setEd(null); load(s);
  }

  async function paid(x) {
    await supabase.from('isp_invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', x.id);
    load(s);
  }

  function wa(x) {
    const ph = (x.subscriber_phone || '').replace(/[^0-9]/g, '');
    if (!ph) { alert('لا يوجد رقم'); return; }
    const m = '📶 سند — فاتورة إنترنت\n\n' +
      '👤 ' + x.subscriber_name + '\n' +
      '🔢 ' + x.invoice_number + '\n' +
      '📅 ' + (x.month || '-') + '\n' +
      '💰 ' + Number(x.amount).toLocaleString() + ' ' + x.currency + '\n' +
      '📆 الاستحقاق: ' + (x.due_date || '-') + '\n' +
      '📊 ' + SL[x.status] + '\n\n' +
      'يرجى التسديد قبل الاستحقاق. شكراً';
    window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent(m), '_blank');
  }

  const list = fl === 'all' ? inv : inv.filter((x) => x.status === fl);

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant/internet" className="inv-back">→</Link>
        <span className="inv-title">🧾 الفواتير</span>
        <button className="mng-add-btn" onClick={add} type="button">+ فاتورة</button>
      </div>

      <div className="chips-scroll" style={{ padding: '12px 16px' }}>
        <button className={'chip ' + (fl === 'all' ? 'active' : '')} onClick={() => setFl('all')} type="button">الكل ({inv.length})</button>
        <button className={'chip ' + (fl === 'unpaid' ? 'active' : '')} onClick={() => setFl('unpaid')} type="button">غير مدفوعة</button>
        <button className={'chip ' + (fl === 'paid' ? 'active' : '')} onClick={() => setFl('paid')} type="button">مدفوعة</button>
      </div>

      {L ? <div className="sect-empty"><span className="em">⏳</span></div>
       : list.length === 0 ? <div className="sect-empty"><span className="em">🧾</span><p>لا توجد فواتير</p></div>
       : <div style={{ padding: 16 }}>
          {list.map((x) => (
            <div key={x.id} className="debt-card" style={{ borderRightColor: x.status === 'paid' ? '#22c55e' : '#f59e0b', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 900, direction: 'ltr' }}>{x.invoice_number}</span>
                <span className={'admin-badge ' + (x.status === 'paid' ? 'active' : 'warn')}>{SL[x.status]}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>👤 {x.subscriber_name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                <span>📞 {x.subscriber_phone}</span>
                <span>📅 {x.month}</span>
                <span>📆 {x.due_date}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0ea5e9', direction: 'ltr', textAlign: 'right' }}>
                {Number(x.amount).toLocaleString()} {x.currency}
              </div>
              <div className="debt-actions">
                {x.status !== 'paid' && <button className="debt-action ok" onClick={() => paid(x)} type="button" title="مدفوعة">✓</button>}
                <button className="debt-action" onClick={() => wa(x)} type="button" title="واتساب">💬</button>
                <button className="debt-action edit" onClick={() => edit(x)} type="button">✏️</button>
              </div>
            </div>
          ))}
        </div>
      }

      {ed && (
        <div className="mng-modal-bg" onClick={() => setEd(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{ed === 'new' ? '➕ فاتورة' : '✏️ تعديل'}</h3>
            <div className="new-service-field">
              <label className="new-service-label">المشترك *</label>
              <select className="new-service-select" value={f.subscriber_id || ''} onChange={(e) => setF({ ...f, subscriber_id: e.target.value })}>
                <option value="">— اختر —</option>
                {subs.map((x) => <option key={x.id} value={x.id}>{x.full_name} - {x.phone}</option>)}
              </select>
            </div>
            <div className="new-service-field">
              <label className="new-service-label">رقم الفاتورة</label>
              <input className="new-service-input" value={f.invoice_number || ''} onChange={(e) => setF({ ...f, invoice_number: e.target.value })} style={{ direction: 'ltr' }} />
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">المبلغ</label>
                <input className="new-service-input" type="number" value={f.amount || 0} onChange={(e) => setF({ ...f, amount: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">العملة</label>
                <select className="new-service-select" value={f.currency || 'SYP'} onChange={(e) => setF({ ...f, currency: e.target.value })}>
                  <option value="SYP">SYP</option>
                  <option value="USD">USD</option>
                  <option value="TRY">TRY</option>
                </select>
              </div>
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">الشهر</label>
                <input className="new-service-input" type="date" value={f.month || ''} onChange={(e) => setF({ ...f, month: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">الاستحقاق</label>
                <input className="new-service-input" type="date" value={f.due_date || ''} onChange={(e) => setF({ ...f, due_date: e.target.value })} />
              </div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label">الحالة</label>
              <select className="new-service-select" value={f.status || 'unpaid'} onChange={(e) => setF({ ...f, status: e.target.value })}>
                <option value="unpaid">غير مدفوعة</option>
                <option value="paid">مدفوعة</option>
              </select>
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
