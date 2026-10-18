'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function CouponsPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isSectionAdmin, dataOwnerName } = useCurrentUser();
  const { success, error: toastError } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (!isOwner && !isSectionAdmin) { router.replace('/merchant'); return; }
    load();
  }, [user, userLoading, isOwner, isSectionAdmin]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      let q = supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (!isSectionAdmin) q = q.eq('entity_name', dataOwnerName);
      const { data, error } = await q;
      if (error) throw error;
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) { 
      // الجدول قد لا يكون موجود
      if (e.code === '42P01') {
        toastError('جدول الكوبونات غير موجود — شغّل SQL');
      } else { toastError('تعذّر التحميل'); }
    }
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ code: '', discount_type: 'percent', discount_value: 10, min_order: 0, max_uses: 100, valid_until: '', is_active: true });
    setModal(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({ ...c, valid_until: c.valid_until ? c.valid_until.slice(0, 10) : '' });
    setModal(true);
  }

  async function save() {
    if (!form.code?.trim()) { toastError('كود الخصم مطلوب'); return; }
    if (!form.discount_value || form.discount_value <= 0) { toastError('قيمة الخصم مطلوبة'); return; }
    
    setSaving(true);
    try {
      const payload = {
        entity_name: dataOwnerName,
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order: Number(form.min_order) || 0,
        max_uses: Number(form.max_uses) || 100,
        valid_until: form.valid_until || null,
        is_active: form.is_active !== false,
        updated_at: new Date().toISOString(),
      };
      
      let err;
      if (editing) {
        ({ error: err } = await supabase.from('coupons').update(payload).eq('id', editing.id));
      } else {
        payload.created_at = new Date().toISOString();
        ({ error: err } = await supabase.from('coupons').insert(payload));
      }
      if (err) throw err;
      success(editing ? '✅ تم التعديل' : '✅ تم الإضافة');
      setModal(false);
      load();
    } catch (e) { toastError('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(c) {
    if (!confirm(`حذف الكوبون "${c.code}"؟`)) return;
    try {
      await supabase.from('coupons').delete().eq('id', c.id);
      success('✅ تم الحذف');
      setCoupons(prev => prev.filter(x => x.id !== c.id));
    } catch (e) { toastError('تعذّر: ' + e.message); }
  }

  async function toggle(c) {
    try {
      await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id);
      setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
    } catch (e) { toastError('تعذّر'); }
  }

  if (userLoading || loading) {
    return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>🎟️ الكوبونات</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{coupons.length} كوبون</div>
        </div>
        <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
      </div>

      <div style={{ padding: 16 }}>
        {coupons.length === 0 ? (
          <EmptyState icon="🎟️" title="لا توجد كوبونات" description="أضف كوبونات خصم لجذب العملاء" actionLabel="+ إنشاء كوبون" onAction={openAdd} />
        ) : (
          coupons.map((c) => {
            const isExpired = c.valid_until && new Date(c.valid_until) < new Date();
            return (
              <div key={c.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 14, marginBottom: 10, opacity: c.is_active && !isExpired ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0f4d3a', fontFamily: 'monospace', letterSpacing: 1 }}>{c.code}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#334155', marginTop: 4 }}>
                      {c.discount_type === 'percent' ? `${c.discount_value}% خصم` : `${c.discount_value} SYP خصم`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(c)} style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', border: 'none', fontSize: 14, cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => toggle(c)} style={{ width: 32, height: 32, borderRadius: 8, background: c.is_active ? 'rgba(16,185,129,.15)' : '#f1f5f9', border: 'none', fontSize: 14, cursor: 'pointer' }}>{c.is_active ? '⏸' : '▶'}</button>
                    <button onClick={() => del(c)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', fontSize: 14, cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b', flexWrap: 'wrap' }}>
                  {c.min_order > 0 && <span>📊 أدنى طلب: {Number(c.min_order).toLocaleString()}</span>}
                  <span>🔢 حد: {c.used_count || 0}/{c.max_uses}</span>
                  {c.valid_until && (
                    <span style={{ color: isExpired ? '#ef4444' : '#64748b' }}>
                      📅 {isExpired ? 'منتهي' : new Date(c.valid_until).toLocaleDateString('ar-EG')}
                    </span>
                  )}
                  {!c.is_active && <span style={{ color: '#ef4444' }}>⏸ معطّل</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: '#cbd5e1', borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20 }}>{editing ? '✏️ تعديل الكوبون' : '➕ كوبون جديد'}</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>الكود *</label>
              <input type="text" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER2026"
                style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 16, fontFamily: 'monospace', fontWeight: 900, textAlign: 'center', letterSpacing: 2, boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>النوع</label>
                <select value={form.discount_type || 'percent'} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                  style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}>
                  <option value="percent">% نسبة</option>
                  <option value="fixed">SYP مبلغ</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>القيمة *</label>
                <input type="number" value={form.discount_value || ''} onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>أدنى طلب</label>
                <input type="number" value={form.min_order || ''} onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                  style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>حد الاستخدام</label>
                <input type="number" value={form.max_uses || ''} onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>صالح حتى</label>
              <input type="date" value={form.valid_until || ''} onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#f0fdf4', borderRadius: 10, cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#065f46' }}>نشط</span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: 14, background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '...' : '✓ حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
