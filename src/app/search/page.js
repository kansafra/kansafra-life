'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { detectIntent, rankResults, getTimeBasedSuggestions } from '@/lib/smartSearch';

const TYPE_LABELS = {
  merchant: '🏪 متجر', restaurant: '🍽️ مطعم', doctor: '👨‍⚕️ طبيب',
  pharmacy: '💊 صيدلية', school: '🏫 مدرسة', mosque: '🕌 جامع',
  charity: '🤝 جمعية', sports: '⚽ نادي', hotel: '🏨 فندق',
  office: '📁 مكتب', exchange: '💱 صرافة', transport: '🚗 مواصلات',
  memory: '📸 ذاكرة', municipality: '🏢 بلدية', craftsman: '🛠️ حرفي',
  workshop: '🏭 ورشة', isp: '📡 إنترنت', council: '🏛️ مجلس',
};

const TABS = [
  { key: 'all', label: 'الكل', icon: '🔍' },
  { key: 'stores', label: 'المتاجر', icon: '🏪' },
  { key: 'products', label: 'المنتجات', icon: '📦' },
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [allStores, setAllStores] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [intent, setIntent] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
    setIntent(detectIntent(initialQuery));
  }, [initialQuery]);

  async function loadData() {
    if (!supabase) return;
    setLoading(true);
    try {
      const [ents, prods] = await Promise.all([
        supabase.from('entities').select('*').eq('approval_status', 'approved').eq('is_active', true),
        supabase.from('products').select('*').eq('is_active', true),
      ]);
      setAllStores(ents.data || []);
      setAllProducts(prods.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const { stores, products } = useMemo(() => {
    if (!initialQuery.trim()) return { stores: [], products: [] };
    const rankedStores = rankResults(allStores, initialQuery, ['display_name', 'description', 'city', 'entity_type', 'address']);
    const rankedProducts = rankResults(allProducts, initialQuery, ['title', 'description']);
    return { stores: rankedStores.slice(0, 30), products: rankedProducts.slice(0, 30) };
  }, [allStores, allProducts, initialQuery]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const totalResults = stores.length + products.length;
  const suggestions = getTimeBasedSuggestions();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '16px 20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => router.push('/')} style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>←</button>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, flex: 1 }}>🔍 البحث الذكي</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', background: '#fff', borderRadius: 12, padding: '6px 6px 6px 16px', alignItems: 'center' }}>
          <input
            type="search"
            placeholder="اسأل بأي طريقة... (بدي مطعم، دكتور، شغل...)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            style={{ flex: 1, padding: 10, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#0f172a', background: 'transparent', textAlign: 'right' }}
          />
          <button type="submit" style={{ padding: '10px 18px', background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>بحث</button>
        </form>

        {intent && initialQuery && (
          <div style={{ marginTop: 12, background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 800 }}>
            💡 يبدو أنك تبحث عن: <strong style={{ color: '#fbbf24' }}>{intent.icon} {intent.label}</strong>
          </div>
        )}

        {!loading && initialQuery && (
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.9 }}>
            نتائج البحث عن "<strong>{initialQuery}</strong>": {totalResults} نتيجة
          </div>
        )}
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        {loading && <div style={{ textAlign: 'center', padding: 60 }}><div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div><div style={{ color: '#64748b' }}>جارٍ البحث...</div></div>}

        {!loading && !initialQuery && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{suggestions.emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{suggestions.greeting}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{suggestions.prompt}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 20 }}>
              {suggestions.chips.map((chip, i) => (
                <Link key={i} href={`/search?q=${encodeURIComponent(chip.query)}`} style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: 12, textAlign: 'center', textDecoration: 'none', color: '#0f4d3a', fontSize: 13, fontWeight: 900 }}>
                  {chip.label}
                </Link>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              💡 جرب البحث بلغتك العادية: "بدي دكتور أسنان"، "مطعم قريب"، "بدي شغل"
            </div>
          </div>
        )}

        {!loading && initialQuery && totalResults === 0 && (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>😕</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>لا توجد نتائج</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>جرّب كلمة أخرى أو تصفح الأقسام</div>
            <Link href="/categories" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>تصفح الأقسام</Link>
          </div>
        )}

        {!loading && initialQuery && totalResults > 0 && (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
              {TABS.map(tab => {
                const count = tab.key === 'all' ? totalResults : tab.key === 'stores' ? stores.length : products.length;
                const isActive = activeTab === tab.key;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ background: isActive ? '#0f4d3a' : '#fff', color: isActive ? '#fff' : '#475569', border: isActive ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                    {tab.icon} {tab.label} ({count})
                  </button>
                );
              })}
            </div>

            {(activeTab === 'all' || activeTab === 'stores') && stores.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>🏪 المتاجر ({stores.length})</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {stores.map(s => (
                    <Link key={s.id} href={`/store/${encodeURIComponent(s.display_name)}`} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ position: 'relative', paddingTop: '70%', background: 'linear-gradient(135deg, #f0fdf4, #e0f2fe)' }}>
                        {s.logo_url ? <img src={s.logo_url} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>{(TYPE_LABELS[s.entity_type] || '🏪').split(' ')[0]}</div>}
                      </div>
                      <div style={{ padding: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.display_name}</div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{TYPE_LABELS[s.entity_type] || s.entity_type}{s.city && ` · 📍 ${s.city}`}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'products') && products.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>📦 المنتجات ({products.length})</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                  {products.map(p => {
                    const price = Number(p.price) || 0;
                    const disc = Number(p.discount_percent) || 0;
                    const finalPrice = Math.round(price - (price * disc / 100));
                    return (
                      <Link key={p.id} href={`/product/${p.id}`} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', textDecoration: 'none', color: 'inherit' }}>
                        {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: 110, objectFit: 'cover' }} /> : <div style={{ height: 110, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>}
                        <div style={{ padding: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#0f4d3a' }}>{finalPrice.toLocaleString()}</div>
                            <div style={{ fontSize: 9, color: '#64748b' }}>{p.currency || 'SYP'}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
