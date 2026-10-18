'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { getEntityConfig } from '@/lib/entityConfig';
import { SkeletonList } from '@/components/Skeleton';

export default function MerchantDashboard() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, isEmployee, isSectionAdmin, hasPermission, dataOwnerName, sectionType } = useCurrentUser();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      let oq = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
      let pq = supabase.from('products').select('id', { count: 'exact', head: true });
      let cq = supabase.from('customers').select('id', { count: 'exact', head: true });
      let dq = supabase.from('debts').select('amount, paid');
      
      if (!isSectionAdmin) {
        oq = oq.eq('provider_name', dataOwnerName);
        pq = pq.eq('provider_name', dataOwnerName);
        cq = cq.eq('entity_name', dataOwnerName);
        dq = dq.eq('entity_name', dataOwnerName);
      }
      
      const [o, p, c, d, s] = await Promise.all([
        oq, pq, cq, dq,
        supabase.from('entity_subscriptions').select('*').eq('entity_id', user?.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);
      
      setOrders(o.data || []);
      setProducts({ count: p.count || 0 });
      setCustomers({ count: c.count || 0 });
      setDebts(d.data || []);
      setSub(s.data || null);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const stats = useMemo(() => {
    const done = orders.filter(o => o.status === 'done');
    const newOrders = orders.filter(o => o.status === 'new').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    const delivering = orders.filter(o => o.status === 'delivering').length;
    const revenue = done.reduce((s, o) => s + Number(o.total || 0), 0);
    const totalDebts = debts.reduce((s, d) => s + (Number(d.amount || 0) - Number(d.paid || 0)), 0);
    return { revenue, newOrders, preparing, delivering, pending: newOrders + preparing + delivering, totalDebts };
  }, [orders, debts]);

  const config = getEntityConfig(sectionType || user?.entity_type || 'merchant');
  const recentOrders = orders.slice(0, 5);

  if (userLoading || (user && loading)) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16 }}>
        <div style={{ background: '#0f4d3a', borderRadius: 20, padding: 24, marginBottom: 16, height: 140 }} />
        <SkeletonList count={3} />
      </div>
    );
  }
  if (!user) return null;

  const daysLeft = sub?.expires_at ? Math.ceil((new Date(sub.expires_at) - new Date()) / 86400000) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft < 30 && daysLeft > 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '24px 20px', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700, marginBottom: 4 }}>
              {isEmployee ? `👤 ${user.full_name} · ${user.role === 'manager' ? 'مدير' : user.role === 'sales' ? 'مبيعات' : 'موظف'}` : isSectionAdmin ? '🏢 مدير قسم' : '👑 مالك'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>{dataOwnerName || user.display_name}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{config.label} · {config.tagline}</div>
          </div>
          <div style={{ fontSize: 48 }}>{config.icon}</div>
        </div>

        {/* Revenue */}
        <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 16, padding: 16, backdropFilter: 'blur(10px)' }}>
          <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>إجمالي الإيرادات</div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>{stats.revenue.toLocaleString()} <span style={{ fontSize: 13, opacity: 0.8 }}>SYP</span></div>
        </div>
      </div>

      {/* Subscription Warning */}
      {isExpiringSoon && (
        <div style={{ margin: '16px 16px 0', background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.4)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#92400e' }}>اشتراكك ينتهي بعد {daysLeft} يوم</div>
            <Link href="/merchant/subscription" style={{ fontSize: 11, color: '#92400e', fontWeight: 700 }}>جدد الآن ←</Link>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <Link href="/merchant/orders" style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 22 }}>🛍️</div>
            {stats.pending > 0 && <span style={{ background: 'rgba(245,158,11,.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{stats.pending} جديد</span>}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{orders.length}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>الطلبات</div>
        </Link>

        <Link href="/merchant/products" style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>📦</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{products.count}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>المنتجات</div>
        </Link>

        <Link href="/merchant/customers" style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>👥</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{customers.count}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>العملاء</div>
        </Link>

        <Link href="/merchant/debts" style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: stats.totalDebts > 0 ? '#ef4444' : '#10b981' }}>{stats.totalDebts.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>الديون</div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>⚡ إجراءات سريعة</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {config.quickActions?.slice(0, 9).map((a) => (
            <Link key={a.href} href={a.href} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
              <div style={{ fontSize: 22 }}>{a.icon}</div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155', lineHeight: 1.2 }}>{a.title}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>🛍️ آخر الطلبات</div>
            <Link href="/merchant/orders" style={{ fontSize: 11, color: '#0f4d3a', fontWeight: 900, textDecoration: 'none' }}>عرض الكل ←</Link>
          </div>
          {recentOrders.map((o) => {
            const statusMap = {
              new: { label: 'جديد', color: '#3b82f6' },
              preparing: { label: 'تحضير', color: '#f59e0b' },
              delivering: { label: 'توصيل', color: '#8b5cf6' },
              done: { label: 'مكتمل', color: '#10b981' },
              cancelled: { label: 'ملغي', color: '#ef4444' },
            };
            const s = statusMap[o.status] || statusMap.new;
            return (
              <Link key={o.id} href="/merchant/orders" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, fontFamily: 'monospace', color: '#0f172a' }}>#{o.order_code}</div>
                  <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>👤 {o.customer_name}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f4d3a' }}>{Number(o.total || 0).toLocaleString()}</div>
                  <div style={{ fontSize: 9.5, color: s.color, fontWeight: 800, marginTop: 2 }}>● {s.label}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Subscription Footer */}
      {sub && (
        <div style={{ padding: '0 16px' }}>
          <Link href="/merchant/subscription" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #0f4d3a, #075640)', borderRadius: 14, padding: 14, textDecoration: 'none', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 24 }}>💎</div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>اشتراكك الحالي</div>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{sub.plan_name || 'Free'}</div>
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              {daysLeft !== null && (
                <>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>ينتهي بعد</div>
                  <div style={{ fontSize: 13, fontWeight: 900 }}>{daysLeft > 0 ? `${daysLeft} يوم` : 'منتهي'}</div>
                </>
              )}
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
