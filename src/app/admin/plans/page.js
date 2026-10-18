'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function AdminPlans() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('subscription_plans').select('*').order('sort_order', { ascending: true });
    setPlans(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', name_en: '', price: 0, period: 'monthly', icon: '💎', color: '#0f4d3a', description: '', max_products: 10, max_orders: 100, features: [], is_active: true, sort_order: plans.length + 1 });
    setModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({ ...p, features: Array.isArray(p.features) ? p.features : [] });
    setModal(true);
  }

  async function save() {
    if (!form.name_en?.trim()) { tE('الاسم الإنجليزي مطلوب'); return; }
    if (!form.price || Number(form.price) < 0) { tE('السعر مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name?.trim() || form.name_en.trim(),
        name_en: form.name_en.trim(),
        price: Number(form.price),
        period: form.period || 'monthly',
        icon: form.icon || '💎',
        color: form.color || '#0f4d3a',
        description: form.description?.trim() || null,
        max_products: Number(form.max_products) || 10,
        max_orders: Number(form.max_orders) || 100,
        features: Array.isArray(form.features) ? form.features.filter(f => f.trim()) : [],
        is_active: form.is_active !== false,
        sort_order: Number(form.sort_order) || 0,
      };
      let err;
      if (editing) ({ error: err } = await supabase.from('subscription_plans').update(payload).eq('id', editing.id));
      else ({ error: err } = await supabase.from('subscription_plans').insert(payload));
      if (err) throw err;
      success(editing ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(false); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(p) {
    if (!confirm(`حذف باقة "${p.name_en}"؟`)) return;
    await supabase.from('subscription_plans').delete().eq('id', p.id);
    success('✅ تم'); load();
  }

  async function toggle(p) {
    await supabase.from('subscription_plans').update({ is_active: !p.is_active }).eq('id', p.id);
    load();
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>💎 الباقات ({plans.length})</div>
        <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ باقة</button>
      </div>
      <div style={{ padding: 16 }}>
        {plans.length === 0 ? <EmptyState icon="💎" title="لا توجد باقات" actionLabel="+ إضافة" onAction={openAdd} /> : plans.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid #e5e7eb', opacity: p.is_active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: p.color || '#0f4d3a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{p.icon || '💎'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 900 }}>{p.name_en}</div>
                {p.description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{p.description}</div>}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: p.color || '#0f4d3a', direction: 'ltr' }}>${p.price}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>/{p.period === 'yearly' ? 'سنة' : 'شهر'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, fontSize: 10.5, color: '#64748b', flexWrap: 'wrap' }}>
              <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>📦 {p.max_products} منتج</span>
              <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>🛍️ {p.max_orders} طلب</span>
              {Array.isArray(p.features) && p.features.length > 0 && <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>✨ {p.features.length} ميزة</span>}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => openEdit(p)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
              <button onClick={() => toggle(p)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{p.is_active ? '⏸ إيقاف' : '▶ تفعيل'}</button>
              <button onClick={() => del(p)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{editing ? 'تعديل باقة' : 'باقة جديدة'}</h3>
            <input type="text" placeholder="الاسم بالعربية" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="text" placeholder="الاسم بالإنجليزية *" value={form.name_en || ''} onChange={(e) => setForm({ ...form, name_en: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input type="number" placeholder="السعر $" value={form.price || 0} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <select value={form.period || 'monthly'} onChange={(e) => setForm({ ...form, period: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}>
                <option value="monthly">شهري</option>
                <option value="yearly">سنوي</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input type="text" placeholder="الأيقونة" value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 20, textAlign: 'center', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <input type="color" value={form.color || '#0f4d3a'} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ padding: 4, border: '1px solid #e5e7eb', borderRadius: 10, height: 46, boxSizing: 'border-box' }} />
            </div>
            <input type="text" placeholder="وصف الباقة" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input type="number" placeholder="حد المنتجات" value={form.max_products || 10} onChange={(e) => setForm({ ...form, max_products: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <input type="number" placeholder="حد الطلبات" value={form.max_orders || 100} onChange={(e) => setForm({ ...form, max_orders: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الميزات (سطر لكل ميزة)</label>
            <textarea value={(form.features || []).join('\n')} onChange={(e) => setForm({ ...form, features: e.target.value.split('\n') })} rows={4} placeholder="100 منتج&#10;تقارير أساسية&#10;دعم أولوية" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f0fdf4', borderRadius: 8, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#065f46' }}>نشطة</span>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
