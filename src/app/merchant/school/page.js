'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function SchoolDashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, subjects: 0 });

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession(s);
    loadStats(s);
  }, [router]);

  async function loadStats(s) {
    if (!supabase) return;
    const [stRes, tRes, cRes, subRes] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_name', s.display_name),
      supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('entity_name', s.display_name),
      supabase.from('classes').select('id', { count: 'exact', head: true }).eq('entity_name', s.display_name),
      supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('entity_name', s.display_name),
    ]);
    setStats({
      students: stRes.count || 0,
      teachers: tRes.count || 0,
      classes: cRes.count || 0,
      subjects: subRes.count || 0,
    });
  }

  if (!session) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 60 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">🏫 لوحة المدرسة</span>
        <span style={{ width: 40 }} />
      </div>

      {/* إحصائيات */}
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <StatCard icon="👥" label="طالب" value={stats.students} color="#22c55e" />
        <StatCard icon="👨‍🏫" label="أستاذ" value={stats.teachers} color="#0ea5e9" />
        <StatCard icon="📚" label="صف" value={stats.classes} color="#8b5cf6" />
        <StatCard icon="📖" label="مادة" value={stats.subjects} color="#f59e0b" />
      </div>

      {/* روابط سريعة */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>⚡ إدارة سريعة</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <QuickLink icon="📚" title="الصفوف" href="/merchant/classes" color="#8b5cf6" />
          <QuickLink icon="👥" title="الطلاب" href="/merchant/students" color="#22c55e" />
          <QuickLink icon="👨‍🏫" title="الأساتذة" href="/merchant/teachers" color="#0ea5e9" />
          <QuickLink icon="📖" title="المواد" href="/merchant/subjects" color="#f59e0b" />
          <QuickLink icon="📄" title="ملفات الصفوف" href="/merchant/class-files" color="#ec4899" />
          <QuickLink icon="📝" title="الواجبات" href="/merchant/assignments" color="#14b8a6" />
          <QuickLink icon="📊" title="العلامات" href="/merchant/grades" color="#6366f1" />
          <QuickLink icon="📋" title="الحضور" href="/merchant/attendance" color="#dc2626" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      padding: 16, background: color + '15', border: `1px solid ${color}44`,
      borderRadius: 16, textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--n-500)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function QuickLink({ icon, title, href, color }) {
  return (
    <Link href={href} style={{
      padding: 16, background: 'rgba(255,255,255,.03)',
      border: '1px solid rgba(255,255,255,.08)', borderRadius: 16,
      textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{title}</span>
    </Link>
  );
}
