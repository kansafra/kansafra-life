'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';

export default function AdminEducationPage() {
  const router = useRouter();
  const { error: tE } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    schools: 0, classes: 0, students: 0, teachers: 0, subjects: 0
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
      const [s, c, st, t, sub] = await Promise.all([
        supabase.from('entities').select('*', { count: 'exact', head: true }).eq('entity_type', 'school').eq('is_active', true),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        schools: s.count || 0,
        classes: c.count || 0,
        students: st.count || 0,
        teachers: t.count || 0,
        subjects: sub.count || 0,
      });
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  const sections = [
    {
      title: '🏫 المؤسسات التعليمية',
      links: [
        { href: '/admin/entities?type=school', icon: '🏫', label: 'المدارس', count: stats.schools },
        { href: '/admin/entities?type=teacher', icon: '👨‍🏫', label: 'المعلمون', count: stats.teachers },
      ]
    },
    {
      title: '📊 البيانات الأكاديمية',
      links: [
        { href: '/admin/reports', icon: '🏫', label: 'الصفوف', count: stats.classes },
        { href: '/admin/reports', icon: '👨‍🎓', label: 'الطلاب', count: stats.students },
        { href: '/admin/reports', icon: '📚', label: 'المواد', count: stats.subjects },
      ]
    },
    {
      title: '📋 الإدارة',
      links: [
        { href: '/admin/moderation', icon: '🛡️', label: 'المراجعة' },
        { href: '/admin/announcements', icon: '📢', label: 'الإعلانات' },
        { href: '/admin/reports', icon: '📈', label: 'التقارير' },
      ]
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🎓 إدارة التعليم</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>مركز التحكم بالقسم التعليمي</div>
          </div>
          <div style={{ fontSize: 40 }}>🎓</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>الطلاب</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.students}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>المعلمون</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.teachers}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: -20 }}>
        {[
          { icon: '🏫', val: stats.schools, label: 'مدارس', color: '#7c3aed' },
          { icon: '📚', val: stats.classes, label: 'صفوف', color: '#3b82f6' },
          { icon: '📖', val: stats.subjects, label: 'مواد', color: '#10b981' },
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
              <Link key={link.label} href={link.href} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 12px', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 24 }}>{link.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>{link.label}</div>
                  {link.count !== undefined && <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 900, marginTop: 2 }}>{link.count}</div>}
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
