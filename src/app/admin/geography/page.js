'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const TYPES = {
  country: { label: 'دولة', icon: '🌍', color: '#dc2626' },
  governorate: { label: 'محافظة', icon: '🗺️', color: '#f59e0b' },
  city: { label: 'مدينة', icon: '🏙️', color: '#3b82f6' },
  village: { label: 'قرية', icon: '🏘️', color: '#10b981' },
  neighborhood: { label: 'حي', icon: '🏠', color: '#8b5cf6' },
};

export default function AdminGeography() {
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
    const { data } = await supabase.from('geography').select('*').order('type').order('name');
    setItems(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', type: 'city', parent_id: null, lat: '', lng: '', is_active: true });
    setModal(true);
  }

  function openEdit(g) { setEditing(g); setForm({ ...g }); setModal(true); }

  async function save() {
    if (!form.name?.trim()) { tE('الاسم مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type || 'city',
        parent_id: form.parent_id || null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        is_active: form.is_active !== false,
      };
      let err;
      if (editing) ({ error: err } = await supabase.from('geography').update(payload).eq('id', editing.id));
      else ({ error: err } = await supabase.from('geography').insert(payload));
      if (err) throw err;
      success(editing ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(false); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(g) {
    if (!confirm(`حذف "${g.name}"؟`)) return;
    await supabase.from('geography').delete().eq('id', g.id);
    success('✅ تم'); load();
  }

  async function toggle(g) {
    await supabase.from('geography').update({ is_active: !g.is_active }).eq('id', g.id);
    load();
  }

  function getParentName(id) {
    const p = items.find(x => x.id === id);
    return p ? p.name : '';
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🗺️ الجغرافيا ({items.length})</div>
        <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ منطقة</button>
      </div>
      <div style={{ padding: 16 }}>
        {items.length === 0 ? <EmptyState icon="🗺️" title="لا توجد مناطق" description="أضف الدول والمحافظات والمدن" actionLabel="+ إضافة" onAction={openAdd} /> : items.map(g => {
          const t = TYPES[g.type] || TYPES.city;
          return (
            <div key={g.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', opacity: g.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${t.color}20`, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {t.label}
                    {g.parent_id && ` · ${getParentName(g.parent_id)}`}
                  </div>
                  {g.lat && g.lng && <div style={{ fontSize: 10, color: '#94a3b8', direction: 'ltr', textAlign: 'right', marginTop: 2 }}>📍 {g.lat}, {g.lng}</div>}
                </div>
                <span style={{ background: g.is_active ? 'rgba(16,185,129,.15)' : '#f1f5f9', color: g.is_active ? '#10b981' : '#64748b', padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900 }}>{g.is_active ? '● نشط' : '○ معطل'}</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openEdit(g)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
                <button onClick={() => toggle(g)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{g.is_active ? '⏸' : '▶'}</button>
                <button onClick={() => del(g)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{editing ? 'تعديل منطقة' : 'منطقة جديدة'}</h3>
            <input type="text" placeholder="الاسم *" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <select value={form.type || 'city'} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <select value={form.parent_id || ''} onChange={(e) => setForm({ ...form, parent_id: e.target.value || null })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
              <option value="">— بدون أب —</option>
              {items.filter(i => i.id !== editing?.id).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <input type="number" step="0.0001" placeholder="Latitude" value={form.lat || ''} onChange={(e) => setForm({ ...form, lat: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12, boxSizing: 'border-box', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }} />
              <input type="number" step="0.0001" placeholder="Longitude" value={form.lng || ''} onChange={(e) => setForm({ ...form, lng: e.target.value })} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12, boxSizing: 'border-box', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }} />
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
