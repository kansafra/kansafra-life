'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CATEGORIES = {
  general: { label: 'عام', icon: '📚' },
  religion: { label: 'ديني', icon: '🕌' },
  science: { label: 'علمي', icon: '🔬' },
  literature: { label: 'أدبي', icon: '📖' },
  history: { label: 'تاريخي', icon: '📜' },
  children: { label: 'أطفال', icon: '🧸' },
  education: { label: 'تعليمي', icon: '🎓' },
  other: { label: 'أخرى', icon: '📕' },
};

export default function LibraryPage() {
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => { loadBooks(); }, []);

  async function loadBooks() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('library_books')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setBooks(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    let list = books;
    if (category !== 'all') list = list.filter(b => b.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(b =>
        (b.title || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [books, category, search]);

  const stats = useMemo(() => {
    const byCat = {};
    books.forEach(b => { byCat[b.category] = (byCat[b.category] || 0) + 1; });
    return { total: books.length, byCat };
  }, [books]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.back()} style={{ color: '#fff', background: 'rgba(255,255,255,.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>📚 المكتبة</h1>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{stats.total} كتاب متاح</div>
          </div>
          <Link href="/merchant/library/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ أضف</Link>
        </div>
        <input type="search" placeholder="🔍 ابحث عن كتاب أو مؤلف..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit' }} />
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setCategory('all')} style={chipStyle(category === 'all')}>الكل</button>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <button key={k} onClick={() => setCategory(k)} style={chipStyle(category === k)}>
              {v.icon} {v.label} {stats.byCat[k] > 0 && `(${stats.byCat[k]})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>📚</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>
              {books.length === 0 ? 'لا توجد كتب بعد' : 'لا توجد نتائج'}
            </div>
            {books.length === 0 && (
              <Link href="/merchant/library/new" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900, marginTop: 12 }}>
                + أضف أول كتاب
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {filtered.map(book => {
              const cat = CATEGORIES[book.category] || CATEGORIES.general;
              return (
                <div key={book.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <div style={{ position: 'relative', paddingTop: '130%', background: 'linear-gradient(135deg, #f0fdf4, #e0f2fe)' }}>
                    {book.image_url ? (
                      <img src={book.image_url} alt={book.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50 }}>{cat.icon}</div>
                    )}
                    {book.is_free && <div style={{ position: 'absolute', top: 8, right: 8, background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 }}>مجاني</div>}
                  </div>
                  <div style={{ padding: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                    {book.author && <div style={{ fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✍️ {book.author}</div>}
                    {book.file_url && (
                      <a href={book.file_url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 8, textAlign: 'center', padding: 8, background: 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: 8, textDecoration: 'none', fontSize: 11, fontWeight: 900 }}>
                        📖 فتح
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function chipStyle(active) {
  return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
}
