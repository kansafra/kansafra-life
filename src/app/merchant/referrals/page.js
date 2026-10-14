'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ReferralsPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const { data } = await supabase.from('referrals').select('*').eq('entity_name', ent.display_name).order('created_at', { ascending: false });
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setForm({ referrer_name: '', referrer_phone: '', referred_name: '', referred_phone: '', reward: 0, notes: '' });
  }

  async function save() {
    if (!form.referrer_phone?.trim() || !form.referred_phone?.trim()) {
      alert('هاتف المحيل والمحال إليه مطلوبان');
      return;
    }
    setSaving(true);
    const payload = {
      entity_name: entity.display_name,
      referrer_name: form.referrer_name?.trim() || null,
      referrer_phone: form.referrer_phone.trim(),
      referred_name: form.referred_name?.trim() || null,
      referred_phone: form.referred_phone.trim(),
      reward: Number(form.reward) || 0,
      notes: form.notes?.trim() || null,
      status: 'pending',
    };
    const { error } = await supabase.from('referrals').insert(payload);
    setSaving(false);
    if (error) { alert('تعذّر: ' + error.message); return; }
    setMode(null);
    load(entity);
  }

  async function markPaid(item) {
    await supabase.from('referrals').update({ status: 'rewarded' }).eq('id', item.id);
    load(entity);
  }

  async function del(item) {
    if (!confirm('حذف؟')) return;
    await supabase.from('referrals').delete().eq('id', item.id);
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const pending = items.filter((i) => i.status === 'pending').length;
  const rewarded = items.filter((i) => i.status === 'rewarded').length;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">🎁 برنامج الإحالات</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ إحالة</button>
      </div>

      <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div className="debt-stat" style={{ padding: 12 }}>
          <div className="debt-stat-val" style={{ fontSize: 18 }}>{items.length}</div>
          <div className="debt-stat-lbl">الإجمالي</div>
        </div>
        <div className="debt-stat warn" style={{ padding: 12 }}>
          <div className="debt-stat-val" style={{ fontSize: 18 }}>{pending}</div>
          <div className="debt-stat-lbl">قيد</div>
        </div>
        <div className="debt-stat" style={{ padding: 12 }}>
          <div className="debt-stat-val" style={{ fontSize: 18, color: '#16a34a' }}>{rewarded}</div>
          <div className="debt-stat-lbl">مكافأ</div>
        </div>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : items.length === 0 ? (
        <div className="sect-empty"><span className="em">🎁</span><p>لا توجد إحالات</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {items.map((r) => (
            <div key={r.id} className="debt-card" style={{ borderRightColor: r.status === 'rewarded' ? '#16a34a' : '#f59e0b' }}>
              <div className="debt-head">
                <div>
                  <div className="debt-customer">👤 {r.referrer_name || r.referrer_phone}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--n-500)', direction: 'ltr', textAlign: 'right' }}>{r.referrer_phone}</div>
                </div>
                <span className={`debt-badge ${r.status === 'rewarded' ? 'paid' : 'active'}`}>
                  {r.status === 'rewarded' ? 'مكافأ' : 'قيد'}
                </span>
              </div>
              <div style={{ marginTop: 10, padding: 10, background: 'var(--c-50)', borderRadius: 10, fontSize: 12 }}>
                <div style={{ color: 'var(--n-700)', fontWeight: 700 }}>➡️ إلى: {r.referred_name || r.referred_phone}</div>
                <div style={{ color: 'var(--n-500)', direction: 'ltr', textAlign: 'right', marginTop: 4 }}>{r.referred_phone}</div>
              </div>
              {r.reward > 0 && (
                <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 900, marginTop: 8 }}>
                  🎁 المكافأة: {Number(r.reward).toLocaleString()}
                </div>
              )}
              <div className="debt-actions">
                {r.status === 'pending' && (
                  <button className="debt-action pay" onClick={() => markPaid(r)} type="button">✓ مكافأة</button>
                )}
                <button className="debt-action del" onClick={() => del(r)} type="button">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode && (
        <div className="mng-modal-bg" onClick={() => setMode(null)}>
          <div className="mng-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">➕ إحالة جديدة</h3>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">اسم المحيل</label>
                <input className="new-service-input" value={form.referrer_name || ''} onChange={(ev) => setForm({ ...form, referrer_name: ev.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">هاتف المحيل *</label>
                <input className="new-service-input" type="tel" value={form.referrer_phone || ''} onChange={(ev) => setForm({ ...form, referrer_phone: ev.target.value })} />
              </div>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">اسم المحال إليه</label>
                <input className="new-service-input" value={form.referred_name || ''} onChange={(ev) => setForm({ ...form, referred_name: ev.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">هاتف المحال *</label>
                <input className="new-service-input" type="tel" value={form.referred_phone || ''} onChange={(ev) => setForm({ ...form, referred_phone: ev.target.value })} />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">المكافأة</label>
              <input className="new-service-input" type="number" value={form.reward || 0} onChange={(ev) => setForm({ ...form, reward: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">ملاحظات</label>
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
