'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function Page() {
  const router = useRouter();
  const [s, setS] = useState(null);
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [L, setL] = useState(true);
  const [q, setQ] = useState('');
  const [fl, setFl] = useState('all');
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
      supabase.from('isp_subscribers').select('*').eq('entity_name', x.display_name).order('created_at', { ascending: false }),
      supabase.from('isp_plans').select('*').eq('entity_name', x.display_name).eq('is_active', true),
    ]);
    setSubs(Array.isArray(a.data) ? a.data : []);
    setPlans(Array.isArray(b.data) ? b.data : []);
    setL(false);
  }

  function add() {
    setEd('new');
    setF({ full_name: '', phone: '', address: '', plan_id: '', router_mac: '', ip_address: '', installation_date: '', status: 'active', notes: '' });
  }
  function edit(x) { setEd(x.id); setF({ ...x }); }

  async function save() {
    if (!f.full_name?.trim()) { alert('الاسم مطلوب'); return; }
    if (!f.phone?.trim()) { alert('الهاتف مطلوب'); return; }
    const plan = plans.find((p) => p.id === f.plan_id);
    const payload = {
      entity_id: s.id, entity_name: s.display_name,
      full_name: f.full_name.trim(),
      phone: f.phone.trim(),
      address: f.address?.trim() || null,
      plan_id: f.plan_id || null,
      plan_name: plan?.plan_name || null,
      router_mac: f.router_mac?.trim() || null,
      ip_address: f.ip_address?.trim() || null,
      installation_date: f.installation_date || null,
      status: f.status || 'active',
      notes: f.notes?.trim() || null,
    };
    let err;
    if (ed === 'new') ({ error: err } = await supabase.from('isp_subscribers').insert(payload));
    else ({ error: err } = await supabase.from('isp_subscribers').update(payload).eq('id', ed));
    if (err) { alert('تعذّر: ' + err.message); return; }
    setEd(null); load(s);
  }

  async function del(x) {
    if (!confirm('حذف؟')) return;
    await supabase.from('isp_subscribers').delete().eq('id', x.id);
    load(s);
  }

  const list = subs.filter((x) => {
    if (fl !== 'all' && x.status !== fl) return false;
    if (!q.trim()) return true;
    const z = q.trim().toLowerCase();
    return (x.full_name || '').toLowerCase().includes(z) || (x.phone || '').includes(z);
  });

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant/internet" className="inv-back">→</Link>
        <span className="inv-title">👥 المشتركون</span>
        <button className="mng-add-btn" onClick={add} type="button">+ مشترك</button>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <input className="new-service-input" placeholder="🔍 ابحث..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="chips-scroll" style={{ padding: '0 16px 12px' }}>
        <button className={'chip ' + (fl === 'all' ? 'active' : '')} onClick={() => setFl('all')} type="button">الكل ({subs.length})</button>
        <button className={'chip ' + (fl === 'active' ? 'active' : '')} onClick={() => setFl('active')} type="button">نشط</button>
        <button className={'chip ' + (fl === 'suspended' ? 'active' : '')} onClick={() => setFl('suspended')} type="button">موقوف</button>
      </div>

      {L ? <div className="sect-empty"><span className="em">⏳</span></div>
       : list.length === 0 ? <div className="sect-empty"><span className="em">👥</span><p>لا يوجد مشتركون</p></div>
       : <div style={{ padding: 16 }}>
          {list.map((x) => (
            <div key={x.id} className="debt-card" style={{ borderRightColor: x.status === 'active' ? '#22c55e' : '#f59e0b', marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>👤 {x.full_name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                <span>📞 {x.phone}</span>
                {x.plan_name && <span>📶 {x.plan_name}</span>}
                {x.address && <span>📍 {x.address}</span>}
              </div>
              <span className={'admin-badge ' + (x.status === 'active' ? 'active' : 'warn')}>
                {x.status === 'active' ? 'نشط' : 'موقوف'}
              </span>
              <div className="debt-actions">
                <button className="debt-action edit" onClick={() => edit(x)} type="button">✏️</button>
                <button className="debt-action del" onClick={() => del(x)} type="button">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      }

      {ed && (
        <div className="mng-modal-bg" onClick={() => setEd(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{ed === 'new' ? '➕ مشترك جديد' : '✏️ تعديل'}</h3>
            <div className="new-service-field">
              <label className="new-service-label">الاسم *</label>
              <input className="new-service-input" value={f.full_name || ''} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">📞 الهاتف *</label>
                <input className="new-service-input" type="tel" value={f.phone || ''} onChange={(e) => setF({ ...f, phone: e.target.value })} style={{ direction: 'ltr' }} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">📶 الباقة</label>
                <select className="new-service-select" value={f.plan_id || ''} onChange={(e) => setF({ ...f, plan_id: e.target.value })}>
                  <option value="">— اختر —</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.plan_name} - {p.speed_mbps}Mbps</option>)}
                </select>
              </div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label">📍 العنوان</label>
              <input className="new-service-input" value={f.address || ''} onChange={(e) => setF({ ...f, address: e.target.value })} />
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">MAC الراوتر</label>
                <input className="new-service-input" value={f.router_mac || ''} onChange={(e) => setF({ ...f, router_mac: e.target.value })} style={{ direction: 'ltr' }} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">IP</label>
                <input className="new-service-input" value={f.ip_address || ''} onChange={(e) => setF({ ...f, ip_address: e.target.value })} style={{ direction: 'ltr' }} />
              </div>
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">📅 تاريخ التركيب</label>
                <input className="new-service-input" type="date" value={f.installation_date || ''} onChange={(e) => setF({ ...f, installation_date: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">الحالة</label>
                <select className="new-service-select" value={f.status || 'active'} onChange={(e) => setF({ ...f, status: e.target.value })}>
                  <option value="active">نشط</option>
                  <option value="suspended">موقوف</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>
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
