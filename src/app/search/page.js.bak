'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { globalSearch, POPULAR_SEARCHES, normalizeArabic } from '@/lib/search';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const CATEGORIES = [
  { key: 'all', label: 'الكل', icon: '🔍' },
  { key: 'products', label: 'منتجات', icon: '📦' },
  { key: 'entities', label: 'متاجر', icon: '🏪' },
  { key: 'services', label: 'خدمات', icon: '🛠️' },
  { key: 'realestate', label: 'عقارات', icon: '🏠' },
  { key: 'jobs', label: 'وظائف', icon: '💼' },
  { key: 'lostfound', label: 'مفقودات', icon: '🔍' },
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ products: [], services: [], entities: [], realestate: [], jobs: [], lostfound: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [category, setCategory] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialQuery) {
      runSearch(initialQuery);
    }
  }, [initialQuery]);

  // اقتراحات فورية أثناء الكتابة
  const suggestions = query.trim().length > 0
    ? POPULAR_SEARCHES.filter(s => normalizeArabic(s).includes(normalizeArabic(query))).slice(0, 5)
    : POPULAR_SEARCHES.slice(0, 6);

  async function runSearch(q) {
    if (!q.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await globalSearch(supabase, q, { limit: 30 });
      setResults(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    runSearch(query.trim());
  }

  function pickSuggestion(s) {
    setQuery(s);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(s)}`);
    runSearch(s);
  }

  const totals = {
    all: results.products.length + results.services.length + results.entities.length + results.realestate.length + results.jobs.length + results.lostfound.length,
    products: results.products.length,
    entities: results.entities.length,
    services: results.services.length,
    realestate: results.realestate.length,
    jobs: results.jobs.length,
    lostfound: results.lostfound.length,
  };

  const renderResults = () => {
    if (loading) return <SkeletonList count={4} />;
    if (!hasSearched) return null;
    if (totals.all === 0) {
      return <EmptyState icon="🔍" title="لا توجد نتائج" description={`لم نجد أي نتائج لـ "${query}"`} actionLabel="← الرئيسية" actionHref="/" />;
    }

    const items = [];

    // Products
    if ((category === 'all' || category === 'products') && results.products.length > 0) {
      items.push(
        <div key="products" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>📦 منتجات ({results.products.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {results.products.map(p => {
              const price = Number(p.price) || 0;
              return (
                <Link key={p.id} href={`/product/${p.id}`} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
                  {p.image_url ? <img src={p.image_url} alt="" loading="lazy" style={{ width: '100%', height: 100, objectFit: 'cover' }} /> : <div style={{ height: 100, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>}
                  <div style={{ padding: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0f4d3a' }}>{price.toLocaleString()} <span style={{ fontSize: 9 }}>{p.currency || 'SYP'}</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      );
    }

    // Entities
    if ((category === 'all' || category === 'entities') && results.entities.length > 0) {
      items.push(
        <div key="entities" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>🏪 متاجر ومزودون ({results.entities.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {results.entities.map(e => (
              <Link key={e.id} href={`/store/${encodeURIComponent(e.display_name)}`} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6 }}>
                {e.logo_url ? <img src={e.logo_url} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} /> : <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏪</div>}
                <div style={{ fontSize: 12, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{e.is_verified && '✅ '}{e.display_name}</div>
                {e.city && <div style={{ fontSize: 10, color: '#64748b' }}>📍 {e.city}</div>}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    // Services
    if ((category === 'all' || category === 'services') && results.services.length > 0) {
      items.push(
        <div key="services" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>🛠️ خدمات ({results.services.length})</h2>
          {results.services.map(s => (
            <Link key={s.id} href={`/service/${s.id}`} style={{ display: 'flex', gap: 12, background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit' }}>
              {s.image_url ? <img src={s.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 56, height: 56, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🛠️</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>🏪 {s.provider_name}</div>
              </div>
            </Link>
          ))}
        </div>
      );
    }

    // Real Estate
    if ((category === 'all' || category === 'realestate') && results.realestate.length > 0) {
      items.push(
        <div key="realestate" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>🏠 عقارات ({results.realestate.length})</h2>
          {results.realestate.map(r => (
            <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 900 }}>{r.title}</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#ea580c' }}>{Number(r.price).toLocaleString()} {r.currency}</div>
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>📍 {r.location_text} · {r.property_type} · {r.deal_type}</div>
            </div>
          ))}
        </div>
      );
    }

    // Jobs
    if ((category === 'all' || category === 'jobs') && results.jobs.length > 0) {
      items.push(
        <div key="jobs" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>💼 وظائف ({results.jobs.length})</h2>
          {results.jobs.map(j => (
            <div key={j.id} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 13, fontWeight: 900 }}>{j.title}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>🏢 {j.employer_name} · 📍 {j.location}</div>
            </div>
          ))}
        </div>
      );
    }

    // Lost & Found
    if ((category === 'all' || category === 'lostfound') && results.lostfound.length > 0) {
      items.push(
        <div key="lostfound" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>🔍 مفقودات ({results.lostfound.length})</h2>
          {results.lostfound.map(l => (
            <div key={l.id} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 13, fontWeight: 900 }}>{l.title}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>📍 {l.location_text} · {l.item_type}</div>
            </div>
          ))}
        </div>
      );
    }

    return <div>{items}</div>;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>🔍 البحث الذكي</div>
      </div>

      {/* Search Box */}
      <div style={{ padding: 16, background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'relative' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f8fafc', border: '2px solid #0f4d3a', borderRadius: 12, padding: '4px 4px 4px 14px' }}>
            <span style={{ fontSize: 18, color: '#94a3b8' }}>⌕</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="ابحث في كل شيء..."
              autoFocus
              style={{ flex: 1, padding: 12, background: 'none', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', textAlign: 'right' }}
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus(); }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer', padding: 6 }}>✕</button>
            )}
          </div>
          <button type="submit" style={{ padding: '0 20px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>بحث</button>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 16, right: 16, marginTop: 6, background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.12)', border: '1px solid #e5e7eb', zIndex: 20, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>
              {query.trim() ? 'اقتراحات البحث' : '🔥 الأكثر بحثاً'}
            </div>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => pickSuggestion(s)} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: '#334155', borderBottom: i < suggestions.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                🔍 {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      {hasSearched && totals.all > 0 && (
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {CATEGORIES.filter(c => c.key === 'all' || totals[c.key] > 0).map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)} style={{ padding: '8px 14px', background: category === c.key ? '#0f4d3a' : '#fff', color: category === c.key ? '#fff' : '#64748b', border: `1px solid ${category === c.key ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                {c.icon} {c.label} ({c.key === 'all' ? totals.all : totals[c.key]})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div style={{ padding: 16 }}>
        {renderResults()}
      </div>

      {/* No search yet */}
      {!hasSearched && (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🔍</div>
          <div style={{ fontSize: 14, color: '#64748b', fontWeight: 700 }}>ابحث في كل شيء:</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>منتجات · متاجر · خدمات · عقارات · وظائف · مفقودات</div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: 80, textAlign: 'center' }}>⏳</div>}>
      <SearchContent />
    </Suspense>
  );
}
