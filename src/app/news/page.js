'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [a, c] = await Promise.all([
      supabase.from('news_articles').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(100),
      supabase.from('news_categories').select('*').eq('is_active', true).order('sort_order'),
    ]);
    setArticles(Array.isArray(a.data) ? a.data : []);
    setCategories(Array.isArray(c.data) ? c.data : []);
    setLoading(false);
  }

  const filtered = articles.filter((a) => {
    if (activeCat !== 'all' && a.category_id !== activeCat && a.category !== activeCat) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (a.title || '').toLowerCase().includes(q) || (a.body || '').toLowerCase().includes(q);
  });

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/" className="inv-back">→</Link>
        <span className="inv-title">📰 الصحيفة</span>
        <span className="mng-count">{articles.length}</span>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <input className="new-service-input" placeholder="ابحث في الأخبار..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {categories.length > 0 && (
        <div className="store-cat-scroll" style={{ paddingTop: 14 }}>
          <button className={`store-cat-chip ${activeCat === 'all' ? 'active' : ''}`} onClick={() => setActiveCat('all')} type="button">الكل</button>
          {categories.map((c) => (
            <button key={c.id} className={`store-cat-chip ${activeCat === c.id ? 'active' : ''}`} onClick={() => setActiveCat(c.id)} type="button">
              {c.icon || '📄'} {c.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">📰</span><p>لا توجد أخبار</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {filtered.map((a) => (
            <Link key={a.id} href={`/news/${a.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}>
              <div className="debt-card" style={{ borderRightColor: a.is_featured ? '#f59e0b' : '#0e8a66' }}>
                {a.is_featured && (
                  <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: 'rgba(245,158,11,.15)', color: '#d97706', fontSize: 10, fontWeight: 900, marginBottom: 8 }}>
                    ⭐ خبر مميز
                  </div>
                )}
                <div className="debt-customer" style={{ fontSize: 16, marginBottom: 6 }}>{a.title}</div>
                {a.excerpt || a.subtitle ? (
                  <div style={{ fontSize: 13, color: 'var(--n-600)', lineHeight: 1.7, marginBottom: 8 }}>
                    {(a.excerpt || a.subtitle).slice(0, 180)}...
                  </div>
                ) : a.body ? (
                  <div style={{ fontSize: 13, color: 'var(--n-600)', lineHeight: 1.7, marginBottom: 8 }}>
                    {a.body.slice(0, 180)}...
                  </div>
                ) : null}
                <div style={{ fontSize: 11, color: 'var(--n-400)', fontWeight: 700, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>✍️ {a.author_name}</span>
                  <span>👁️ {a.views || 0} · {new Date(a.published_at || a.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
