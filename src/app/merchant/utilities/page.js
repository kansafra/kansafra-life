'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function UtilitiesPage() {
  const router = useRouter();
  const { user, loading: uL, isOwner, isSectionAdmin, hasPermission, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    if (!isOwner && !isSectionAdmin && !hasPermission('finance')) { router.replace('/merchant'); return; }
    load();
  }, [user, uL, isOwner, isSectionAdmin]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    let q = supabase.from('utilities').select('*').order('due_date', { ascending: true });
    if (!isSectionAdmin) q = q.eq('entity_name', dataOwnerName);
    const { data } = await q;
    setItems(data || []);
    setLoading(false);
  }

  async function save() {
    if (!form.name?.trim()) { tE('الاسم مطلوب'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('utilities').insert({
        entity_name: dataOwnerName, name: form.name.trim(),
        provider: form.provider?.trim() || null, account_number: form.account_number?.trim() || null,
        amount: Number(form.amount) || 0, due_date: form.due_date || null,
        is_paid: form.is_paid === true, notes: form.notes?.trim() || null,
      });
      if (error) throw error;
      success('✅ تم'); setModal(false); setForm({}); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function togglePaid(it) {
    await supabase.from('utilities').update({ is_paid: !it.is_paid }).eq('id', it.id);
    load();
  }

  async function del(c) {
    if (!confirm('حذف؟')) return;
    await supabase.from('utilities').delete().eq('id', c.id);
    success('تم'); load();
  }

  const stats = useMemo(() => {
    const unpaid = items.filter(i => !i.is_paid);
    const paid = items.filter(i => i.is_paid);
    return {
      unpaid: unpaid.length,
      paid: paid.length,
      unpaidAmount: unpaid.reduce((s, i) => s + Number(i.amount || 0), 0),
    };
  }, [items]);

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🔌 المرافق ({items.length})</div>
        <button onClick={() => { setForm({}); setModal(true); }} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 6 }}>غير مدفوعة</div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>{stats.unpaidAmount.toLocaleString()} <span style={{ fontSize: 12, opacity: 0.8 }}>SYP</span></div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 8 }}>{stats.unpaid} فاتورة معلقة · {stats.paid} مدفوعة</div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {items.length === 0 ? <EmptyState icon="🔌" title="لا توجد فواتير" actionLabel="+ إضافة" onAction={() => { setForm({}); setModal(true); }} /> : items.map(it => {
          const isOverdue = it.due_date && new Date(it.due_date) < new Date() && !it.is_paid;
          return (
            <div key={it.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${isOverdue ? '#ef4444' : '#e5e7eb'}`, opacity: it.is_paid ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{it.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{it.provider || '—'}</div>
                  {it.due_date && <div style={{ fontSize: 10, color: isOverdue ? '#ef4444' : '#94a3b8', marginTop: 4, fontWeight: isOverdue ? 900 : 400 }}>📅 {new Date(it.due_date).toLocaleDateString('ar-EG')} {isOverdue ? '⚠️ متأخرة' : ''}</div>}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: it.is_paid ? '#10b981' : '#f59e0b' }}>{Number(it.amount || 0).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => togglePaid(it)} style={{ flex: 1, padding: 8, background: it.is_paid ? 'rgba(100,116,139,.1)' : 'rgba(16,185,129,.15)', color: it.is_paid ? '#64748b' : '#10b981', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{it.is_paid ? '↩️ إلغاء الدفع' : '✓ تم الدفع'}</button>
                <button onClick={() => del(it)} style={{ padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>فاتورة جديدة</h3>
            <input type="text" placeholder="الاسم * (مثال: كهرباء)" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="text" placeholder="الجهة (مثال: شركة الكهرباء)" value={form.provider || ''} onChange={(e) => setForm({ ...form, provider: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="text" placeholder="رقم الحساب" value={form.account_number || ''} onChange={(e) => setForm({ ...form, account_number: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="number" placeholder="المبلغ" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="date" value={form.due_date || ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' }} />
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
