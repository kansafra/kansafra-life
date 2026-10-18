'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function LibraryPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('library_books').select('*').order('created_at', { ascending: false });
      setBooks(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const categories = useMemo(() => {
    const set = new Set(books.map(b => b.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [books]);

  const filtered = useMemo(() => {
    let list = books;
    if (categoryFilter !== 'all') list = list.filter(b => b.category === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(b =>
        (b.title || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [books, categoryFilter, search]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>📚 المكتبة</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{filtered.length} كتاب</div>
          </div>
          <div style={{ fontSize: 40 }}>📚</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث بالعنوان أو المؤلف..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)} style={{ padding: '8px 14px', background: categoryFilter === c ? '#7c3aed' : '#fff', color: categoryFilter === c ? '#fff' : '#64748b', border: `1px solid ${categoryFilter === c ? '#7c3aed' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{c === 'all' ? 'الكل' : c}</button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 16 }}><SkeletonList count={3} /></div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0 ? (
            <EmptyState icon="📚" title={search || categoryFilter !== 'all' ? 'لا توجد نتائج' : 'لا توجد كتب'} description="ستظهر الكتب هنا" actionLabel="← الرئيسية" actionHref="/" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {filtered.map(b => (
                <div key={b.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
                  {b.cover_url ? (
                    <img src={b.cover_url} alt={b.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: 180, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>📖</div>
                  )}
                  <div style={{ padding: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 900, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>{b.title}</div>
                      {b.author && <div style={{ fontSize: 10.5, color: '#64748b' }}>✍️ {b.author}</div>}
                    </div>
                    {b.file_url && (
                      <a href={b.file_url} target="_blank" rel="noopener" style={{ marginTop: 8, padding: '8px', background: 'rgba(124,58,237,.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,.3)', borderRadius: 8, textAlign: 'center', fontSize: 11, fontWeight: 900, textDecoration: 'none' }}>⬇️ تحميل</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
