'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const TYPES = [
  { key: 'city', label: 'مدينة', icon: '🏙️' },
  { key: 'town', label: 'بلدة', icon: '🏘️' },
  { key: 'village', label: 'قرية', icon: '🏡' },
  { key: 'area', label: 'حي', icon: '📍' },
];

export default function AdminGeographyPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'city', parent: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!admin) { router.replace('/admin/login'); return; }
    loadItems();
  }, [router]);

  async function loadItems() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('geography').select('*').order('name');
      setItems(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function saveItem(e) {
    e.preventDefault();
    if (!form.name.trim()) { toastError('الاسم مطلوب'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('geography').insert({
        name: form.name.trim(), type: form.type, parent: form.parent.trim() || null, is_active: true,
      });
      if (error) throw error;
      success('✅ تمت الإضافة');
      setShowForm(false);
      setForm({ name: '', type: 'city', parent: '' });
      loadItems();
    } catch (err) { toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function deleteItem(item) {
    if (!confirm(`حذف "${item.name}"؟`)) return;
    setDeleting(item.id);
    const { error } = await supabase.from('geography').delete().eq('id', item.id);
    if (!error) { success('🗑️ تم الحذف'); setItems(prev => prev.filter(x => x.id !== item.id)); }
    setDeleting(null);
  }

  const grouped = TYPES.map(t => ({ ...t, items: items.filter(i => i.type === t.key) }));

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f172a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>🗺️ الجغرافيا</h1>
          <button onClick={() => setShowForm(true)} style={{ background: '#fbbf24', color: '#0f172a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        {grouped.map(g => (
          <div key={g.key} style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>{g.icon} {g.label} ({g.items.length})</h2>
            {g.items.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', background: '#fff', borderRadius: 10, color: '#94a3b8', fontSize: 12 }}>لا توجد {g.label}</div>
            ) : g.items.map(item => (
              <div key={item.id} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 6, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{item.name}</div>
                  {item.parent && <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>داخل: {item.parent}</div>}
                </div>
                <button onClick={() => deleteItem(item)} disabled={deleting === item.id} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{deleting === item.id ? '⏳' : '🗑️'}</button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 20px' }}>🗺️ إضافة منطقة</h2>
            <form onSubmit={saveItem}>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الاسم *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>النوع</label><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>{TYPES.map(t => (<button key={t.key} type="button" onClick={() => setForm({ ...form, type: t.key })} style={{ padding: 10, background: form.type === t.key ? 'rgba(16,185,129,0.1)' : '#f8fafc', color: form.type === t.key ? '#059669' : '#475569', border: form.type === t.key ? '2px solid #10b981' : '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{t.icon} {t.label}</button>))}</div></div>
              <div style={{ marginBottom: 20 }}><label style={labelStyle}>داخل (اختياري)</label><input value={form.parent} onChange={e => setForm({ ...form, parent: e.target.value })} style={inputStyle} placeholder="مثال: إدلب" /></div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>{saving ? '⏳' : '➕ إضافة'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
