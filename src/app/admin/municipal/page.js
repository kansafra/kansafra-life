'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';

export default function AdminMunicipalPage() {
  const router = useRouter();
  const { error: tE } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    services: 0, complaints_open: 0, complaints_total: 0,
    permits_pending: 0, permits_total: 0, revenue: 0
  });

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [svc, co, ct, pp, pt, rev] = await Promise.all([
        supabase.from('municipal_services').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('complaints').select('*', { count: 'exact', head: true }),
        supabase.from('municipal_permits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('municipal_permits').select('*', { count: 'exact', head: true }),
        supabase.from('municipal_permits').select('fee').eq('is_paid', true),
      ]);
      const revenue = (rev.data || []).reduce((s, p) => s + Number(p.fee || 0), 0);
      setStats({
        services: svc.count || 0,
        complaints_open: co.count || 0,
        complaints_total: ct.count || 0,
        permits_pending: pp.count || 0,
        permits_total: pt.count || 0,
        revenue,
      });
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  const sections = [
    {
      title: '📋 الخدمات البلدية',
      links: [
        { href: '/admin/municipal/services', icon: '🏛️', label: 'الخدمات', count: stats.services },
        { href: '/admin/municipal/permits', icon: '📋', label: 'المعاملات', count: stats.permits_total, urgent: stats.permits_pending > 0, urgentCount: stats.permits_pending },
      ]
    },
    {
      title: '📝 شكاوى المواطنين',
      links: [
        { href: '/admin/municipal/complaints', icon: '📝', label: 'الشكاوى', count: stats.complaints_total, urgent: stats.complaints_open > 0, urgentCount: stats.complaints_open },
      ]
    },
    {
      title: '📊 التقارير',
      links: [
        { href: '/admin/reports', icon: '📈', label: 'التقارير' },
        { href: '/admin/analytics', icon: '📊', label: 'التحليلات' },
      ]
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg,#1e40af,#1e3a8a)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🏢 إدارة البلدية</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>الخدمات، المعاملات، والشكاوى</div>
          </div>
          <div style={{ fontSize: 40 }}>🏢</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>شكاوى جديدة</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.complaints_open}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>معاملات معلقة</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.permits_pending}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: -20 }}>
        {[
          { icon: '🏛️', val: stats.services, label: 'خدمات', color: '#1e40af' },
          { icon: '📋', val: stats.permits_total, label: 'معاملات', color: '#3b82f6' },
          { icon: '💰', val: stats.revenue > 0 ? Math.round(stats.revenue / 1000) + 'K' : '0', label: 'إيراد', color: '#10b981' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,.03)' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {sections.map((section, idx) => (
        <div key={idx} style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>{section.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {section.links.map(link => (
              <Link key={link.label} href={link.href} style={{ background: '#fff', border: `1px solid ${link.urgent ? '#f59e0b' : '#e5e7eb'}`, borderRadius: 12, padding: '14px 12px', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                {link.urgentCount > 0 && (
                  <span style={{ position: 'absolute', top: 6, left: 6, background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 900 }}>{link.urgentCount}</span>
                )}
                <div style={{ fontSize: 24 }}>{link.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>{link.label}</div>
                  {link.count !== undefined && <div style={{ fontSize: 11, color: link.urgent ? '#f59e0b' : '#1e40af', fontWeight: 900, marginTop: 2 }}>{link.count}</div>}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>›</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
