'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function AdminAzkar() {
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
    const { data } = await supabase.from('azkar').select('*').order('sort_order');
    setItems(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ text: '', source: '', category: 'general', is_active: true, sort_order: items.length + 1 });
    setModal(true);
  }

  function openEdit(a) { setEditing(a); setForm({ ...a }); setModal(true); }

  async function save() {
    if (!form.text?.trim()) { tE('الذكر مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        text: form.text.trim(),
        source: form.source?.trim() || null,
        category: form.category || 'general',
        is_active: form.is_active !== false,
        sort_order: Number(form.sort_order) || 0,
      };
      let err;
      if (editing) ({ error: err } = await supabase.from('azkar').update(payload).eq('id', editing.id));
      else ({ error: err } = await supabase.from('azkar').insert(payload));
      if (err) throw err;
      success(editing ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(false); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(a) {
    if (!confirm('حذف هذا الذكر؟')) return;
    await supabase.from('azkar').delete().eq('id', a.id);
    success('✅ تم'); load();
  }

  async function toggle(a) {
    await supabase.from('azkar').update({ is_active: !a.is_active }).eq('id', a.id);
    load();
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🕌 الأذكار ({items.length})</div>
        <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ ذكر</button>
      </div>
      <div style={{ padding: 16 }}>
        {items.length === 0 ? <EmptyState icon="🕌" title="لا توجد أذكار" actionLabel="+ إضافة" onAction={openAdd} /> : items.map(a => (
          <div key={a.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', opacity: a.is_active ? 1 : 0.6 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0f4d3a', marginBottom: 6, lineHeight: 1.6, textAlign: 'center', padding: '8px 0' }}>{a.text}</div>
            {a.source && <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginBottom: 8 }}>— {a.source}</div>}
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => openEdit(a)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️</button>
              <button onClick={() => toggle(a)} style={{ flex: 1, padding: 8, background: a.is_active ? 'rgba(16,185,129,.15)' : '#f1f5f9', color: a.is_active ? '#10b981' : '#64748b', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{a.is_active ? '● نشط' : '○ معطل'}</button>
              <button onClick={() => del(a)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{editing ? 'تعديل ذكر' : 'ذكر جديد'}</h3>
            <textarea placeholder="نص الذكر *" value={form.text || ''} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={3} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', textAlign: 'center', fontWeight: 700 }} />
            <input type="text" placeholder="المصدر (رواه البخاري، إلخ)" value={form.source || ''} onChange={(e) => setForm({ ...form, source: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' }} />
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
