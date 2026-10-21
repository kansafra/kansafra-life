'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function AdminDashboard() {
  const router = useRouter();
  const { success } = useToast();
  
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, entities: 0, customers: 0, products: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    // ١. التحقق من صلاحيات الأدمن
    const storedAdmin = JSON.parse(localStorage.getItem('sanad_admin') || 'null');
    if (!storedAdmin) {
      router.replace('/admin/login');
      return;
    }
    setAdmin(storedAdmin);
    loadStats();

    // ٢. التحديث اللحظي
    const channel = supabase
      .channel('admin-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        success('🔔 طلب جديد وصل للمنصة!');
        loadStats();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [router, success]);

  async function loadStats() {
    if (!supabase) return;
    try {
      const [ordersRes, entitiesRes, customersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('entities').select('id', { count: 'exact', head: true }),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
      ]);

      const allOrders = ordersRes.data || [];
      
      // حساب الإحصائيات
      const validOrders = allOrders.filter(o => o.status !== 'cancelled');
      const revenue = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const pending = allOrders.filter(o => ['new', 'pending', 'confirmed', 'preparing'].includes(o.status)).length;

      setStats({
        revenue,
        orders: allOrders.length,
        entities: entitiesRes.count || 0,
        customers: customersRes.count || 0,
        products: productsRes.count || 0,
        pending
      });

      // آخر ٥ طلبات
      setRecentOrders(allOrders.slice(0, 5));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('sanad_admin');
    router.replace('/admin/login');
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳ جارٍ التحميل...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '24px 20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#38bdf8', letterSpacing: 2, marginBottom: 4 }}>ADMIN PANEL</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>مرحباً، {admin?.username || 'المدير'}</h1>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>لوحة إدارة منصة سند</div>
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>تسجيل الخروج</button>
        </div>

        {/* Revenue Card */}
        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 700, marginBottom: 6 }}>إجمالي إيرادات المنصة</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#38bdf8' }}>{stats.revenue.toLocaleString()} <span style={{ fontSize: 14 }}>SYP</span></div>
          </div>
          <div style={{ fontSize: 40 }}>📊</div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        
        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
          <KpiCard icon="🏪" label="المتاجر" value={stats.entities} color="#0f4d3a" href="/admin/entities" />
          <KpiCard icon="👥" label="العملاء" value={stats.customers} color="#3b82f6" href="/admin/users" />
          <KpiCard icon="📦" label="المنتجات" value={stats.products} color="#8b5cf6" href="/admin/categories" />
          <KpiCard icon="🛒" label="الطلبات المعلقة" value={stats.pending} color="#f59e0b" href="/admin/reports" />
        </div>

        {/* Quick Links */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>⚡ إدارة سريعة</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <QuickLink href="/admin/manage" icon="🗂️" label="إدارة الجداول" />
            <QuickLink href="/admin/reviews" icon="⭐" label="التقييمات" />
            <QuickLink href="/admin/moderation" icon="🛡️" label="المراقبة" />
            <QuickLink href="/admin/announcements" icon="📢" label="الإعلانات" />
            <QuickLink href="/admin/support" icon="💬" label="الدعم" />
            <QuickLink href="/admin/subscriptions" icon="💎" label="الاشتراكات" />
            <QuickLink href="/admin/sos" icon="🚨" label="الطوارئ" />
            <QuickLink href="/admin/maintenance" icon="🔧" label="الصيانة" />
            <QuickLink href="/admin/cleanup" icon="🧹" label="تنظيف المتاجر" />
            <QuickLink href="/admin/backup" icon="💾" label="النسخ الاحتياطي" />
            <QuickLink href="/admin/currency" icon="💱" label="العملات" />
            <QuickLink href="/admin/geography" icon="🗺️" label="الجغرافيا" />
            <QuickLink href="/admin/settings" icon="⚙️" label="الإعدادات" />
            <QuickLink href="/admin/audit" icon="📜" label="سجل الأحداث" />
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>🛒 آخر الطلبات على المنصة</h2>
            <Link href="/admin/reports" style={{ fontSize: 12, fontWeight: 900, color: '#0f4d3a', textDecoration: 'none' }}>التقارير ←</Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13, border: '1px solid #e2e8f0' }}>لا توجد طلبات بعد</div>
          ) : (
            recentOrders.map(order => (
              <div key={order.id} style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>#{order.order_code}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{order.provider_name} ← {order.customer_name}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f4d3a' }}>{Number(order.total || 0).toLocaleString()} {order.currency}</div>
                  <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 800, marginTop: 2 }}>● {order.status}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color, href }) {
  return (
    <Link href={href} style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e2e8f0', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22 }}>{icon}</div>
        <div style={{ fontSize: 10, color: '#94a3b8' }}>←</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </Link>
  );
}

function QuickLink({ href, icon, label }) {
  return (
    <Link href={href} style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #e2e8f0', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 900, color: '#1e293b' }}>{label}</div>
    </Link>
  );
}
