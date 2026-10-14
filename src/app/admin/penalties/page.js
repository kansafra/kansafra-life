'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const PENALTY_TYPES = [
  { k: 'warning', l: '⚠️ تحذير رسمي', color: '#f59e0b' },
  { k: 'fine', l: '💰 غرامة مالية', color: '#dc2626' },
  { k: 'suspend_7', l: '⏸️ حظر مؤقت (7 أيام)', color: '#dc2626' },
  { k: 'suspend_30', l: '🚫 إيقاف الحساب (30 يوم)', color: '#991b1b' },
  { k: 'permanent', l: '⛔ حظر دائم', color: '#7f1d1d' },
  { k: 'legal', l: '⚖️ إحالة للجهات القانونية', color: '#7c3aed' },
];

export default function PenaltiesPage() {
  const router = useRouter();
  const [penalties, setPenalties] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) return;
    const [p, a] = await Promise.all([
      supabase.from('sos_penalties').select('*').order('created_at', { ascending: false }),
      supabase.from('sos_alerts').select('id,ref_code,full_name,phone').order('created_at', { ascending: false }).limit(50),
    ]);
    setPenalties(Array.isArray(p.data) ? p.data : []);
    setAlerts(Array.isArray(a.data) ? a.data : []);
    setLoading(false);
  }

  function openAdd(alert) {
    setMode('add');
    setForm({
      alert_id: alert?.id || '',
      user_name: alert?.full_name || '',
      user_phone: alert?.phone || '',
      penalty_type: 'warning',
      reason: '',
      notes: '',
    });
  }

  async function save() {
    if (!form.user_phone?.trim()) { alert('رقم المستخدم مطلوب'); return; }
    if (!form.reason?.trim()) { alert('السبب مطلوب'); return; }
    setSaving(true);
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    const payload = {
      alert_id: form.alert_id || null,
      user_name: form.user_name?.trim() || null,
      user_phone: form.user_phone.trim(),
      penalty_type: form.penalty_type,
      reason: form.reason.trim(),
      notes: form.notes?.trim() || null,
      admin_name: stored?.full_name || 'admin',
    };
    const { error } = await supabase.from('sos_penalties').insert(payload);
    setSaving(false);
    if (error) { alert('تعذّر: ' + error.message); return; }
    setMode(null);
    load();
  }

  async function del(item) {
    if (!confirm('حذف العقوبة؟')) return;
    await supabase.from('sos_penalties').delete().eq('id', item.id);
    load();
  }

  const getPenalty = (k) => PENALTY_TYPES.find((p) => p.k === k) || PENALTY_TYPES[0];

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">⚖️ عقوبات SOS</span>
        <button className="mng-add-btn" onClick={() => openAdd(null)} type="button">+ عقوبة</button>
      </div>

      <div style={{ padding: '14px 20px 0', fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 600, lineHeight: 1.7 }}>
        نظام عقوبات للبلاغات الكاذبة — 6 مستويات
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : penalties.length === 0 ? (
        <div className="sect-empty"><span className="em">⚖️</span><p>لا توجد عقوبات</p></div>
      ) : (
        <div style={{ padding: '14px 20px 30px' }}>
          {penalties.map((p) => {
            const cfg = getPenalty(p.penalty_type);
            return (
              <div key={p.id} className="admin-item" style={{ marginBottom: 8, borderRightWidth: 4, borderRightStyle: 'solid', borderRightColor: cfg.color }}>
                <div className="admin-item-icon" style={{ background: 'rgba(255,255,255,.05)', borderColor: cfg.color, color: cfg.color }}>
                  {cfg.l.split(' ')[0]}
                </div>
                <div className="admin-item-body">
                  <div className="admin-item-title" style={{ color: '#fff' }}>{p.user_name || p.user_phone}</div>
                  <div className="admin-item-meta">
                    <span>{cfg.l}</span>
                    {p.user_phone && <span style={{ fontFamily: 'monospace', direction: 'ltr' }}>{p.user_phone}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, lineHeight: 1.5 }}>
                    {p.reason}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 4 }}>
                    {new Date(p.created_at).toLocaleString('ar-EG')}
                  </div>
                </div>
                <div className="admin-item-actions">
                  <button className="admin-act-btn del" onClick={() => del(p)} type="button">✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode && (
        <div className="mng-modal-bg" onClick={() => setMode(null)}>
          <div className="mng-modal" onClick={(ev) => ev.stopPropagation()} style={{ background: '#101010' }}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title" style={{ color: '#fff' }}>⚖️ عقوبة جديدة</h3>

            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>رقم المستخدم *</label>
              <input className="new-service-input" type="tel" value={form.user_phone || ''} onChange={(ev) => setForm({ ...form, user_phone: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>اسم المستخدم</label>
              <input className="new-service-input" value={form.user_name || ''} onChange={(ev) => setForm({ ...form, user_name: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>نوع العقوبة</label>
              <select className="new-service-select" value={form.penalty_type} onChange={(ev) => setForm({ ...form, penalty_type: ev.target.value })}>
                {PENALTY_TYPES.map((p) => <option key={p.k} value={p.k}>{p.l}</option>)}
              </select>
            </div>

            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>سبب العقوبة *</label>
              <textarea className="new-service-textarea" rows={3} value={form.reason || ''} onChange={(ev) => setForm({ ...form, reason: ev.target.value })} placeholder="مثال: بلاغ كاذب بتاريخ..." />
            </div>

            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>ملاحظات إدارية</label>
              <textarea className="new-service-textarea" rows={2} value={form.notes || ''} onChange={(ev) => setForm({ ...form, notes: ev.target.value })} />
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setMode(null)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} disabled={saving} type="button">{saving ? '...' : '✓ حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
