'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function DeliveryPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isSectionAdmin, hasPermission, dataOwnerName } = useCurrentUser();
  const { success, error: toastError } = useToast();
  const [orders, setOrders] = useState([]);
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
      let q = supabase.from('orders').select('*').eq('status', 'delivering').order('created_at', { ascending: true });
      if (!isSectionAdmin) q = q.eq('provider_name', dataOwnerName);
      const { data, error } = await q;
      if (error) throw error;
      setOrders(data || []);
    } catch (e) { toastError('تعذّر التحميل'); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.trim().toLowerCase();
    return orders.filter(o =>
      (o.order_code || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_phone || '').includes(q)
    );
  }, [orders, search]);

  async function markDelivered(id) {
    if (!confirm('تأكيد استلام الطلب؟ سيتم تحويله إلى "مكتمل".')) return;
    try {
      const { error } = await supabase.from('orders').update({ status: 'done' }).eq('id', id);
      if (error) throw error;
      success('✅ تم تأكيد التسليم بنجاح');
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (e) { toastError('تعذّر التحديث'); }
  }

  function callCustomer(phone) {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  }

  function whatsappCustomer(order) {
    if (!order.customer_phone) return;
    const clean = String(order.customer_phone).replace(/\D/g, '');
    const phone = clean.startsWith('0') ? '963' + clean.slice(1) : clean;
    const msg = `مرحباً ${order.customer_name}، طلبك #${order.order_code} في الطريق إليك الآن. يرجى تجهيز المبلغ (${Number(order.total).toLocaleString()} ${order.currency || 'SYP'}).`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  if (!userLoading && user && !isOwner && !isSectionAdmin && !hasPermission('orders')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>ليس لديك صلاحية</div>
          <Link href="/merchant" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 800 }}>← العودة</Link>
        </div>
      </div>
    );
  }

  if (userLoading || (user && loading)) {
    return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🚚 قيد التوصيل</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 }}>{orders.length} طلب</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث برقم الطلب / العميل..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="🚚" title="لا توجد طلبات قيد التوصيل" description="ستظهر هنا الطلبات التي قمت بتغيير حالتها إلى (قيد التوصيل)" actionLabel="← الطلبات" actionHref="/merchant/orders" />
        ) : filtered.map((o) => (
          <div key={o.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'monospace', color: '#0f172a', marginBottom: 4 }}>#{o.order_code}</div>
                <div style={{ fontSize: 12, color: '#334155', fontWeight: 800 }}>👤 {o.customer_name}</div>
                {o.customer_address && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📍 {o.customer_address}</div>}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0f4d3a' }}>{Number(o.total || 0).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{o.currency || 'SYP'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button onClick={() => callCustomer(o.customer_phone)} style={{ flex: 1, padding: 10, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📞 اتصال</button>
              <button onClick={() => whatsappCustomer(o)} style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,.1)', color: '#059669', border: '1px solid rgba(37,211,102,.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📱 واتساب</button>
            </div>

            <button onClick={() => markDelivered(o.id)} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(16,185,129,.2)' }}>
              ✓ تأكيد التسليم
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
