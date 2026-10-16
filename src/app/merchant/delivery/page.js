'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function DeliveryPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    let stored = null;
    try { stored = getSession(); } catch (e) {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const [a, ag, o] = await Promise.all([
      supabase.from('delivery_assignments').select('*').order('assigned_at', { ascending: false }).limit(50),
      supabase.from('delivery_agents').select('*').eq('is_available', true),
      supabase.from('orders').select('id,order_code,customer_name,customer_phone,total,currency,status').eq('provider_name', ent.display_name).in('status', ['new', 'preparing']).order('created_at', { ascending: false }).limit(30),
    ]);
    setAssignments(Array.isArray(a.data) ? a.data : []);
    setAgents(Array.isArray(ag.data) ? ag.data : []);
    setOrders(Array.isArray(o.data) ? o.data : []);
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setForm({ order_id: '', agent_name: '', agent_phone: '', distance_km: 0, fee: 0, notes: '' });
  }

  async function save() {
    if (!form.order_id || !form.agent_name) { alert('اختر الطلب والمندوب'); return; }
    const payload = {
      order_id: form.order_id,
      agent_name: form.agent_name,
      agent_phone: form.agent_phone || null,
      distance_km: Number(form.distance_km) || 0,
      fee: Number(form.fee) || 0,
      notes: form.notes || null,
      status: 'assigned',
    };
    const { error } = await supabase.from('delivery_assignments').insert(payload);
    if (error) { alert('تعذّر الحفظ: ' + error.message); return; }
    setMode(null);
    load(entity);
  }

  async function updateStatus(a, status) {
    const updates = { status };
    if (status === 'picked_up') updates.picked_up_at = new Date().toISOString();
    if (status === 'delivered') updates.delivered_at = new Date().toISOString();
    await supabase.from('delivery_assignments').update(updates).eq('id', a.id);
    load(entity);
  }

  const STATUS_LABELS = { assigned: 'مُعيّن', picked_up: 'قيد التوصيل', delivered: 'تم التسليم', cancelled: 'ملغي' };

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">🚚 التوصيل</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ تعيين</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : assignments.length === 0 ? (
        <div className="sect-empty">
          <span className="em">🚚</span>
          <p>لا توجد توصيلات</p>
          <button className="mng-add-btn" onClick={openAdd} type="button" style={{ marginTop: 16 }}>+ تعيين مندوب</button>
        </div>
      ) : (
        <div style={{ padding: 20 }}>
          {assignments.map((a) => (
            <div key={a.id} className="debt-card" style={{ borderRightColor: a.status === 'delivered' ? '#16a34a' : a.status === 'picked_up' ? '#8b5cf6' : '#3b82f6' }}>
              <div className="debt-head">
                <div>
                  <div className="debt-customer">🚚 {a.agent_name}</div>
                  <div className="debt-phone">{a.agent_phone}</div>
                </div>
                <span className={`debt-badge ${a.status === 'delivered' ? 'paid' : 'active'}`}>
                  {STATUS_LABELS[a.status] || a.status}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--n-500)', fontWeight: 700, marginTop: 8 }}>
                📏 {a.distance_km} كم · 💰 {a.fee} ل.س
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--n-400)', marginTop: 4 }}>
                {new Date(a.assigned_at).toLocaleString('ar-EG')}
              </div>
              <div className="debt-actions">
                {a.status === 'assigned' && (
                  <button className="debt-action pay" onClick={() => updateStatus(a, 'picked_up')} type="button">📦 استلام</button>
                )}
                {a.status === 'picked_up' && (
                  <button className="debt-action pay" onClick={() => updateStatus(a, 'delivered')} type="button">✓ تسليم</button>
                )}
                <a href={`tel:${a.agent_phone}`} className="debt-action call" style={{ textDecoration: 'none' }}>📞</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode && (
        <div className="mng-modal-bg" onClick={() => setMode(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">🚚 تعيين مندوب</h3>

            <div className="new-service-field">
              <label className="new-service-label">الطلب</label>
              <select className="new-service-select" value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })}>
                <option value="">— اختر الطلب —</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>{o.order_code} — {o.customer_name} ({o.total} {o.currency})</option>
                ))}
              </select>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">المندوب</label>
              <select className="new-service-select" value={form.agent_name} onChange={(e) => {
                const a = agents.find((x) => x.full_name === e.target.value);
                setForm({ ...form, agent_name: e.target.value, agent_phone: a?.phone || '' });
              }}>
                <option value="">— اختر المندوب —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.full_name}>{a.full_name} ({a.vehicle_type})</option>
                ))}
              </select>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">المسافة (كم)</label>
                <input className="new-service-input" type="number" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">الأجرة (ل.س)</label>
                <input className="new-service-input" type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">ملاحظات</label>
              <textarea className="new-service-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setMode(null)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} type="button">✓ تعيين</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
