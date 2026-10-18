'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';

export default function AdminMemoryPage() {
  const router = useRouter();
  const { error: tE } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    items: 0, stories: 0, places: 0, total_memories: 0
  });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [i, s, p] = await Promise.all([
        supabase.from('memory_items').select('*', { count: 'exact', head: true }),
        supabase.from('memory_stories').select('*', { count: 'exact', head: true }),
        supabase.from('memory_places').select('*', { count: 'exact', head: true }),
      ]);
      
      // جلب آخر 5 إضافات
      const { data: recentItems } = await supabase.from('memory_items').select('*').order('created_at', { ascending: false }).limit(5);
      
      setStats({
        items: i.count || 0,
        stories: s.count || 0,
        places: p.count || 0,
        total_memories: (i.count || 0) + (s.count || 0) + (p.count || 0),
      });
      setRecent(recentItems || []);
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg,#6366f1,#4338ca)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>📸 ذاكرة كنصفرة</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>أرشيف البلدة التاريخي</div>
          </div>
          <div style={{ fontSize: 40 }}>📸</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>إجمالي المحتوى</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.total_memories}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>آخر إضافة</div>
            <div style={{ fontSize: 14, fontWeight: 900 }}>{recent[0]?.created_at ? new Date(recent[0].created_at).toLocaleDateString('ar-EG') : '—'}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: -20 }}>
        {[
          { icon: '📸', val: stats.items, label: 'صور', color: '#6366f1', href: '/admin/reports' },
          { icon: '📖', val: stats.stories, label: 'حكايات', color: '#8b5cf6', href: '/admin/reports' },
          { icon: '📍', val: stats.places, label: 'أماكن', color: '#06b6d4', href: '/admin/reports' },
        ].map((s, i) => (
          <Link key={i} href={s.href} style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit', boxShadow: '0 4px 12px rgba(0,0,0,.03)' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
          </Link>
        ))}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>⚡ إجراءات سريعة</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <Link href="/memory" style={{ background: '#fff', padding: 14, borderRadius: 12, textDecoration: 'none', color: 'inherit', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 24 }}>👁️</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900 }}>عرض الأرشيف</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>الصفحة العامة</div>
            </div>
          </Link>
          <Link href="/admin/reports" style={{ background: '#fff', padding: 14, borderRadius: 12, textDecoration: 'none', color: 'inherit', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 24 }}>📊</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900 }}>التقارير</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>إحصائيات</div>
            </div>
          </Link>
        </div>
      </div>

      {recent.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>🆕 آخر الإضافات</div>
          {recent.map(item => (
            <div key={item.id} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, border: '1px solid #e5e7eb', display: 'flex', gap: 12 }}>
              {item.image_url ? (
                <img src={item.image_url} alt="" style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 50, height: 50, borderRadius: 8, background: 'rgba(99,102,241,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📸</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || 'بدون عنوان'}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{new Date(item.created_at).toLocaleDateString('ar-EG')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
