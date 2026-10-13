'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState({ entities: [], services: [], products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [didSearch, setDidSearch] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const initial = params.get('q');
      if (initial) { setQ(initial); runSearch(initial); }
    }
  }, []);

  async function runSearch(term) {
    if (!term.trim() || !supabase) return;
    setLoading(true);
    setDidSearch(true);
    const t = `%${term.trim()}%`;

    const [e, s, p, c] = await Promise.all([
      supabase.from('entities').select('*').or(`display_name.ilike.${t},bio.ilike.${t},phone.ilike.${t}`).limit(20),
      supabase.from('services').select('*').or(`title.ilike.${t},description.ilike.${t},provider_name.ilike.${t}`).limit(20),
      supabase.from('products').select('*').or(`title.ilike.${t},description.ilike.${t},provider_name.ilike.${t}`).limit(20),
      supabase.from('service_categories').select('*').or(`name.ilike.${t},description.ilike.${t}`).limit(10),
    ]);

    setResults({
      entities: Array.isArray(e.data) ? e.data : [],
      services: Array.isArray(s.data) ? s.data : [],
      products: Array.isArray(p.data) ? p.data : [],
      categories: Array.isArray(c.data) ? c.data : [],
    });
    setLoading(false);
  }

  function submit(e) {
    e.preventDefault();
    runSearch(q);
  }

  const total = results.entities.length + results.services.length + results.products.length + results.categories.length;

  return (
    <div className="ent-page">
      <div className="inv-header">
        <Link href="/" className="inv-back">→</Link>
        <span className="inv-title">🔍 البحث الشامل</span>
      </div>

      <form onSubmit={submit} style={{ padding: '20px 20px 0' }}>
        <div className="search-box">
          <span className="ico">⌕</span>
          <input
            autoFocus
            type="text"
            placeholder="ابحث في كل شيء: كيانات، خدمات، منتجات..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="submit" type="submit">بحث</button>
        </div>
      </form>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ البحث...</p></div>
      ) : didSearch && total === 0 ? (
        <div className="sect-empty">
          <span className="em">🔍</span>
          <p>لا توجد نتائج لـ "{q}"</p>
        </div>
      ) : (
        <div className="gs-panel">

          {results.categories.length > 0 && (
            <>
              <div className="gs-cat">📂 الأقسام</div>
              {results.categories.map((c) => (
                <Link key={c.id} href="/" className="gs-item">
                  <div className="gs-item-icon">{c.icon || '📂'}</div>
                  <div className="gs-item-body">
                    <div className="gs-item-title">{c.name}</div>
                    <div className="gs-item-sub">{c.description || ''}</div>
                  </div>
                  <span className="gs-item-badge">قسم</span>
                </Link>
              ))}
            </>
          )}

          {results.entities.length > 0 && (
            <>
              <div className="gs-cat">🏢 الكيانات</div>
              {results.entities.map((e) => (
                <Link key={e.id} href={`/entity/${encodeURIComponent(e.display_name)}`} className="gs-item">
                  <div className="gs-item-icon">🏢</div>
                  <div className="gs-item-body">
                    <div className="gs-item-title">{e.display_name}</div>
                    <div className="gs-item-sub">{e.phone || e.bio || '@' + e.username}</div>
                  </div>
                  <span className="gs-item-badge">{e.entity_type}</span>
                </Link>
              ))}
            </>
          )}

          {results.services.length > 0 && (
            <>
              <div className="gs-cat">🛠️ الخدمات</div>
              {results.services.map((s) => (
                <Link key={s.id} href={`/service/${s.id}`} className="gs-item">
                  <div className="gs-item-icon">🛠️</div>
                  <div className="gs-item-body">
                    <div className="gs-item-title">{s.title}</div>
                    <div className="gs-item-sub">{s.provider_name || ''}</div>
                  </div>
                  <span className="gs-item-badge">خدمة</span>
                </Link>
              ))}
            </>
          )}

          {results.products.length > 0 && (
            <>
              <div className="gs-cat">📦 المنتجات</div>
              {results.products.map((p) => (
                <Link key={p.id} href={`/store/${encodeURIComponent(p.provider_name)}`} className="gs-item">
                  <div className="gs-item-icon">📦</div>
                  <div className="gs-item-body">
                    <div className="gs-item-title">{p.title}</div>
                    <div className="gs-item-sub">{p.provider_name || ''} · {p.price} {p.currency}</div>
                  </div>
                  <span className="gs-item-badge">منتج</span>
                </Link>
              ))}
            </>
          )}

        </div>
      )}
    </div>
  );
}
