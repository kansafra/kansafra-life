'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function AdminCommunities() {
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
    const { data } = await supabase.from('communities').select('*').order('sort_order');
    setItems(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', governorate: 'إدلب', city: '', description: '', icon: '🏘️', is_active: true, sort_order: items.length + 1 });
    setModal(true);
  }

  function openEdit(c) {
    setEditing(c); setForm({ ...c }); setModal(true);
  }

  async function save() {
    if (!form.name?.trim()) { tE('الاسم مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), governorate: form.governorate?.trim() || null,
        city: form.city?.trim() || null, description: form.description?.trim() || null,
        icon: form.icon || '🏘️', is_active: form.is_active !== false,
        sort_order: Number(form.sort_order) || 0,
      };
      let err;
      if (editing) ({ error: err } = await supabase.from('communities').update(payload).eq('id', editing.id));
      else ({ error: err } = await supabase.from('communities').insert(payload));
      if (err) throw err;
      success(editing ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(false); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(c) {
    if (!confirm(`حذف "${c.name}"؟`)) return;
    await supabase.from('communities').delete().eq('id', c.id);
    success('✅ تم'); load();
  }

  async function toggle(c) {
    await supabase.from('communities').update({ is_active: !c.is_active }).eq('id', c.id);
    load();
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🏘️ المجتمعات ({items.length})</div>
        <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ مجتمع</button>
      </div>
      <div style={{ padding: 16 }}>
        {items.length === 0 ? <EmptyState icon="🏘️" title="لا توجد مجتمعات" actionLabel="+ إضافة" onAction={openAdd} /> : items.map(c => (
          <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', opacity: c.is_active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{c.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 900 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{c.governorate}{c.city ? ` · ${c.city}` : ''}</div>
              </div>
              <span style={{ background: c.is_active ? 'rgba(16,185,129,.15)' : '#f1f5f9', color: c.is_active ? '#10b981' : '#64748b', padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900 }}>{c.is_active ? '● نشط' : '○ معطل'}</span>
            </div>
            {c.description && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{c.description}</div>}
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => openEdit(c)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
              <button onClick={() => toggle(c)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{c.is_active ? '⏸' : '▶'}</button>
              <button onClick={() => del(c)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{editing ? 'تعديل' : 'مجتمع جديد'}</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input type="text" value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} style={{ width: 70, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 20, textAlign: 'center', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <input type="text" placeholder="اسم المجتمع *" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ flex: 1, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input type="text" placeholder="المحافظة" value={form.governorate || ''} onChange={(e) => setForm({ ...form, governorate: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <input type="text" placeholder="المدينة" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <input type="text" placeholder="وصف" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' }} />
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
