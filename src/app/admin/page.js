'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useT } from '@/lib/useT';

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useT();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({ entities: 0, services: 0, products: 0, orders: 0, sos: 0, categories: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    setAdmin(stored);
    loadStats();
  }, [router]);

  async function loadStats() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [e, s, p, o, sos, c, r] = await Promise.all([
        supabase.from('entities').select('*', { count: 'exact', head: true }),
        supabase.from('services').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('sos_alerts').select('*', { count: 'exact', head: true }),
        supabase.from('service_categories').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        entities: e.count || 0,
        services: s.count || 0,
        products: p.count || 0,
        orders: o.count || 0,
        sos: sos.count || 0,
        categories: c.count || 0,
        reviews: r.count || 0,
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function logout() {
    try { localStorage.removeItem('sanad_admin'); } catch {}
    router.push('/admin/login');
  }

  if (!admin) return <div className="admin-page"><div style={{ padding: 80, textAlign: 'center' }}>جارٍ التحقق...</div></div>;

  const MENU = [
    { icon: '🎛️', title: 'إدارة المحتوى الكامل', desc: 'تحكم بكل جداول النظام', href: '/admin/manage' },
    
    { icon: '🏘️', title: 'إدارة البلدات', desc: 'منصات متعددة المجتمعات', href: '/admin/communities' },
    { icon: '🌳', title: 'الشجرة الجغرافية', desc: 'دولة → محافظة → بلدة → حي', href: '/admin/geography' },
    { icon: '💱', title: 'أسعار العملات', desc: 'تحديث أسعار الصرف اليومية', href: '/admin/currency' },
    { icon: '🏢', title: 'إدارة الكيانات', desc: 'متاجر، عيادات، مدارس', href: '/admin/entities' },
    { icon: '👥', title: 'المستخدمون والصلاحيات', desc: 'المدير، المشرفون', href: '/admin/manage/entities' },
    { icon: '📊', title: 'التقارير', desc: 'مالية وتشغيلية', href: '/admin/reports' },
    { icon: '📝', title: 'سجل التدقيق', desc: 'كل العمليات', href: '/admin/audit' },
    { icon: '🆘', title: 'إدارة SOS', desc: 'البلاغات النشطة', href: '/admin/sos' },
    { icon: '📞', title: 'أرقام الطوارئ', desc: 'أرقام الإسعاف والدفاع المدني', href: '/admin/emergency-contacts' },
    { icon: '📁', title: 'إدارة الأقسام', desc: 'إظهار وإخفاء الأقسام', href: '/admin/categories' },
    { icon: '📿', title: 'الأذكار', desc: 'تعديل الإعدادات والأذكار', href: '/admin/azkar' },
    { icon: '📢', title: 'الإعلانات', desc: 'موافقة ونشر', href: '/admin/manage/announcements' },
    { icon: '⭐', title: 'التقييمات', desc: 'مراجعة وردود', href: '/admin/manage/reviews' },
    { icon: '💰', title: 'الاشتراكات', desc: 'إدارة الخطط', href: '/admin/manage/entities' },
    { icon: '⚙️', title: 'الإعدادات', desc: 'المنصة والألوان', href: '/admin/settings' },
    { icon: '🔧', title: 'الصيانة', desc: 'النسخ والأمان', href: '/admin/backup' },
  ];

  return (
    <div className="admin-page">
      <header className="admin-hero">
        <div className="admin-hero-inner">
          <div className="admin-brand">
            <div className="admin-brand-name">
              <span className="admin-brand-mark">س</span>
              <span>{t("admin.title")}</span>
            </div>
            <button onClick={logout} style={{ color: '#fca5a5', fontSize: 13, fontWeight: 800, padding: 8, background: 'rgba(220,38,38,.1)', borderRadius: 10, border: '1px solid rgba(220,38,38,.2)', cursor: 'pointer' }}>
              خروج
            </button>
          </div>
          <h1 className="admin-title">مرحباً {admin.full_name}</h1>
          <p className="admin-sub">الصلاحية: {admin.role === 'owner' ? 'المالك' : admin.role} · تحكم كامل</p>
        </div>
      </header>

      <div className="admin-stats">
        <div className="admin-stat"><div className="admin-stat-val">{stats.entities}</div><div className="admin-stat-lbl">{t("admin.entities") || "كيانات"}</div></div>
        <div className="admin-stat"><div className="admin-stat-val">{stats.services + stats.products}</div><div className="admin-stat-lbl">{t("admin.services") || "خدمات ومنتجات"}</div></div>
        <div className="admin-stat"><div className="admin-stat-val">{stats.orders}</div><div className="admin-stat-lbl">{t("orders.title")}</div></div>
        <div className="admin-stat"><div className="admin-stat-val">{stats.sos}</div><div className="admin-stat-lbl">{t("admin.sos") || "بلاغات SOS"}</div></div>
        <div className="admin-stat"><div className="admin-stat-val">{stats.categories}</div><div className="admin-stat-lbl">{t("app.categories")}</div></div>
        <div className="admin-stat"><div className="admin-stat-val">{stats.reviews}</div><div className="admin-stat-lbl">{t("common.reviews")}</div></div>
      </div>

      <div className="admin-menu">
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} className="admin-menu-item">
            <div className="admin-menu-icon">{m.icon}</div>
            <div className="admin-menu-body">
              <div className="admin-menu-title">{m.title}</div>
              <div className="admin-menu-desc">{m.desc}</div>
            </div>
            <span className="admin-menu-arrow">←</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
