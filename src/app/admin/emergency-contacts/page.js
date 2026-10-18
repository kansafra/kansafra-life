'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const CATEGORIES = {
  police: { label: 'شرطة', icon: '🚔', color: '#3b82f6' },
  ambulance: { label: 'إسعاف', icon: '🚑', color: '#ef4444' },
  fire: { label: 'دفاع مدني', icon: '🚒', color: '#f59e0b' },
  hospital: { label: 'مستشفى', icon: '🏥', color: '#10b981' },
  general: { label: 'عام', icon: '📞', color: '#64748b' },
};

export default function AdminEmergencyContacts() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
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
    const { data } = await supabase.from('emergency_contacts').select('*').order('sort_order');
    setItems(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', phone: '', category: 'general', icon: '📞', description: '', city: '', is_active: true, sort_order: items.length + 1 });
    setModal(true);
  }

  function openEdit(c) { setEditing(c); setForm({ ...c }); setModal(true); }

  async function save() {
    if (!form.name?.trim()) { tE('الاسم مطلوب'); return; }
    if (!form.phone?.trim()) { tE('الهاتف مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), phone: form.phone.trim(),
        category: form.category || 'general', icon: form.icon || '📞',
        description: form.description?.trim() || null, city: form.city?.trim() || null,
        is_active: form.is_active !== false, sort_order: Number(form.sort_order) || 0,
      };
      let err;
      if (editing) ({ error: err } = await supabase.from('emergency_contacts').update(payload).eq('id', editing.id));
      else ({ error: err } = await supabase.from('emergency_contacts').insert(payload));
      if (err) throw err;
      success(editing ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(false); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(c) {
    if (!confirm(`حذف "${c.name}"؟`)) return;
    await supabase.from('emergency_contacts').delete().eq('id', c.id);
    success('✅ تم'); load();
  }

  async function toggle(c) {
    await supabase.from('emergency_contacts').update({ is_active: !c.is_active }).eq('id', c.id);
    load();
  }

  function call(phone) {
    window.location.href = `tel:${phone}`;
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#dc2626', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🚨 جهات الطوارئ ({items.length})</div>
        <button onClick={openAdd} style={{ background: '#fff', color: '#dc2626', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
      </div>
      <div style={{ padding: 16 }}>
        {items.length === 0 ? <EmptyState icon="🚨" title="لا توجد جهات اتصال" actionLabel="+ إضافة" onAction={openAdd} /> : items.map(c => {
          const cat = CATEGORIES[c.category] || CATEGORIES.general;
          return (
            <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', opacity: c.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${cat.color}20`, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{c.icon || cat.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{c.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: cat.color, direction: 'ltr', textAlign: 'right', marginTop: 2 }}>{c.phone}</div>
                  {c.city && <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>📍 {c.city}</div>}
                </div>
                <span style={{ background: c.is_active ? 'rgba(16,185,129,.15)' : '#f1f5f9', color: c.is_active ? '#10b981' : '#64748b', padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900 }}>{c.is_active ? '● نشط' : '○ معطل'}</span>
              </div>
              {c.description && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, lineHeight: 1.5 }}>{c.description}</div>}
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => call(c.phone)} style={{ flex: 1, padding: 8, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📞 اتصال</button>
                <button onClick={() => openEdit(c)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️</button>
                <button onClick={() => toggle(c)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{c.is_active ? '⏸' : '▶'}</button>
                <button onClick={() => del(c)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{editing ? 'تعديل' : 'جهة جديدة'}</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input type="text" value={form.icon || '📞'} onChange={(e) => setForm({ ...form, icon: e.target.value })} style={{ width: 70, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 20, textAlign: 'center', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <input type="text" placeholder="الاسم *" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ flex: 1, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <input type="tel" placeholder="رقم الهاتف *" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }} />
            <select value={form.category || 'general'} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <input type="text" placeholder="المدينة" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <textarea placeholder="الوصف" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
