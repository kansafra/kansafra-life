'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function CustomersPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isSectionAdmin, hasPermission, dataOwnerName } = useCurrentUser();
  const { success, error: toastError } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      // جلب العملاء
      let cq = supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (!isSectionAdmin) cq = cq.eq('entity_name', dataOwnerName);
      
      // جلب الطلبات لحساب الإجمالي والديون
      let oq = supabase.from('orders').select('customer_phone, total, status');
      if (!isSectionAdmin) oq = oq.eq('provider_name', dataOwnerName);

      let dq = supabase.from('debts').select('customer_phone, amount, paid');
      if (!isSectionAdmin) dq = dq.eq('entity_name', dataOwnerName);

      const [cRes, oRes, dRes] = await Promise.all([cq, oq, dq]);
      
      const ordersMap = {};
      (oRes.data || []).forEach(o => {
        if (o.status === 'done') {
          ordersMap[o.customer_phone] = (ordersMap[o.customer_phone] || 0) + Number(o.total || 0);
        }
      });

      const debtsMap = {};
      (dRes.data || []).forEach(d => {
        debtsMap[d.customer_phone] = (debtsMap[d.customer_phone] || 0) + (Number(d.amount || 0) - Number(d.paid || 0));
      });

      const list = (cRes.data || []).map(c => ({
        ...c,
        total_spent: ordersMap[c.phone] || 0,
        total_debts: debtsMap[c.phone] || 0,
      }));

      setCustomers(list);
    } catch (e) { toastError('تعذّر التحميل'); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.trim().toLowerCase();
    return customers.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  }, [customers, search]);

  if (userLoading || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>👥 العملاء</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 }}>{filtered.length} عميل</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث بالاسم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="👥" title="لا يوجد عملاء" description="العملاء الذين يشترون منك سيظهرون هنا" />
        ) : filtered.map(c => (
          <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900 }}>
                {(c.name || '?').charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{c.name || 'عميل'}</div>
                <div style={{ fontSize: 12, color: '#64748b', direction: 'ltr', textAlign: 'right', marginTop: 2 }}>{c.phone}</div>
              </div>
              <a href={`tel:${c.phone}`} style={{ padding: 8, background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>📞</a>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>إجمالي الشراء</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#10b981' }}>{c.total_spent.toLocaleString()} SYP</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>الديون المتبقية</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: c.total_debts > 0 ? '#ef4444' : '#64748b' }}>{c.total_debts.toLocaleString()} SYP</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
