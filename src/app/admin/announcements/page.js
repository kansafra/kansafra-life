'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'published', label: 'منشور' },
  { key: 'draft', label: 'مسودة' },
];

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', image_url: '', is_published: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!stored) { router.replace('/admin/login'); return; }
    loadItems();
  }, [router]);

  async function loadItems() {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      setItems(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ title: '', content: '', image_url: '', is_published: true });
    setEditItem(null);
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({
      title: item.title || '',
      content: item.content || item.body || '',
      image_url: item.image_url || '',
      is_published: item.is_published !== false,
    });
    setEditItem(item);
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) { toastError('العنوان مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        body: form.content, 
        image_url: form.image_url,
        is_published: form.is_published,
      };

      if (editItem) {
        const { error } = await supabase.from('announcements').update(payload).eq('id', editItem.id);
        if (error) throw error;
        success('✅ تم تحديث الإعلان');
      } else {
        const { error } = await supabase.from('announcements').insert(payload);
        if (error) throw error;
        success('✅ تم إضافة الإعلان');
      }
      setShowForm(false);
      loadItems();
    } catch (err) {
      console.error(err);
      toastError('حدث خطأ، تأكد من البيانات');
    } finally { setSaving(false); }
  }

  async function handleDelete(item) {
    if (!confirm(`حذف إعلان "${item.title}"؟`)) return;
    setDeleting(item.id);
    const { error } = await supabase.from('announcements').delete().eq('id', item.id);
    if (error) toastError('فشل الحذف');
    else { success('🗑️ تم الحذف'); setItems(prev => prev.filter(x => x.id !== item.id)); }
    setDeleting(null);
  }

  const filtered = useMemo(() => {
    let list = items;
    if (filter === 'published') list = list.filter(i => i.is_published !== false);
    if (filter === 'draft') list = list.filter(i => i.is_published === false);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i => (i.title || '').toLowerCase().includes(q) || (i.content || i.body || '').toLowerCase().includes(q));
    }
    return list;
  }, [items, filter, search]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>📢 الإعلانات</h1>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f172a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
        <input type="search" placeholder="🔍 ابحث في الإعلانات..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#fff' : 'rgba(255,255,255,0.1)', color: filter === f.key ? '#0f172a' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📢</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>
              {items.length === 0 ? 'لا توجد إعلانات بعد' : 'لا توجد نتائج مطابقة'}
            </div>
            {items.length === 0 && (
              <button onClick={openAdd} style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف أول إعلان</button>
            )}
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} style={{ background: '#fff', borderRadius: 16, marginBottom: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || 'بدون عنوان'}</div>
                      {item.is_published !== false ? (
                        <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 900 }}>منشور</span>
                      ) : (
                        <span style={{ background: 'rgba(148,163,184,0.15)', color: '#64748b', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 900 }}>مسودة</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.content || item.body || '—'}
                    </div>
                  </div>
                  {item.image_url && (
                    <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                      <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 12 }}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-SY') : '—'}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(item)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️ تعديل</button>
                  <button onClick={() => handleDelete(item)} disabled={deleting === item.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{deleting === item.id ? '⏳' : '🗑️ حذف'}</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <button onClick={openAdd} style={{
        position: 'fixed', bottom: 20, left: 20, right: 20,
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff', padding: 16, borderRadius: 14,
        border: 'none', fontSize: 15, fontWeight: 900,
        boxShadow: '0 10px 30px rgba(16,185,129,0.4)',
        cursor: 'pointer', fontFamily: 'inherit', zIndex: 30
      }}>
        + إضافة إعلان جديد
      </button>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{editItem ? '✏️ تعديل إعلان' : '📢 إعلان جديد'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>العنوان *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} placeholder="عنوان الإعلان" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>المحتوى</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} style={{ ...inputStyle, height: 120, resize: 'none' }} placeholder="نص الإعلان..." />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>رابط الصورة (اختياري)</label>
                <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} style={inputStyle} placeholder="https://..." />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 13, fontWeight: 800 }}>نشر الإعلان مباشرة</span>
                </label>
              </div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ جارٍ الحفظ...' : (editItem ? 'حفظ التغييرات' : 'إضافة الإعلان')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = (bg, color) => ({ background: bg, color, border: 'none', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', flex: 1 });
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
