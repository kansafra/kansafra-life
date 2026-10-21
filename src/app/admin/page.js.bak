'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    entities: 0, pending_entities: 0, products: 0, orders: 0, revenue: 0,
    users: 0, open_tickets: 0, sos: 0
  });

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    setAdmin(stored);
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [
        eCount, pCount, prodCount, oCount, uCount, tCount, sosCount, revenueRes
      ] = await Promise.all([
        supabase.from('entities').select('*', { count: 'exact', head: true }),
        supabase.from('entities').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('sos_alerts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('total').eq('status', 'done')
      ]);

      const revenue = (revenueRes.data || []).reduce((s, o) => s + Number(o.total || 0), 0);

      setStats({
        entities: eCount.count || 0,
        pending_entities: pCount.count || 0,
        products: prodCount.count || 0,
        orders: oCount.count || 0,
        revenue,
        users: uCount.count || 0,
        open_tickets: tCount.count || 0,
        sos: sosCount.count || 0,
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function logout() {
    if (!confirm('تسجيل الخروج من لوحة الإدارة؟')) return;
    localStorage.removeItem('sanad_admin');
    router.push('/admin/login');
  }

  const MENU_SECTIONS = [
    {
      title: 'إدارة المنصة',
      links: [
        { href: '/admin/entities', icon: '🏪', label: 'المزودون', badge: stats.pending_entities > 0 ? stats.pending_entities : null, color: '#f59e0b' },
        { href: '/admin/moderation', icon: '🛡️', label: 'المراجعة', badge: null, color: '#3b82f6' },
        { href: '/admin/subscriptions', icon: '💎', label: 'الاشتراكات', badge: null, color: '#10b981' },
        { href: '/admin/plans', icon: '📋', label: 'الباقات', badge: null, color: '#64748b' },
        { href: '/admin/categories', icon: '🗂️', label: 'الأقسام', badge: null, color: '#8b5cf6' },
        { href: '/admin/education', icon: '🎓', label: 'التعليم', badge: null, color: '#7c3aed' },
        { href: '/admin/municipal', icon: '🏢', label: 'البلدية', badge: null, color: '#1e40af' },
        { href: '/admin/charity', icon: '🤝', label: 'الجمعيات', badge: null, color: '#059669' },
        { href: '/admin/sports', icon: '🏆', label: 'الرياضة', badge: null, color: '#ea580c' },
        { href: '/admin/users', icon: '👥', label: 'المستخدمون', badge: null, color: '#06b6d4' },
      ]
    },
    {
      title: 'الدعم والطوارئ',
      links: [
        { href: '/admin/sos', icon: '🚨', label: 'بلاغات SOS', badge: stats.sos > 0 ? stats.sos : null, color: '#ef4444' },
        { href: '/admin/support', icon: '💬', label: 'تذاكر الدعم', badge: stats.open_tickets > 0 ? stats.open_tickets : null, color: '#f59e0b' },
        { href: '/admin/announcements', icon: '📢', label: 'الإعلانات', badge: null, color: '#3b82f6' },
        { href: '/admin/notifications', icon: '🔔', label: 'Push', badge: null, color: '#dc2626' },
        { href: '/admin/emergency-contacts', icon: '☎️', label: 'أرقام الطوارئ', badge: null, color: '#dc2626' },
      ]
    },
    {
      title: 'البيانات والتقارير',
      links: [
        { href: '/admin/analytics', icon: '📊', label: 'التحليلات', badge: null, color: '#10b981' },
        { href: '/admin/reports', icon: '📈', label: 'التقارير', badge: null, color: '#3b82f6' },
        { href: '/admin/backup', icon: '💾', label: 'النسخ الاحتياطي', badge: null, color: '#64748b' },
        { href: '/admin/audit', icon: '📋', label: 'سجل التدقيق', badge: null, color: '#8b5cf6' },
      ]
    },
    {
      title: 'إعدادات المنصة',
      links: [
        { href: '/admin/settings', icon: '⚙️', label: 'إعدادات عامة', badge: null, color: '#64748b' },
        { href: '/admin/accounts', icon: '👤', label: 'حسابات الأدمن', badge: null, color: '#0f4d3a' },
        { href: '/admin/communities', icon: '🏘️', label: 'المجتمعات', badge: null, color: '#06b6d4' },
        { href: '/admin/geography', icon: '🗺️', label: 'الجغرافيا', badge: null, color: '#3b82f6' },
        { href: '/admin/currency', icon: '💱', label: 'العملات', badge: null, color: '#f59e0b' },
        { href: '/admin/azkar', icon: '🕌', label: 'الأذكار', badge: null, color: '#10b981' },
        { href: '/admin/penalties', icon: '⚠️', label: 'العقوبات', badge: null, color: '#ef4444' },
        { href: '/admin/maintenance', icon: '🔧', label: 'الصيانة', badge: null, color: '#64748b' },
      ]
    }
  ];

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px 16px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700, marginBottom: 4 }}>مركز القيادة</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>أهلاً، {admin?.display_name || 'المدير'}</div>
          </div>
          <button onClick={logout} style={{ background: 'rgba(220,38,38,.2)', color: '#fecaca', border: '1px solid rgba(220,38,38,.4)', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>خروج</button>
        </div>

        {/* Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 14, padding: 12, backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 700, marginBottom: 4 }}>إجمالي الإيرادات</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{stats.revenue.toLocaleString()} <span style={{ fontSize: 11, opacity: 0.7 }}>SYP</span></div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 14, padding: 12, backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 700, marginBottom: 4 }}>إجمالي الطلبات</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{stats.orders.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: -20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,.03)' }}>
          <div style={{ fontSize: 18, marginBottom: 4 }}>🏪</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#0f4d3a' }}>{stats.entities}</div>
          <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700 }}>مزود</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,.03)' }}>
          <div style={{ fontSize: 18, marginBottom: 4 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#3b82f6' }}>{stats.products}</div>
          <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700 }}>منتج</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,.03)' }}>
          <div style={{ fontSize: 18, marginBottom: 4 }}>👥</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#8b5cf6' }}>{stats.users}</div>
          <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700 }}>مستخدم</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,.03)' }}>
          <div style={{ fontSize: 18, marginBottom: 4 }}>⏳</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#f59e0b' }}>{stats.pending_entities}</div>
          <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700 }}>طلب موافقة</div>
        </div>
      </div>

      {/* Menu Sections */}
      {MENU_SECTIONS.map((section, idx) => (
        <div key={idx} style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>{section.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {section.links.map(link => (
              <Link key={link.href} href={link.href} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 8px', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', textAlign: 'center' }}>
                {link.badge && (
                  <span style={{ position: 'absolute', top: 6, right: 6, background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 900 }}>{link.badge}</span>
                )}
                <div style={{ fontSize: 22 }}>{link.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#334155', lineHeight: 1.3 }}>{link.label}</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
