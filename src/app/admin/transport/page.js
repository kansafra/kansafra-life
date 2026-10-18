'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';

export default function AdminTransportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ providers: 0, vehicles: 0, active: 0 });

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [p, v, a] = await Promise.all([
        supabase.from('entities').select('*', { count: 'exact', head: true }).eq('entity_type', 'transport'),
        supabase.from('transport_vehicles').select('*', { count: 'exact', head: true }),
        supabase.from('transport_vehicles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      setStats({
        providers: p.count || 0,
        vehicles: v.count || 0,
        active: a.count || 0,
      });
    } catch (e) {}
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 16 }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🚗 إدارة المواصلات</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>المركبات والمزودين</div>
          </div>
          <div style={{ fontSize: 40 }}>🚗</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>المزودون</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.providers}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>المركبات</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.vehicles}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <Link href="/admin/entities?type=transport" style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: 16, borderRadius: 14, textDecoration: 'none', color: 'inherit', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 24 }}>🏢</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 900 }}>إدارة مزودي الخدمة</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>الموافقة، التفعيل، والتوثيق</div>
          </div>
          <div style={{ fontSize: 18, color: '#94a3b8' }}>›</div>
        </Link>
      </div>
    </div>
  );
}
