'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const STATUS = {
  pending: { label: 'معلّق', color: '#f59e0b', icon: '⏳' },
  completed: { label: 'مكتمل', color: '#10b981', icon: '✅' },
  cancelled: { label: 'ملغي', color: '#ef4444', icon: '❌' },
};

export default function ReferralsPage() {
  const router = useRouter();
  const { user, loading: uL, isOwner, isSectionAdmin, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (uL) return;
    if (!user) { router.replace('/login'); return; }
    if (!isOwner && !isSectionAdmin) { router.replace('/merchant'); return; }
    load();
  }, [user, uL, isOwner, isSectionAdmin]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    let q = supabase.from('referrals').select('*').order('created_at', { ascending: false });
    if (!isSectionAdmin) q = q.eq('entity_name', dataOwnerName);
    const { data } = await q;
    setItems(data || []);
    setLoading(false);
  }

  async function save() {
    if (!form.referrer_name?.trim()) { tE('اسم المحيل مطلوب'); return; }
    if (!form.referred_name?.trim()) { tE('اسم العميل الجديد مطلوب'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('referrals').insert({
        entity_name: dataOwnerName,
        referrer_name: form.referrer_name.trim(),
        referred_name: form.referred_name.trim(),
        referred_phone: form.referred_phone?.trim() || null,
        status: form.status || 'pending',
        reward: Number(form.reward) || 0,
        notes: form.notes?.trim() || null,
      });
      if (error) throw error;
      success('✅ تم'); setModal(false); setForm({}); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function changeStatus(it, newStatus) {
    await supabase.from('referrals').update({ status: newStatus }).eq('id', it.id);
    load();
  }

  async function del(c) {
    if (!confirm('حذف؟')) return;
    await supabase.from('referrals').delete().eq('id', c.id);
    success('تم'); load();
  }

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      completed: items.filter(i => i.status === 'completed').length,
      totalReward: items.filter(i => i.status === 'completed').reduce((s, i) => s + Number(i.reward || 0), 0),
    };
  }, [items]);

  if (uL || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🎁 الإحالات ({stats.total})</div>
        <button onClick={() => { setForm({}); setModal(true); }} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ إحالة</button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', borderRadius: 18, padding: 20, color: '#fff', marginBottom: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 6 }}>إجمالي المكافآت</div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>{stats.totalReward.toLocaleString()} <span style={{ fontSize: 12, opacity: 0.8 }}>SYP</span></div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 8 }}>{stats.completed} مكتمل · {stats.pending} معلق</div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {items.length === 0 ? <EmptyState icon="🎁" title="لا توجد إحالات" description="أضف إحالات لتتبع مكافآت العملاء" actionLabel="+ إضافة" onAction={() => { setForm({}); setModal(true); }} /> : items.map(it => {
          const s = STATUS[it.status] || STATUS.pending;
          return (
            <div key={it.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 900 }}>{it.referrer_name} <span style={{ color: '#94a3b8', fontWeight: 400 }}>←</span> {it.referred_name}</div>
                  {it.referred_phone && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📞 {it.referred_phone}</div>}
                </div>
                <span style={{ background: `${s.color}20`, color: s.color, padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{s.icon} {s.label}</span>
              </div>
              {Number(it.reward) > 0 && <div style={{ fontSize: 12, fontWeight: 900, color: '#8b5cf6', marginBottom: 8 }}>💰 مكافأة: {Number(it.reward).toLocaleString()}</div>}
              <div style={{ display: 'flex', gap: 6 }}>
                {it.status === 'pending' && (
                  <>
                    <button onClick={() => changeStatus(it, 'completed')} style={{ flex: 1, padding: 6, background: 'rgba(16,185,129,.15)', color: '#10b981', border: 'none', borderRadius: 6, fontSize: 10.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✓ إكمال</button>
                    <button onClick={() => changeStatus(it, 'cancelled')} style={{ flex: 1, padding: 6, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 10.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✕ إلغاء</button>
                  </>
                )}
                <button onClick={() => del(it)} style={{ padding: 6, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 10.5, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>إحالة جديدة</h3>
            <input type="text" placeholder="اسم المحيل *" value={form.referrer_name || ''} onChange={(e) => setForm({ ...form, referrer_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="text" placeholder="اسم العميل الجديد *" value={form.referred_name || ''} onChange={(e) => setForm({ ...form, referred_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="tel" placeholder="هاتف العميل الجديد" value={form.referred_phone || ''} onChange={(e) => setForm({ ...form, referred_phone: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="number" placeholder="المكافأة" value={form.reward || ''} onChange={(e) => setForm({ ...form, reward: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
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
