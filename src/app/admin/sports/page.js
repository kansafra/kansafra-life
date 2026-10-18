'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';

export default function AdminSportsPage() {
  const router = useRouter();
  const { error: tE } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    clubs: 0, players: 0, matches: 0, upcoming: 0
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
      const [c, p, m, u] = await Promise.all([
        supabase.from('entities').select('*', { count: 'exact', head: true }).eq('entity_type', 'sports').eq('is_active', true),
        supabase.from('sports_players').select('*', { count: 'exact', head: true }),
        supabase.from('sports_matches').select('*', { count: 'exact', head: true }),
        supabase.from('sports_matches').select('*', { count: 'exact', head: true }).eq('status', 'upcoming'),
      ]);
      setStats({
        clubs: c.count || 0,
        players: p.count || 0,
        matches: m.count || 0,
        upcoming: u.count || 0,
      });
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  const sections = [
    {
      title: '🏟️ الأندية والفرق',
      links: [
        { href: '/admin/entities?type=sports', icon: '🏟️', label: 'الأندية', count: stats.clubs },
        { href: '/admin/reports', icon: '⚽', label: 'اللاعبون', count: stats.players },
      ]
    },
    {
      title: '📅 المباريات',
      links: [
        { href: '/admin/reports', icon: '📅', label: 'كل المباريات', count: stats.matches },
        { href: '/admin/reports', icon: '🔜', label: 'المباريات القادمة', count: stats.upcoming },
        { href: '/admin/reports', icon: '📈', label: 'التقارير' },
      ]
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg,#ea580c,#9a3412)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🏆 إدارة الرياضة</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>الأندية والمباريات والترتيب</div>
          </div>
          <div style={{ fontSize: 40 }}>🏆</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>الأندية</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.clubs}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>اللاعبون</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.players}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: -20 }}>
        {[
          { icon: '🏟️', val: stats.clubs, label: 'أندية', color: '#ea580c' },
          { icon: '📅', val: stats.matches, label: 'مباريات', color: '#3b82f6' },
          { icon: '🔜', val: stats.upcoming, label: 'قادمة', color: '#10b981' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,.03)' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
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
                  {link.count !== undefined && <div style={{ fontSize: 11, color: '#ea580c', fontWeight: 900, marginTop: 2 }}>{link.count}</div>}
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
