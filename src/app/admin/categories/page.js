'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function AdminCategories() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [cats, setCats] = useState([]);
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
    const { data } = await supabase.from('service_categories').select('*').order('sort_order', { ascending: true });
    setCats(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', slug: '', icon: '📦', description: '', sort_order: cats.length + 1, is_active: true, is_visible: true });
    setModal(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({ ...c });
    setModal(true);
  }

  async function save() {
    if (!form.name?.trim()) { tE('الاسم مطلوب'); return; }
    if (!form.slug?.trim()) { tE('Slug مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        icon: form.icon || '📦',
        description: form.description?.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active !== false,
        is_visible: form.is_visible !== false,
      };
      let err;
      if (editing) {
        ({ error: err } = await supabase.from('service_categories').update(payload).eq('id', editing.id));
      } else {
        ({ error: err } = await supabase.from('service_categories').insert(payload));
      }
      if (err) throw err;
      success(editing ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(false);
      load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(c) {
    if (!confirm(`حذف "${c.name}"؟ سيؤثر على كل الخدمات المرتبطة`)) return;
    try {
      await supabase.from('service_categories').delete().eq('id', c.id);
      success('✅ تم الحذف');
      load();
    } catch (e) { tE('تعذّر: ' + e.message); }
  }

  async function toggle(c, field) {
    try {
      await supabase.from('service_categories').update({ [field]: !c[field] }).eq('id', c.id);
      success('تم');
      load();
    } catch (e) { tE('تعذّر'); }
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🗂️ الأقسام ({cats.length})</div>
        <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ قسم</button>
      </div>

      <div style={{ padding: 16 }}>
        {cats.length === 0 ? <EmptyState icon="🗂️" title="لا توجد أقسام" actionLabel="+ إضافة" onAction={openAdd} /> : cats.map((c, i) => (
          <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', opacity: c.is_active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{c.icon || '📦'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>/{c.slug}</div>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 800 }}>#{c.sort_order || i + 1}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ background: c.is_active ? 'rgba(16,185,129,.15)' : 'rgba(100,116,139,.1)', color: c.is_active ? '#10b981' : '#64748b', padding: '2px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 800 }}>{c.is_active ? '● نشط' : '○ معطل'}</span>
              <span style={{ background: c.is_visible ? 'rgba(59,130,246,.15)' : 'rgba(100,116,139,.1)', color: c.is_visible ? '#3b82f6' : '#64748b', padding: '2px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 800 }}>{c.is_visible ? '👁️ مرئي' : '🚫 مخفي'}</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => openEdit(c)} style={{ flex: 1, padding: 6, background: '#f1f5f9', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
              <button onClick={() => toggle(c, 'is_active')} style={{ flex: 1, padding: 6, background: '#f1f5f9', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{c.is_active ? '⏸ إيقاف' : '▶ تفعيل'}</button>
              <button onClick={() => toggle(c, 'is_visible')} style={{ flex: 1, padding: 6, background: '#f1f5f9', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{c.is_visible ? '🚫 إخفاء' : '👁️ إظهار'}</button>
              <button onClick={() => del(c)} style={{ padding: 6, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{editing ? 'تعديل قسم' : 'قسم جديد'}</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input type="text" placeholder="الأيقونة (إيموجي)" value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} style={{ width: 80, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 20, textAlign: 'center', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <input type="text" placeholder="اسم القسم *" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ flex: 1, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <input type="text" placeholder="Slug (بالإنجليزية) *" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }} />
            <input type="text" placeholder="الوصف" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="number" placeholder="الترتيب" value={form.sort_order || ''} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: 10, background: '#f0fdf4', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> نشط
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: 10, background: '#eff6ff', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                <input type="checkbox" checked={form.is_visible !== false} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} /> مرئي
              </label>
            </div>
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
