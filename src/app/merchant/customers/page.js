'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function CustomersPage() {
  const router = useRouter();
  const [s, setS] = useState(null);
  const [list, setList] = useState([]);
  const [L, setL] = useState(true);
  const [q, setQ] = useState('');
  const [ed, setEd] = useState(null);
  const [f, setF] = useState({});
  const [viewing, setViewing] = useState(null);
  const [history, setHistory] = useState({ orders: [], invoices: [], appointments: [], debts: [] });

  useEffect(() => {
    const x = getSession();
    if (!x) { router.replace('/login'); return; }
    setS(x); load(x);
  }, [router]);

  async function load(x) {
    if (!supabase) { setL(false); return; }
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('entity_name', x.display_name)
      .order('created_at', { ascending: false });
    setList(Array.isArray(data) ? data : []);
    setL(false);
  }

  function add() {
    setEd('new');
    setF({ full_name: '', phone: '', email: '', address: '', notes: '' });
  }
  function edit(x) { setEd(x.id); setF({ ...x }); }

  async function save() {
    if (!f.full_name?.trim()) { alert('الاسم مطلوب'); return; }
    if (!f.phone?.trim()) { alert('الهاتف مطلوب'); return; }
    const p = {
      entity_name: s.display_name,
      full_name: f.full_name.trim(),
      phone: f.phone.trim(),
      email: f.email?.trim() || null,
      address: f.address?.trim() || null,
      notes: f.notes?.trim() || null,
    };
    let err;
    if (ed === 'new') ({ error: err } = await supabase.from('customers').insert(p));
    else ({ error: err } = await supabase.from('customers').update(p).eq('id', ed));
    if (err) { alert('تعذّر: ' + err.message); return; }
    setEd(null); load(s);
  }

  async function del(x) {
    if (!confirm('حذف العميل؟')) return;
    await supabase.from('customers').delete().eq('id', x.id);
    load(s);
  }

  async function view(x) {
    setViewing(x);
    if (!supabase) return;
    const [ord, inv, apt, dbt] = await Promise.all([
      supabase.from('orders').select('*').eq('customer_phone', x.phone).order('created_at', { ascending: false }).limit(10),
      supabase.from('invoices').select('*').eq('customer_phone', x.phone).order('created_at', { ascending: false }).limit(10),
      supabase.from('appointments').select('*').eq('patient_phone', x.phone).order('appointment_date', { ascending: false }).limit(10),
      supabase.from('debts').select('*').eq('customer_phone', x.phone).order('created_at', { ascending: false }).limit(10),
    ]);
    setHistory({
      orders: Array.isArray(ord.data) ? ord.data : [],
      invoices: Array.isArray(inv.data) ? inv.data : [],
      appointments: Array.isArray(apt.data) ? apt.data : [],
      debts: Array.isArray(dbt.data) ? dbt.data : [],
    });
  }

  function wa(x) {
    const ph = (x.phone || '').replace(/[^0-9]/g, '');
    if (!ph) return;
    const msg = 'السلام عليكم ' + x.full_name + '،\n\nمن ' + s.display_name;
    window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent(msg), '_blank');
  }

  const filtered = list.filter((x) => {
    if (!q.trim()) return true;
    const z = q.trim().toLowerCase();
    return (x.full_name || '').toLowerCase().includes(z) || (x.phone || '').includes(z);
  });

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">👥 العملاء</span>
        <button className="mng-add-btn" onClick={add} type="button">+ عميل</button>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <input className="new-service-input" placeholder="🔍 ابحث بالاسم أو الهاتف..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {L ? <div className="sect-empty"><span className="em">⏳</span></div>
       : filtered.length === 0 ? <div className="sect-empty"><span className="em">👥</span><p>لا يوجد عملاء بعد</p><p style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 8 }}>أضف عميلك الأول من الزر أعلاه</p></div>
       : <div style={{ padding: 16 }}>
          {filtered.map((x) => (
            <div key={x.id} className="debt-card" style={{ borderRightColor: '#0ea5e9', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(14,165,233,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>👤</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 900 }}>{x.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', direction: 'ltr', textAlign: 'right' }}>📞 {x.phone}</div>
                </div>
              </div>
              {x.address && <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginBottom: 6 }}>📍 {x.address}</div>}
              {Number(x.total_spent) > 0 && (
                <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 900, marginBottom: 6 }}>
                  💰 إجمالي الشراء: {Number(x.total_spent).toLocaleString()}
                </div>
              )}
              <div className="debt-actions">
                <button className="debt-action" onClick={() => view(x)} type="button" title="عرض">👁️</button>
                <button className="debt-action" onClick={() => wa(x)} type="button" title="واتساب">💬</button>
                <button className="debt-action edit" onClick={() => edit(x)} type="button">✏️</button>
                <button className="debt-action del" onClick={() => del(x)} type="button">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      }

      {ed && (
        <div className="mng-modal-bg" onClick={() => setEd(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{ed === 'new' ? '➕ عميل جديد' : '✏️ تعديل'}</h3>
            <div className="new-service-field">
              <label className="new-service-label">الاسم الكامل *</label>
              <input className="new-service-input" value={f.full_name || ''} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">📞 الهاتف *</label>
              <input className="new-service-input" type="tel" value={f.phone || ''} onChange={(e) => setF({ ...f, phone: e.target.value })} style={{ direction: 'ltr' }} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">📧 الإيميل</label>
              <input className="new-service-input" type="email" value={f.email || ''} onChange={(e) => setF({ ...f, email: e.target.value })} style={{ direction: 'ltr' }} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">📍 العنوان</label>
              <input className="new-service-input" value={f.address || ''} onChange={(e) => setF({ ...f, address: e.target.value })} />
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

      {viewing && (
        <div className="mng-modal-bg" onClick={() => setViewing(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">👤 {viewing.full_name}</h3>

            <div style={{ padding: 12, background: 'var(--ink-50)', borderRadius: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>📞 {viewing.phone}</div>
              {viewing.email && <div style={{ fontSize: 12, marginBottom: 4, direction: 'ltr', textAlign: 'right' }}>📧 {viewing.email}</div>}
              {viewing.address && <div style={{ fontSize: 12 }}>📍 {viewing.address}</div>}
            </div>

            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>📊 السجل</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
              <Stat label="طلبات" value={history.orders.length} />
              <Stat label="فواتير" value={history.invoices.length} />
              <Stat label="مواعيد" value={history.appointments.length} />
              <Stat label="ديون" value={history.debts.length} />
            </div>

            <button className="mng-btn primary" onClick={() => setViewing(null)} type="button" style={{ width: '100%' }}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ padding: 12, background: 'rgba(14,165,233,.08)', border: '1px solid rgba(14,165,233,.2)', borderRadius: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#0ea5e9' }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--ink-500)', marginTop: 3 }}>{label}</div>
    </div>
  );
}
