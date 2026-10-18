'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function DebtsPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isSectionAdmin, hasPermission, dataOwnerName } = useCurrentUser();
  const { success, error: toastError } = useToast();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      let q = supabase.from('debts').select('*').order('created_at', { ascending: false });
      if (!isSectionAdmin) q = q.eq('entity_name', dataOwnerName);
      const { data, error } = await q;
      if (error) throw error;
      setDebts(data || []);
    } catch (e) { toastError('تعذّر التحميل'); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return debts;
    const q = search.trim().toLowerCase();
    return debts.filter(d =>
      (d.customer_name || '').toLowerCase().includes(q) ||
      (d.customer_phone || '').includes(q)
    );
  }, [debts, search]);

  const stats = useMemo(() => {
    let total = 0, collected = 0, remaining = 0;
    debts.forEach(d => {
      total += Number(d.amount || 0);
      collected += Number(d.paid || 0);
      remaining += (Number(d.amount || 0) - Number(d.paid || 0));
    });
    return { total, collected, remaining };
  }, [debts]);

  function openAdd() {
    setForm({ customer_name: '', customer_phone: '', amount: '', description: '' });
    setModal('add');
  }

  function openPay(debt) {
    const rem = Number(debt.amount) - Number(debt.paid);
    setForm({ ...debt, pay_amount: rem });
    setModal('pay');
  }

  async function saveDebt() {
    if (!form.customer_name?.trim()) { toastError('اسم العميل مطلوب'); return; }
    if (!form.customer_phone?.trim()) { toastError('رقم الهاتف مطلوب'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toastError('المبلغ مطلوب'); return; }
    
    setSaving(true);
    try {
      const { error } = await supabase.from('debts').insert({
        entity_name: dataOwnerName,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        amount: Number(form.amount),
        paid: 0,
        description: form.description?.trim() || null,
      });
      if (error) throw error;
      success('✅ تمت إضافة الدين');
      setModal(null); load();
    } catch (e) { toastError('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function payDebt() {
    if (!form.pay_amount || Number(form.pay_amount) <= 0) { toastError('المبلغ غير صحيح'); return; }
    setSaving(true);
    try {
      const newPaid = Number(form.paid) + Number(form.pay_amount);
      const { error } = await supabase.from('debts').update({ paid: newPaid }).eq('id', form.id);
      if (error) throw error;
      success('✅ تم تسجيل الدفعة');
      setModal(null); load();
    } catch (e) { toastError('تعذّر: ' + e.message); }
    setSaving(false);
  }

  if (userLoading || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>💰 دفتر الديون</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 }}>{debts.length} سجل</div>
        </div>
        <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ دين</button>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>إجمالي</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{stats.total.toLocaleString()}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>محصل</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>{stats.collected.toLocaleString()}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius: 12, padding: 12, textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 10, opacity: 0.9, fontWeight: 700, marginBottom: 4 }}>متبقي</div>
          <div style={{ fontSize: 14, fontWeight: 900 }}>{stats.remaining.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <input type="text" placeholder="🔍 ابحث بالاسم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="💰" title="لا توجد ديون" description="سجل ديون عملائك لتتمكن من متابعتها" actionLabel="+ دين جديد" onAction={openAdd} />
        ) : filtered.map(d => {
          const remaining = Number(d.amount) - Number(d.paid);
          const isPaid = remaining <= 0;
          return (
            <div key={d.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', opacity: isPaid ? 0.7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{d.customer_name}</div>
                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{d.customer_phone}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: isPaid ? '#10b981' : '#ef4444' }}>
                    {remaining > 0 ? remaining.toLocaleString() : 'مسدد'}
                  </div>
                  {!isPaid && <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>من أصل {Number(d.amount).toLocaleString()}</div>}
                </div>
              </div>
              {d.description && <div style={{ fontSize: 11.5, color: '#64748b', background: '#f8fafc', padding: 8, borderRadius: 6, marginBottom: 10 }}>{d.description}</div>}
              
              {!isPaid && (
                <button onClick={() => openPay(d)} style={{ width: '100%', padding: 10, background: 'rgba(16,185,129,.1)', color: '#10b981', border: '1px solid rgba(16,185,129,.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                  💵 تسجيل دفعة
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{modal === 'add' ? 'دين جديد' : 'تسجيل دفعة'}</h3>
            
            {modal === 'add' ? (
              <>
                <input type="text" placeholder="اسم العميل *" value={form.customer_name || ''} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                <input type="tel" placeholder="رقم الهاتف *" value={form.customer_phone || ''} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }} />
                <input type="number" placeholder="المبلغ *" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                <textarea placeholder="الوصف" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
                <button onClick={saveDebt} disabled={saving} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: 12, fontWeight: 900, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ حفظ'}</button>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>المتبقي على {form.customer_name}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#ef4444' }}>{Number(form.amount) - Number(form.paid)}</div>
                </div>
                <input type="number" placeholder="المبلغ المدفوع *" value={form.pay_amount || ''} onChange={(e) => setForm({ ...form, pay_amount: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'center', fontWeight: 900 }} />
                <button onClick={payDebt} disabled={saving} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: 12, fontWeight: 900, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ تسجيل الدفعة'}</button>
              </>
            )}
            <button onClick={() => setModal(null)} style={{ width: '100%', padding: 12, background: '#f1f5f9', color: '#334155', borderRadius: 12, fontWeight: 800, border: 'none', marginTop: 10, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
