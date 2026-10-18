'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';

export default function AdminAuctionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, entities: 0, recent: [] });

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      let totalCount = 0;
      let entitiesCount = 0;
      let recentData = [];

      // جلب الإحصائيات
      if ('auctions') {
        const { count, error } = await supabase.from('auctions').select('*', { count: 'exact', head: true });
        totalCount = count || 0;
        const { data } = await supabase.from('auctions').select('*').order('created_at', { ascending: false }).limit(5);
        recentData = data || [];
      }
      
      if ('null') {
        const { count } = await supabase.from('entities').select('*', { count: 'exact', head: true }).eq('entity_type', 'null').eq('is_active', true);
        entitiesCount = count || 0;
      }

      setStats({ total: totalCount, entities: entitiesCount, recent: recentData });
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🏆 إدارة المزادات</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>مركز التحكم بالقسم</div>
          </div>
          <div style={{ fontSize: 40 }}>🏆</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>إجمالي السجلات</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.total}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>المزودون النشطون</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.entities}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>⚡ إجراءات سريعة</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          
          <Link href="/admin/reports" style={{ background: '#fff', padding: 16, borderRadius: 14, textDecoration: 'none', color: 'inherit', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 24 }}>📊</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900 }}>التقارير</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>إحصائيات القسم</div>
            </div>
          </Link>
        </div>
      </div>

      {stats.recent.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>🆕 آخر الإضافات</div>
          {stats.recent.map((item, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || item.name || item.patient_name || item.service_type || 'بدون عنوان'}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{new Date(item.created_at).toLocaleDateString('ar-EG')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
