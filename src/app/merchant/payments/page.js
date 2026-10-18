'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function PaymentsPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isSectionAdmin, hasPermission, dataOwnerName } = useCurrentUser();
  const { error: toastError } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      let q = supabase.from('orders').select('*').eq('status', 'done').order('created_at', { ascending: false });
      if (!isSectionAdmin) q = q.eq('provider_name', dataOwnerName);
      const { data, error } = await q;
      if (error) throw error;
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) { toastError('تعذّر التحميل'); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (period === 'all') return orders;
    const now = new Date();
    const cutoff = new Date();
    if (period === 'today') cutoff.setHours(0,0,0,0);
    else if (period === 'week') cutoff.setDate(now.getDate() - 7);
    else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
    return orders.filter(o => new Date(o.created_at) >= cutoff);
  }, [orders, period]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s, o) => s + Number(o.total || 0), 0);
    return { total, count: filtered.length, avg: filtered.length ? total / filtered.length : 0 };
  }, [filtered]);

  if (!userLoading && user && !isOwner && !isSectionAdmin && !hasPermission('finance')) {
    return <div style={{ padding: 60, textAlign: 'center' }}>🔒 ليس لديك صلاحية</div>;
  }
  if (userLoading || (user && loading)) {
    return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;
  }
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>💳 المدفوعات</div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 16, padding: 20, color: '#fff', marginBottom: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 6 }}>إجمالي المدفوعات</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{stats.total.toLocaleString()} SYP</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 8 }}>{stats.count} عملية · متوسط {Math.round(stats.avg).toLocaleString()}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12 }}>
          {[['all','الكل'],['today','اليوم'],['week','7 أيام'],['month','30 يوم']].map(([k,l]) => (
            <button key={k} onClick={() => setPeriod(k)} style={{
              padding: '8px 14px', background: period === k ? '#0f4d3a' : '#fff', color: period === k ? '#fff' : '#64748b',
              border: `1px solid ${period === k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="💳" title="لا توجد مدفوعات" />
        ) : filtered.map((o) => (
          <div key={o.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 900 }}>#{o.order_code}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>+{Number(o.total || 0).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
              <span>👤 {o.customer_name}</span>
              <span>💳 {o.payment_method || '—'}</span>
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>📅 {new Date(o.created_at).toLocaleDateString('ar-EG')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
