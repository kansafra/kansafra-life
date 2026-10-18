'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';

export default function AdminLibraryPage() {
  const router = useRouter();
  const { error: tE } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ books: 0, categories: 0, recent: [] });

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [count, cats] = await Promise.all([
        supabase.from('library_books').select('*', { count: 'exact', head: true }),
        supabase.from('library_books').select('category'),
      ]);
      
      const uniqueCats = [...new Set((cats.data || []).map(c => c.category).filter(Boolean))];
      const { data: recent } = await supabase.from('library_books').select('*').order('created_at', { ascending: false }).limit(5);
      
      setStats({
        books: count.count || 0,
        categories: uniqueCats.length,
        recent: recent || [],
      });
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>📚 إدارة المكتبة</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>الكتب والمراجع</div>
          </div>
          <div style={{ fontSize: 40 }}>📚</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>إجمالي الكتب</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.books}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>التصنيفات</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.categories}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <Link href="/library" style={{ background: '#fff', padding: 16, borderRadius: 14, textDecoration: 'none', color: 'inherit', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 24 }}>👁️</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900 }}>المكتبة العامة</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>عرض للزوار</div>
            </div>
          </Link>
          <Link href="/admin/reports" style={{ background: '#fff', padding: 16, borderRadius: 14, textDecoration: 'none', color: 'inherit', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 24 }}>📊</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900 }}>التقارير</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>إحصائيات</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Books */}
      {stats.recent.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>📖 آخر الكتب المضافة</div>
          {stats.recent.map(book => (
            <div key={book.id} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, border: '1px solid #e5e7eb', display: 'flex', gap: 12 }}>
              {book.cover_url ? (
                <img src={book.cover_url} alt="" style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 50, height: 50, borderRadius: 8, background: 'rgba(124,58,237,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📖</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                {book.author && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{book.author}</div>}
                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{new Date(book.created_at).toLocaleDateString('ar-EG')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
