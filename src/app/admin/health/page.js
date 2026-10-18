'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';

export default function AdminHealthPage() {
  const router = useRouter();
  const { error: tE } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    doctors: 0, pharmacies: 0, appointments_today: 0,
    appointments_pending: 0, records: 0, blood_donors: 0, blood_requests: 0, oncall: 0
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
      const today = new Date().toISOString().slice(0, 10);
      const [d, p, at, ap, mr, bd, br, oc] = await Promise.all([
        supabase.from('entities').select('*', { count: 'exact', head: true }).eq('entity_type', 'doctor').eq('is_active', true),
        supabase.from('entities').select('*', { count: 'exact', head: true }).eq('entity_type', 'pharmacy').eq('is_active', true),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('medical_records').select('*', { count: 'exact', head: true }),
        supabase.from('blood_donors').select('*', { count: 'exact', head: true }).eq('is_available', true),
        supabase.from('blood_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('oncall_shifts').select('*', { count: 'exact', head: true }).eq('shift_date', today),
      ]);
      setStats({
        doctors: d.count || 0,
        pharmacies: p.count || 0,
        appointments_today: at.count || 0,
        appointments_pending: ap.count || 0,
        records: mr.count || 0,
        blood_donors: bd.count || 0,
        blood_requests: br.count || 0,
        oncall: oc.count || 0,
      });
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  const menuSections = [
    {
      title: '👥 المزودون الصحيون',
      links: [
        { href: '/admin/entities?type=doctor', icon: '🩺', label: 'الأطباء', count: stats.doctors },
        { href: '/admin/entities?type=pharmacy', icon: '💊', label: 'الصيدليات', count: stats.pharmacies },
      ]
    },
    {
      title: '📅 المواعيد والسجلات',
      links: [
        { href: '/admin/moderation', icon: '📅', label: 'المواعيد اليوم', count: stats.appointments_today },
        { href: '/admin/moderation', icon: '⏳', label: 'معلّقة', count: stats.appointments_pending, urgent: stats.appointments_pending > 0 },
        { href: '/admin/reports', icon: '📋', label: 'السجلات الطبية', count: stats.records },
      ]
    },
    {
      title: '🚨 الطوارئ والدم',
      links: [
        { href: '/admin/sos', icon: '🚨', label: 'بلاغات SOS' },
        { href: '/admin/emergency-contacts', icon: '☎️', label: 'أرقام الطوارئ' },
        { href: '/admin/health/blood', icon: '🩸', label: 'بنك الدم', count: stats.blood_donors + stats.blood_requests },
      ]
    },
    {
      title: '🌙 المناوبات',
      links: [
        { href: '/admin/health/oncall', icon: '🌙', label: 'مناوبات اليوم', count: stats.oncall },
        { href: '/admin/health/oncall', icon: '📋', label: 'جدول المناوبات' },
      ]
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#dc2626,#991b1b)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🏥 إدارة الصحة</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>مركز التحكم بالقسم الصحي</div>
          </div>
          <div style={{ fontSize: 40 }}>🏥</div>
        </div>

        {/* Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>مواعيد اليوم</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.appointments_today}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>معلّقة</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.appointments_pending}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: -20 }}>
        {[
          { icon: '🩺', val: stats.doctors, label: 'أطباء', color: '#dc2626' },
          { icon: '💊', val: stats.pharmacies, label: 'صيدليات', color: '#0891b2' },
          { icon: '📋', val: stats.records, label: 'سجلات', color: '#3b82f6' },
          { icon: '🌙', val: stats.oncall, label: 'مناوبات', color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,.03)' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Blood Bank Section */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ background: 'linear-gradient(135deg,#fecaca,#fca5a5)', borderRadius: 16, padding: 16, border: '1px solid #f87171' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#7f1d1d' }}>🩸 بنك الدم</div>
            <Link href="/admin/health/blood" style={{ fontSize: 11, fontWeight: 900, color: '#7f1d1d', textDecoration: 'none' }}>إدارة ←</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'rgba(255,255,255,.6)', borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 10, color: '#991b1b', fontWeight: 700 }}>متبرعون متاحون</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#dc2626' }}>{stats.blood_donors}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.6)', borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 10, color: '#991b1b', fontWeight: 700 }}>طلبات مفتوحة</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#dc2626' }}>{stats.blood_requests}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      {menuSections.map((section, idx) => (
        <div key={idx} style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>{section.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {section.links.map(link => (
              <Link key={link.label} href={link.href} style={{ background: '#fff', border: `1px solid ${link.urgent ? '#f59e0b' : '#e5e7eb'}`, borderRadius: 12, padding: '14px 12px', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 24 }}>{link.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>{link.label}</div>
                  {link.count !== undefined && <div style={{ fontSize: 11, color: link.urgent ? '#f59e0b' : '#64748b', fontWeight: 900, marginTop: 2 }}>{link.count}</div>}
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
