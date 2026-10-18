'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const TYPES = {
  warning: { label: 'تحذير', icon: '⚠️', color: '#f59e0b' },
  fine: { label: 'غرامة', icon: '💰', color: '#ef4444' },
  suspension: { label: 'إيقاف', icon: '⏸️', color: '#dc2626' },
  ban: { label: 'حظر', icon: '🚫', color: '#7f1d1d' },
};

const STATUS = {
  active: { label: 'نشط', color: '#ef4444', icon: '●' },
  expired: { label: 'منتهي', color: '#64748b', icon: '○' },
  revoked: { label: 'ملغى', color: '#10b981', icon: '✓' },
};

export default function AdminPenalties() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
  const [entities, setEntities] = useState([]);
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
    const [p, e] = await Promise.all([
      supabase.from('penalties').select('*').order('created_at', { ascending: false }),
      supabase.from('entities').select('id, display_name, phone'),
    ]);
    setItems(p.data || []);
    setEntities(e.data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ entity_name: '', reason: '', type: 'warning', amount: 0, duration_days: 0, status: 'active', notes: '', expires_at: '' });
    setModal(true);
  }

  function openEdit(p) { setEditing(p); setForm({ ...p, expires_at: p.expires_at ? p.expires_at.slice(0, 10) : '' }); setModal(true); }

  async function save() {
    if (!form.entity_name?.trim()) { tE('اسم المتجر مطلوب'); return; }
    if (!form.reason?.trim()) { tE('السبب مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_name: form.entity_name.trim(),
        reason: form.reason.trim(),
        type: form.type || 'warning',
        amount: Number(form.amount) || 0,
        duration_days: Number(form.duration_days) || 0,
        status: form.status || 'active',
        notes: form.notes?.trim() || null,
        expires_at: form.expires_at || null,
      };
      let err;
      if (editing) ({ error: err } = await supabase.from('penalties').update(payload).eq('id', editing.id));
      else ({ error: err } = await supabase.from('penalties').insert(payload));
      if (err) throw err;
      success(editing ? '✅ تم التعديل' : '✅ تمت الإضافة');
      setModal(false); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(p) {
    if (!confirm('حذف هذه العقوبة؟')) return;
    await supabase.from('penalties').delete().eq('id', p.id);
    success('✅ تم'); load();
  }

  async function revoke(p) {
    if (!confirm('إلغاء هذه العقوبة؟')) return;
    await supabase.from('penalties').update({ status: 'revoked' }).eq('id', p.id);
    success('✅ تم الإلغاء'); load();
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(i => i.status === filter);
  }, [items, filter]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter(i => i.status === 'active').length,
    fines: items.filter(i => i.type === 'fine').reduce((s, i) => s + Number(i.amount || 0), 0),
  }), [items]);

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#dc2626', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>⚠️ العقوبات ({items.length})</div>
        <button onClick={openAdd} style={{ background: '#fff', color: '#dc2626', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ عقوبة</button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f4d3a' }}>{stats.total}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 2 }}>الكل</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#ef4444' }}>{stats.active}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 2 }}>نشطة</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#dc2626' }}>{stats.fines.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 2 }}>غرامات</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all','الكل'],['active','نشطة'],['expired','منتهية'],['revoked','ملغاة']].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 14px', background: filter === k ? '#0f4d3a' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? <EmptyState icon="⚠️" title="لا توجد عقوبات" actionLabel="+ إضافة" onAction={openAdd} /> : filtered.map(p => {
          const t = TYPES[p.type] || TYPES.warning;
          const s = STATUS[p.status] || STATUS.active;
          return (
            <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{t.icon} {p.entity_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{t.label} · {p.reason}</div>
                  {Number(p.amount) > 0 && <div style={{ fontSize: 13, fontWeight: 900, color: '#dc2626' }}>💰 {Number(p.amount).toLocaleString()} SYP</div>}
                </div>
                <span style={{ background: `${s.color}20`, color: s.color, padding: '3px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900, height: 'fit-content', marginRight: 8 }}>{s.icon} {s.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#94a3b8', marginBottom: 8, flexWrap: 'wrap' }}>
                <span>📅 {new Date(p.created_at).toLocaleDateString('ar-EG')}</span>
                {p.expires_at && <span>⏰ ينتهي: {new Date(p.expires_at).toLocaleDateString('ar-EG')}</span>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openEdit(p)} style={{ flex: 1, padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ تعديل</button>
                {p.status === 'active' && <button onClick={() => revoke(p)} style={{ flex: 1, padding: 8, background: 'rgba(16,185,129,.15)', color: '#10b981', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✓ إلغاء العقوبة</button>}
                <button onClick={() => del(p)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{editing ? 'تعديل عقوبة' : 'عقوبة جديدة'}</h3>
            <select value={form.entity_name || ''} onChange={(e) => setForm({ ...form, entity_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
              <option value="">— اختر المتجر —</option>
              {entities.map(e => <option key={e.id} value={e.display_name}>{e.display_name}</option>)}
            </select>
            <input type="text" placeholder="سبب العقوبة *" value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <select value={form.type || 'warning'} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            {form.type === 'fine' && <input type="number" placeholder="مبلغ الغرامة" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />}
            {(form.type === 'suspension' || form.type === 'ban') && <input type="number" placeholder="المدة بالأيام (0 = دائم)" value={form.duration_days || ''} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />}
            <input type="date" value={form.expires_at || ''} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <textarea placeholder="ملاحظات" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
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
