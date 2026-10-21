'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function InternetPlansPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState({ name: '', speed_mbps: '', price: '', duration_days: '30', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) setEntityId(data.id); });
    loadPlans();
  }, [user, userLoading, dataOwnerName]);

  async function loadPlans() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('internet_plans').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false });
      setPlans(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ name: '', speed_mbps: '', price: '', duration_days: '30', description: '' });
    setEditPlan(null);
    setShowForm(true);
  }

  function openEdit(p) {
    setForm({ name: p.name || '', speed_mbps: String(p.speed_mbps || ''), price: String(p.price || ''), duration_days: String(p.duration_days || 30), description: p.description || '' });
    setEditPlan(p);
    setShowForm(true);
  }

  async function savePlan(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.speed_mbps) { toastError('الاسم والسعر والسرعة مطلوبة'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        name: form.name.trim(), speed_mbps: Number(form.speed_mbps),
        price: Number(form.price), duration_days: Number(form.duration_days) || 30,
        description: form.description.trim() || null, is_active: true,
      };
      if (editPlan) {
        const { error } = await supabase.from('internet_plans').update(payload).eq('id', editPlan.id);
        if (error) throw error;
        success('✅ تم التعديل');
      } else {
        const { error } = await supabase.from('internet_plans').insert(payload);
        if (error) throw error;
        success('🎉 تم إضافة الخطة');
      }
      setShowForm(false);
      loadPlans();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function deletePlan(p) {
    if (!confirm(`حذف الخطة "${p.name}"؟`)) return;
    const { error } = await supabase.from('internet_plans').delete().eq('id', p.id);
    if (!error) { success('🗑️ تم الحذف'); setPlans(prev => prev.filter(x => x.id !== p.id)); }
  }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>📡 خطط الإنترنت</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/internet/plans" style={navStyle(true)}>📡 الخطط</Link>
        <Link href="/merchant/internet/subscribers" style={navStyle(false)}>👥 المشتركون</Link>
        <Link href="/merchant/internet/invoices" style={navStyle(false)}>💰 الفواتير</Link>
        <Link href="/merchant/internet/tickets" style={navStyle(false)}>🎫 التذاكر</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        {plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📡</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>لا توجد خطط بعد</div>
            <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف أول خطة</button>
          </div>
        ) : plans.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>⚡ {p.speed_mbps} Mbps · 💵 {p.price} ل.س · ⏱️ {p.duration_days} يوم</div>
              {p.description && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.description}</div>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(p)} style={{ padding: 8, background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>✏️</button>
              <button onClick={() => deletePlan(p)} style={{ padding: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 20px' }}>{editPlan ? '✏️ تعديل خطة' : '📡 خطة جديدة'}</h2>
            <form onSubmit={savePlan}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>اسم الخطة *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} placeholder="مثال: الباقة الذهبية" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>السرعة (Mbps) *</label><input type="number" value={form.speed_mbps} onChange={e => setForm({ ...form, speed_mbps: e.target.value })} required style={inputStyle} /></div>
                <div><label style={labelStyle}>السعر (ل.س) *</label><input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>المدة (أيام)</label><input type="number" value={form.duration_days} onChange={e => setForm({ ...form, duration_days: e.target.value })} style={inputStyle} /></div>
              <div style={{ marginBottom: 20 }}><label style={labelStyle}>وصف (اختياري)</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} /></div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function navStyle(active) { return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' }; }
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
