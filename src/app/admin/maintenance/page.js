'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const TYPES = {
  routine: { label: 'دورية', icon: '🔧', color: '#3b82f6' },
  emergency: { label: 'طارئة', icon: '🚨', color: '#ef4444' },
  update: { label: 'تحديث', icon: '⬆️', color: '#8b5cf6' },
  backup: { label: 'نسخ احتياطي', icon: '💾', color: '#10b981' },
};

const STATUS = {
  pending: { label: 'معلقة', color: '#f59e0b', icon: '⏳' },
  in_progress: { label: 'جارية', color: '#3b82f6', icon: '⚙️' },
  completed: { label: 'مكتملة', color: '#10b981', icon: '✅' },
  cancelled: { label: 'ملغاة', color: '#64748b', icon: '❌' },
};

export default function AdminMaintenance() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('maintenance_logs').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ title: '', description: '', type: 'routine', status: 'pending', scheduled_date: '', cost: 0, notes: '' });
    setModal(true);
  }

  function openEdit(m) { setEditing(m); setForm({ ...m }); setModal(true); }

  async function save() {
    if (!form.title?.trim()) { tE('العنوان مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || null,
        type: form.type || 'routine',
        status: form.status || 'pending',
        scheduled_date: form.scheduled_date || null,
        completed_date: form.status === 'completed' && !form.completed_date ? new Date().toISOString().slice(0, 10) : (form.completed_date || null),
        cost: Number(form.cost) || 0,
        notes: form.notes?.trim() || null,
      };
      let err;
      if (editing) ({ error: err } = await supabase.from('maintenance_logs').update(payload).eq('id', editing.id));
      else ({ error: err } = await supabase.from('maintenance_logs').insert(payload));
      if (err) throw err;
      success(editing ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(false); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(m) {
    if (!confirm('حذف هذه المهمة؟')) return;
    await supabase.from('maintenance_logs').delete().eq('id', m.id);
    success('✅ تم'); load();
  }

  async function changeStatus(m, newStatus) {
    const updates = { status: newStatus };
    if (newStatus === 'completed') updates.completed_date = new Date().toISOString().slice(0, 10);
    await supabase.from('maintenance_logs').update(updates).eq('id', m.id);
    success('✅ تم'); load();
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(i => i.status === filter);
  }, [items, filter]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      in_progress: items.filter(i => i.status === 'in_progress').length,
      completed: items.filter(i => i.status === 'completed').length,
    };
  }, [items]);

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🔧 الصيانة ({stats.total})</div>
        <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ مهمة</button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b' }}>{stats.pending}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 2 }}>معلقة</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#3b82f6' }}>{stats.in_progress}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 2 }}>جارية</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>{stats.completed}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 2 }}>مكتملة</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
          {[['all','الكل',stats.total],['pending','معلقة',stats.pending],['in_progress','جارية',stats.in_progress],['completed','مكتملة',stats.completed]].map(([k,l,n]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 14px', background: filter === k ? '#0f4d3a' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l} ({n})</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? <EmptyState icon="🔧" title="لا توجد مهام صيانة" actionLabel="+ إضافة" onAction={openAdd} /> : filtered.map(m => {
          const t = TYPES[m.type] || TYPES.routine;
          const s = STATUS[m.status] || STATUS.pending;
          return (
            <div key={m.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{t.icon} {m.title}</div>
                  {m.description && <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{m.description}</div>}
                </div>
                <span style={{ background: `${s.color}20`, color: s.color, padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900, height: 'fit-content', marginRight: 8 }}>{s.icon} {s.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 10.5, color: '#64748b', marginBottom: 8, flexWrap: 'wrap' }}>
                {m.scheduled_date && <span>📅 {new Date(m.scheduled_date).toLocaleDateString('ar-EG')}</span>}
                {Number(m.cost) > 0 && <span>💰 {Number(m.cost).toLocaleString()} SYP</span>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {m.status === 'pending' && <button onClick={() => changeStatus(m, 'in_progress')} style={{ flex: 1, minWidth: 80, padding: 8, background: 'rgba(59,130,246,.15)', color: '#3b82f6', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>⚙️ بدء</button>}
                {m.status === 'in_progress' && <button onClick={() => changeStatus(m, 'completed')} style={{ flex: 1, minWidth: 80, padding: 8, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✓ إكمال</button>}
                <button onClick={() => openEdit(m)} style={{ flex: 1, minWidth: 60, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️</button>
                <button onClick={() => del(m)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{editing ? 'تعديل مهمة' : 'مهمة جديدة'}</h3>
            <input type="text" placeholder="العنوان *" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <textarea placeholder="الوصف" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            <select value={form.type || 'routine'} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <select value={form.status || 'pending'} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#334155', marginBottom: 4 }}>التاريخ المجدول</label>
                <input type="date" value={form.scheduled_date || ''} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#334155', marginBottom: 4 }}>التكلفة</label>
                <input type="number" value={form.cost || ''} onChange={(e) => setForm({ ...form, cost: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
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
