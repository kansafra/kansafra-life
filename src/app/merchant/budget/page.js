'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function BudgetPage() {
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
    let q = supabase.from('budgets').select('*').order('date', { ascending: false });
    if (!isSectionAdmin) q = q.eq('entity_name', dataOwnerName);
    const { data } = await q;
    setItems(data || []);
    setLoading(false);
  }

  async function save() {
    if (!form.title?.trim()) { tE('العنوان مطلوب'); return; }
    if (!form.amount || Number(form.amount) <= 0) { tE('المبلغ مطلوب'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('budgets').insert({
        entity_name: dataOwnerName, title: form.title.trim(), amount: Number(form.amount),
        type: form.type || 'expense', category: form.category || null,
        notes: form.notes?.trim() || null, date: form.date || new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      success('✅ تم'); setModal(false); setForm({}); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(c) {
    if (!confirm('حذف؟')) return;
    await supabase.from('budgets').delete().eq('id', c.id);
    success('تم'); load();
  }

  const stats = useMemo(() => {
    const income = items.filter(i => i.type === 'income').reduce((s, i) => s + Number(i.amount || 0), 0);
    const expense = items.filter(i => i.type === 'expense').reduce((s, i) => s + Number(i.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [items]);

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>💵 الميزانية</div>
        <button onClick={() => { setForm({}); setModal(true); }} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ background: stats.balance >= 0 ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 6 }}>الرصيد الحالي</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{stats.balance.toLocaleString()} <span style={{ fontSize: 13, opacity: 0.8 }}>SYP</span></div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 11 }}>
            <div><span style={{ opacity: 0.75 }}>وارد: </span><strong>+{stats.income.toLocaleString()}</strong></div>
            <div><span style={{ opacity: 0.75 }}>صادر: </span><strong>-{stats.expense.toLocaleString()}</strong></div>
          </div>
        </div>
      </div>
      <div style={{ padding: '0 16px' }}>
        {items.length === 0 ? <EmptyState icon="💵" title="لا توجد حركات" actionLabel="+ إضافة" onAction={() => { setForm({}); setModal(true); }} /> : items.map(it => {
          const isIncome = it.type === 'income';
          return (
            <div key={it.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', display: 'flex', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: isIncome ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)', color: isIncome ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{isIncome ? '📥' : '📤'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>{it.title}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{it.category || (isIncome ? 'وارد' : 'صادر')} · {new Date(it.date).toLocaleDateString('ar-EG')}</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: isIncome ? '#10b981' : '#ef4444' }}>{isIncome ? '+' : '-'}{Number(it.amount).toLocaleString()}</div>
                <button onClick={() => del(it)} style={{ marginTop: 4, padding: '2px 8px', background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>حركة جديدة</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setForm({ ...form, type: 'income' })} style={{ flex: 1, padding: 12, background: form.type === 'income' ? 'linear-gradient(135deg,#10b981,#059669)' : '#f1f5f9', color: form.type === 'income' ? '#fff' : '#64748b', border: 'none', borderRadius: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📥 وارد</button>
              <button onClick={() => setForm({ ...form, type: 'expense' })} style={{ flex: 1, padding: 12, background: form.type === 'expense' || !form.type ? 'linear-gradient(135deg,#ef4444,#dc2626)' : '#f1f5f9', color: form.type === 'expense' || !form.type ? '#fff' : '#64748b', border: 'none', borderRadius: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📤 صادر</button>
            </div>
            <input type="text" placeholder="العنوان *" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="number" placeholder="المبلغ *" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="text" placeholder="التصنيف" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <textarea placeholder="ملاحظات" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
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
