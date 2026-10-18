'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import ImageUploader from '@/components/ImageUploader';

const CATEGORIES = { general: 'عام', offer: 'عرض', news: 'خبر', urgent: 'عاجل' };
const PRIORITIES = {
  low: { label: 'منخفض', color: '#64748b' },
  normal: { label: 'عادي', color: '#3b82f6' },
  high: { label: 'مرتفع', color: '#f59e0b' },
  urgent: { label: 'عاجل', color: '#ef4444' }
};

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
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
    const { data } = await supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = items;
    if (filter !== 'all') list = list.filter(a => a.category === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a => (a.title || '').toLowerCase().includes(q) || (a.content || '').toLowerCase().includes(q));
    }
    return list;
  }, [items, search, filter]);

  function openAdd() {
    setForm({ title: '', content: '', category: 'general', priority: 'normal', image_url: '', is_active: true, pinned: false });
    setModal('add');
  }

  function openEdit(a) { setForm({ ...a }); setModal('edit'); }

  async function save() {
    if (!form.title?.trim()) { tE('العنوان مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_name: form.entity_name || null, // إعلان عام إذا كان فارغاً
        title: form.title.trim(),
        content: form.content?.trim() || null,
        category: form.category || 'general',
        priority: form.priority || 'normal',
        image_url: form.image_url || null,
        is_active: form.is_active !== false,
        pinned: form.pinned === true,
      };
      let err;
      if (modal === 'edit') ({ error: err } = await supabase.from('announcements').update(payload).eq('id', form.id));
      else ({ error: err } = await supabase.from('announcements').insert(payload));
      if (err) throw err;
      success(modal === 'edit' ? '✅ تم التعديل' : '✅ تم النشر');
      setModal(null); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(a) {
    if (!confirm(`حذف إعلان "${a.title}"؟`)) return;
    await supabase.from('announcements').delete().eq('id', a.id);
    success('✅ تم الحذف'); load();
  }

  async function toggle(a, field) {
    await supabase.from('announcements').update({ [field]: !a[field] }).eq('id', a.id);
    load();
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>📢 إدارة الإعلانات</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{items.length} إعلان</div>
        </div>
        <button onClick={openAdd} style={{ background: '#fff', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ إعلان</button>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all', 'الكل'], ['general', 'عام'], ['offer', 'عرض'], ['news', 'خبر'], ['urgent', 'عاجل']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 14px', background: filter === k ? '#0f4d3a' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="📢" title="لا توجد إعلانات" actionLabel="+ إعلان جديد" onAction={openAdd} />
        ) : filtered.map(a => {
          const p = PRIORITIES[a.priority] || PRIORITIES.normal;
          return (
            <div key={a.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${a.pinned ? '#fbbf24' : '#e5e7eb'}`, opacity: a.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{a.pinned && '📌 '}{a.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {a.entity_name ? `🏢 ${a.entity_name}` : '🌐 عام'} · 📂 {CATEGORIES[a.category]} · 📅 {new Date(a.created_at).toLocaleDateString('ar-EG')}
                  </div>
                </div>
                <span style={{ background: `${p.color}20`, color: p.color, padding: '3px 10px', borderRadius: 6, fontSize: 9.5, fontWeight: 900, height: 'fit-content' }}>{p.label}</span>
              </div>
              {a.image_url && <img src={a.image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 8 }} />}
              {a.content && <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, marginBottom: 8 }}>{a.content}</div>}
              <div style={{ display: 'flex', gap: 6, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                <button onClick={() => openEdit(a)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
                <button onClick={() => toggle(a, 'is_active')} style={{ flex: 1, padding: 8, background: a.is_active ? 'rgba(16,185,129,.1)' : '#f1f5f9', color: a.is_active ? '#10b981' : '#64748b', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{a.is_active ? '● نشط' : '○ معطل'}</button>
                <button onClick={() => toggle(a, 'pinned')} style={{ padding: 8, background: a.pinned ? 'rgba(251,191,36,.15)' : '#f1f5f9', color: a.pinned ? '#92400e' : '#64748b', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>📌</button>
                <button onClick={() => del(a)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{modal === 'edit' ? 'تعديل إعلان' : 'إعلان جديد'}</h3>

            <input type="text" placeholder="العنوان *" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <textarea placeholder="المحتوى..." value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <select value={form.category || 'general'} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={form.priority || 'normal'} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}>
                {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <ImageUploader label="📸 صورة الإعلان" folder="announcements" value={form.image_url || ''} onUpload={(url) => setForm({ ...form, image_url: url })} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f0fdf4', borderRadius: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#065f46' }}>نشط</span>
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#fffbeb', borderRadius: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.pinned === true} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#92400e' }}>📌 مثبت</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ نشر'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
