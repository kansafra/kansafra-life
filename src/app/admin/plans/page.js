'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function AdminPlansPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [plans, setPlans] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState({ plan_key: '', name: '', description: '', price: 0, duration_days: 30, max_employees: 5, max_devices: 2, max_products: 100, features: [], is_active: true, sort_order: 1 });
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!admin) { router.replace('/admin/login'); return; }
    loadAll();
  }, [router]);

  async function loadAll() {
    if (!supabase) return;
    try {
      const { data: p } = await supabase.from('subscription_plans').select('*').order('sort_order');
      setPlans(p || []);
      const { data: e } = await supabase.from('entities').select('subscription_plan');
      setEntities(e || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const planStats = useMemo(() => {
    const map = {};
    entities.forEach(e => {
      const k = e.subscription_plan || 'free';
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [entities]);

  function openAdd() {
    setForm({ plan_key: '', name: '', description: '', price: 0, duration_days: 30, max_employees: 5, max_devices: 2, max_products: 100, features: [], is_active: true, sort_order: plans.length + 1 });
    setEditPlan(null);
    setNewFeature('');
    setShowForm(true);
  }

  function openEdit(plan) {
    setForm({ ...plan, features: Array.isArray(plan.features) ? plan.features : [] });
    setEditPlan(plan);
    setNewFeature('');
    setShowForm(true);
  }

  function addFeature() {
    if (!newFeature.trim()) return;
    setForm({ ...form, features: [...(form.features || []), newFeature.trim()] });
    setNewFeature('');
  }

  function removeFeature(idx) {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { toastError('اسم الباقة مطلوب'); return; }
    if (!editPlan && !form.plan_key.trim()) { toastError('مفتاح الباقة مطلوب'); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price) || 0,
        duration_days: Number(form.duration_days) || 30,
        max_employees: Number(form.max_employees) || 5,
        max_devices: Number(form.max_devices) || 2,
        max_products: Number(form.max_products) || 100,
        features: form.features || [],
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 1,
        updated_at: new Date().toISOString(),
      };

      if (editPlan) {
        const { error } = await supabase.from('subscription_plans').update(payload).eq('id', editPlan.id);
        if (error) throw error;
        success('✅ تم التحديث');
      } else {
        payload.plan_key = form.plan_key.trim().toLowerCase();
        const { error } = await supabase.from('subscription_plans').insert(payload);
        if (error) {
          if (error.code === '23505') toastError('المفتاح مستخدم بالفعل');
          else throw error;
          setSaving(false);
          return;
        }
        success('✅ تمت الإضافة');
      }
      setShowForm(false);
      loadAll();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function toggleActive(plan) {
    const { error } = await supabase.from('subscription_plans').update({ is_active: !plan.is_active }).eq('id', plan.id);
    if (!error) {
      success(plan.is_active ? '⏸️ معطلة' : '✅ مفعلة');
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
    }
  }

  async function deletePlan(plan) {
    if (planStats[plan.plan_key] > 0) {
      toastError(`لا يمكن الحذف — ${planStats[plan.plan_key]} متجر مشترك في هذه الباقة`);
      return;
    }
    if (!confirm(`حذف باقة "${plan.name}"؟`)) return;
    const { error } = await supabase.from('subscription_plans').delete().eq('id', plan.id);
    if (!error) { success('🗑️ تم الحذف'); setPlans(prev => prev.filter(p => p.id !== plan.id)); }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>💎 باقات الاشتراك</h1>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f172a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديدة</button>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        {plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💎</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 12 }}>لا توجد باقات</div>
            <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف أول باقة</button>
          </div>
        ) : plans.map(plan => {
          const subs = planStats[plan.plan_key] || 0;
          const isPopular = plan.plan_key === 'pro';
          return (
            <div key={plan.id} style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, border: isPopular ? '2px solid #10b981' : '1px solid #e2e8f0', opacity: plan.is_active ? 1 : 0.6, position: 'relative' }}>
              {isPopular && (
                <div style={{ position: 'absolute', top: -10, right: 20, background: '#10b981', color: '#fff', padding: '3px 12px', borderRadius: 10, fontSize: 10, fontWeight: 900 }}>⭐ الأكثر طلباً</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{plan.name}</div>
                    {!plan.is_active && <span style={{ fontSize: 9, background: 'rgba(148,163,184,0.15)', color: '#64748b', padding: '2px 6px', borderRadius: 4, fontWeight: 900 }}>معطلة</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>@{plan.plan_key}</div>
                  {plan.description && <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>{plan.description}</div>}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0f4d3a' }}>{Number(plan.price).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>ل.س / {plan.duration_days} يوم</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
                <MiniStat icon="👥" label="موظفين" value={plan.max_employees} />
                <MiniStat icon="📱" label="أجهزة" value={plan.max_devices} />
                <MiniStat icon="📦" label="منتجات" value={plan.max_products >= 999999 ? '∞' : plan.max_products} />
              </div>

              {Array.isArray(plan.features) && plan.features.length > 0 && (
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>✓ {f}</div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800 }}>
                  🏪 <strong style={{ color: '#0f4d3a' }}>{subs}</strong> متجر مشترك
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(plan)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️ تعديل</button>
                <button onClick={() => toggleActive(plan)} style={btnStyle(plan.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', plan.is_active ? '#f59e0b' : '#10b981')}>
                  {plan.is_active ? '⏸️ تعطيل' : '✅ تفعيل'}
                </button>
                <button onClick={() => deletePlan(plan)} disabled={subs > 0} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')} title={subs > 0 ? 'لا يمكن الحذف (لديها مشتركون)' : ''}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{editPlan ? '✏️ تعديل باقة' : '💎 باقة جديدة'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              {!editPlan && (
                <div style={fieldStyle}>
                  <label style={labelStyle}>المفتاح (بالإنجليزية) *</label>
                  <input value={form.plan_key} onChange={e => setForm({ ...form, plan_key: e.target.value })} style={inputStyle} placeholder="مثال: premium" required />
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>لا يمكن تعديله بعد الإنشاء</div>
                </div>
              )}
              <div style={fieldStyle}><label style={labelStyle}>اسم الباقة *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} required /></div>
              <div style={fieldStyle}><label style={labelStyle}>الوصف</label>
                <input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={fieldStyle}><label style={labelStyle}>السعر (ل.س)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} /></div>
                <div style={fieldStyle}><label style={labelStyle}>المدة (أيام)</label>
                  <input type="number" value={form.duration_days} onChange={e => setForm({ ...form, duration_days: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                <div style={fieldStyle}><label style={labelStyle}>حد الموظفين</label>
                  <input type="number" value={form.max_employees} onChange={e => setForm({ ...form, max_employees: e.target.value })} style={inputStyle} /></div>
                <div style={fieldStyle}><label style={labelStyle}>حد الأجهزة</label>
                  <input type="number" value={form.max_devices} onChange={e => setForm({ ...form, max_devices: e.target.value })} style={inputStyle} /></div>
                <div style={fieldStyle}><label style={labelStyle}>حد المنتجات</label>
                  <input type="number" value={form.max_products} onChange={e => setForm({ ...form, max_products: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>الميزات</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input value={newFeature} onChange={e => setNewFeature(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="أضف ميزة..." onKeyPress={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }} />
                  <button type="button" onClick={addFeature} style={{ background: '#0f4d3a', color: '#fff', border: 'none', padding: '0 16px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(form.features || []).map((f, i) => (
                    <div key={i} style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {f}
                      <button type="button" onClick={() => removeFeature(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>الترتيب</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>الحالة</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ width: 18, height: 18 }} />
                    <span style={{ fontSize: 12, fontWeight: 800 }}>مفعلة</span>
                  </label>
                </div>
              </div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳' : (editPlan ? '💾 حفظ' : '➕ إضافة')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 8, padding: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 14 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 900, color: '#0f4d3a' }}>{value}</div>
      <div style={{ fontSize: 9, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </div>
  );
}

const btnStyle = (bg, color) => ({ flex: 1, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
const fieldStyle = { marginBottom: 12 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
