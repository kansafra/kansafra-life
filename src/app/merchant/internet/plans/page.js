'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function Page() {
  const router = useRouter();
  const [s, setS] = useState(null);
  const [plans, setPlans] = useState([]);
  const [L, setL] = useState(true);
  const [ed, setEd] = useState(null);
  const [f, setF] = useState({});

  useEffect(() => {
    const x = getSession();
    if (!x) { router.replace('/login'); return; }
    setS(x);
    load(x);
  }, [router]);

  async function load(x) {
    if (!supabase) { setL(false); return; }
    const { data } = await supabase.from('isp_plans').select('*').eq('entity_name', x.display_name).order('price');
    setPlans(Array.isArray(data) ? data : []);
    setL(false);
  }

  function add() {
    setEd('new');
    setF({ plan_name: '', speed_mbps: '', quota_gb: '', price: '', currency: 'SYP', duration_days: 30, description: '' });
  }
  function edit(p) { setEd(p.id); setF({ ...p }); }

  async function save() {
    if (!f.plan_name?.trim()) { alert('اسم الباقة مطلوب'); return; }
    const p = {
      entity_id: s.id, entity_name: s.display_name,
      plan_name: f.plan_name.trim(),
      speed_mbps: parseInt(f.speed_mbps) || 0,
      quota_gb: parseInt(f.quota_gb) || 0,
      price: parseFloat(f.price) || 0,
      currency: f.currency || 'SYP',
      duration_days: parseInt(f.duration_days) || 30,
      description: f.description?.trim() || null,
      is_active: true,
    };
    let err;
    if (ed === 'new') ({ error: err } = await supabase.from('isp_plans').insert(p));
    else ({ error: err } = await supabase.from('isp_plans').update(p).eq('id', ed));
    if (err) { alert('تعذّر'); return; }
    setEd(null); load(s);
  }

  async function del(p) {
    if (!confirm('حذف؟')) return;
    await supabase.from('isp_plans').delete().eq('id', p.id);
    load(s);
  }

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant/internet" className="inv-back">→</Link>
        <span className="inv-title">📶 الباقات</span>
        <button className="mng-add-btn" onClick={add} type="button">+ باقة</button>
      </div>

      {L ? <div className="sect-empty"><span className="em">⏳</span></div>
       : plans.length === 0 ? <div className="sect-empty"><span className="em">📶</span><p>لا توجد باقات</p></div>
       : <div style={{ padding: 16 }}>
          {plans.map((p) => (
            <div key={p.id} className="debt-card" style={{ borderRightColor: '#0ea5e9', marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>📶 {p.plan_name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                <span>⚡ {p.speed_mbps} Mbps</span>
                <span>💾 {p.quota_gb === 0 ? 'غير محدود' : p.quota_gb + ' GB'}</span>
                <span>📅 {p.duration_days} يوم</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0ea5e9', direction: 'ltr', textAlign: 'right' }}>
                {Number(p.price).toLocaleString()} {p.currency}
              </div>
              <div className="debt-actions">
                <button className="debt-action edit" onClick={() => edit(p)} type="button">✏️</button>
                <button className="debt-action del" onClick={() => del(p)} type="button">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      }

      {ed && (
        <div className="mng-modal-bg" onClick={() => setEd(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{ed === 'new' ? '➕ باقة جديدة' : '✏️ تعديل'}</h3>
            <div className="new-service-field">
              <label className="new-service-label">اسم الباقة *</label>
              <input className="new-service-input" value={f.plan_name || ''} onChange={(e) => setF({ ...f, plan_name: e.target.value })} />
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">السرعة (Mbps)</label>
                <input className="new-service-input" type="number" value={f.speed_mbps || 0} onChange={(e) => setF({ ...f, speed_mbps: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">الحصة GB (0=∞)</label>
                <input className="new-service-input" type="number" value={f.quota_gb || 0} onChange={(e) => setF({ ...f, quota_gb: e.target.value })} />
              </div>
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">السعر</label>
                <input className="new-service-input" type="number" value={f.price || 0} onChange={(e) => setF({ ...f, price: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">المدة (يوم)</label>
                <input className="new-service-input" type="number" value={f.duration_days || 30} onChange={(e) => setF({ ...f, duration_days: e.target.value })} />
              </div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label">الوصف</label>
              <textarea className="new-service-textarea" value={f.description || ''} onChange={(e) => setF({ ...f, description: e.target.value })} />
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
