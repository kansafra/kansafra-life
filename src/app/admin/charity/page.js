'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';

export default function AdminCharityPage() {
  const router = useRouter();
  const { error: tE } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    orgs: 0, donations_count: 0, donations_amount: 0, volunteers: 0
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
      const [orgs, dc, da, v] = await Promise.all([
        supabase.from('entities').select('*', { count: 'exact', head: true }).eq('entity_type', 'charity').eq('is_active', true),
        supabase.from('donations').select('*', { count: 'exact', head: true }),
        supabase.from('donations').select('amount').eq('donation_type', 'cash'),
        supabase.from('volunteers').select('*', { count: 'exact', head: true }),
      ]);
      
      const amount = (da.data || []).reduce((s, d) => s + Number(d.amount || 0), 0);

      setStats({
        orgs: orgs.count || 0,
        donations_count: dc.count || 0,
        donations_amount: amount,
        volunteers: v.count || 0,
      });
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  const sections = [
    {
      title: '🤝 الجمعيات',
      links: [
        { href: '/admin/entities?type=charity', icon: '🏢', label: 'الجمعيات', count: stats.orgs },
        { href: '/admin/moderation', icon: '🛡️', label: 'المراجعة' },
      ]
    },
    {
      title: '🎁 التبرعات والمتطوعين',
      links: [
        { href: '/admin/reports', icon: '🎁', label: 'التبرعات', count: stats.donations_count },
        { href: '/admin/reports', icon: '👥', label: 'المتطوعون', count: stats.volunteers },
        { href: '/admin/reports', icon: '📈', label: 'التقارير' },
      ]
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg,#059669,#065f46)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🤝 إدارة الجمعيات</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>التبرعات والمساعدات والمتطوعين</div>
          </div>
          <div style={{ fontSize: 40 }}>🤝</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>إجمالي التبرعات</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{stats.donations_amount.toLocaleString()}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>المتطوعون</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.volunteers}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: -20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,.03)' }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>🏢</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#059669' }}>{stats.orgs}</div>
          <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, marginTop: 2 }}>جمعية</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,.03)' }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>🎁</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#3b82f6' }}>{stats.donations_count}</div>
          <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, marginTop: 2 }}>تبرع</div>
        </div>
      </div>

      {sections.map((section, idx) => (
        <div key={idx} style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>{section.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {section.links.map(link => (
              <Link key={link.label} href={link.href} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 12px', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 24 }}>{link.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>{link.label}</div>
                  {link.count !== undefined && <div style={{ fontSize: 11, color: '#059669', fontWeight: 900, marginTop: 2 }}>{link.count}</div>}
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
