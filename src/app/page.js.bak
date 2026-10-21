'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import HijriDate from '@/components/HijriDate';
import PrayerBar from '@/components/PrayerBar';
import NewsTicker from '@/components/NewsTicker';
import { SkeletonList } from '@/components/Skeleton';

const ICON_MAP = {
  "shopping-bag": "🛍️", "heart-pulse": "❤️", "graduation-cap": "🎓",
  "landmark": "🕌", "building-2": "🏢", "hand-heart": "🎁",
  "newspaper": "📰", "shield-alert": "🚨", "store": "🏪",
  "utensils": "🍽️", "car": "🚗", "home": "🏠", "wrench": "🛠️",
  "dumbbell": "⚽", "camera": "📷", "book-open": "📚",
  "map": "🗺️", "briefcase": "💼", "search": "🔍",
  "users": "👴", "globe": "🌍", "trophy": "🏆",
  "banknote": "💱", "factory": "🏭", "wifi": "📡",
  "heart": "❤️", "graduation": "🎓", "shopping": "🛍️"
};

function resolveIcon(icon) {
  if (!icon) return '📦';
  const k = String(icon).toLowerCase().trim();
  if (ICON_MAP[k]) return ICON_MAP[k];
  if (k.length <= 4) return icon; // If it's already an emoji
  return '📦';
}

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      setUser(c);
    } catch {}
    load();
  }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [cats, prods, ents, ann] = await Promise.all([
        supabase.from('service_categories').select('*').eq('is_active', true).eq('is_visible', true).order('sort_order'),
        supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(10),
        supabase.from('entities').select('id, display_name, entity_type, logo_url, city, is_verified').eq('is_active', true).eq('approval_status', 'approved').in('entity_type', ['merchant', 'restaurant', 'craftsman']).limit(8),
        supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      setCategories(cats.data || []);
      setProducts(prods.data || []);
      setStores(ents.data || []);
      setAnnouncement(ann.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  }

  const topCategories = categories.slice(0, 8);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ background: 'linear-gradient(135deg,#0f4d3a,#075640)', padding: '40px 20px', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <div style={{ height: 60, background: 'rgba(255,255,255,.1)', borderRadius: 12 }} />
        </div>
        <div style={{ padding: 16 }}><SkeletonList count={3} /></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      {/* ═══ Hero Header ═══ */}
      <div style={{ background: 'linear-gradient(135deg,#0f4d3a,#075640)', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, padding: '20px 20px 32px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, left: -40, width: 180, height: 180, background: 'rgba(251,191,36,.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 3, color: '#fbbf24', marginBottom: 4 }}>S A N A D</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>سند</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/notifications" style={{ width: 40, height: 40, background: 'rgba(255,255,255,.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, textDecoration: 'none', position: 'relative' }}>🔔</Link>
            {user ? (
              <Link href="/customer" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', padding: '10px 16px', borderRadius: 20, fontSize: 12, fontWeight: 900, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>👤 حسابي</Link>
            ) : (
              <Link href="/login" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '10px 16px', borderRadius: 20, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>دخول</Link>
            )}
            {/* زر الإدارة المخفي - يظهر كأيقونة ترس صغيرة */}
            <Link href="/admin/login" title="دخول الإدارة" style={{ width: 40, height: 40, background: 'rgba(255,255,255,.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, textDecoration: 'none', color: 'rgba(255,255,255,.6)' }}>⚙️</Link>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6, lineHeight: 1.3 }}>أهلاً بك في <span style={{ color: '#fbbf24' }}>كنصفرة</span></h1>
          <p style={{ fontSize: 13, opacity: 0.85 }}>كل خدمات مجتمعك بين يديك</p>
        </div>

        <div style={{ marginBottom: 20, position: 'relative', zIndex: 1 }}>
          <HijriDate compact style={{ color: 'rgba(255,255,255,.9)', fontSize: 12 }} />
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 14, padding: '6px 6px 6px 16px', position: 'relative', zIndex: 1, boxShadow: '0 10px 30px rgba(0,0,0,.15)' }}>
          <span style={{ fontSize: 18, color: '#94a3b8', marginLeft: 8 }}>⌕</span>
          <input type="text" placeholder="ابحث عن منتج، خدمة، متجر..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, padding: 12, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#0f172a', textAlign: 'right' }} />
          <button type="submit" style={{ padding: '12px 20px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>بحث</button>
        </form>
      </div>

      {/* Prayer Times */}
      <div style={{ marginTop: -16, position: 'relative', zIndex: 2, padding: '0 16px' }}>
        <PrayerBar />
      </div>

      {/* Announcement */}
      {announcement && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(251,191,36,.15), rgba(245,158,11,.1))', border: '1px solid rgba(251,191,36,.3)', borderRadius: 14, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 20 }}>📢</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#92400e', marginBottom: 2 }}>{announcement.title}</div>
              <div style={{ fontSize: 11.5, color: '#78350f', lineHeight: 1.6 }}>{announcement.content?.slice(0, 100)}...</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12 }}><NewsTicker /></div>

      {/* Quick Actions */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { href: '/sos', icon: '🚨', label: 'طوارئ', color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
            { href: '/stores', icon: '🛍️', label: 'متاجر', color: '#10b981', bg: 'rgba(16,185,129,.1)' },
            { href: '/doctor', icon: '🩺', label: 'أطباء', color: '#dc2626', bg: 'rgba(220,38,38,.1)' },
            { href: '/jobs', icon: '💼', label: 'وظائف', color: '#059669', bg: 'rgba(5,150,105,.1)' },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ background: a.bg, border: 'none', borderRadius: 14, padding: '14px 8px', textAlign: 'center', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 26 }}>{a.icon}</div>
              <div style={{ fontSize: 10.5, fontWeight: 900, color: a.color }}>{a.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      {topCategories.length > 0 && (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>الأقسام</h2>
            <Link href="/categories" style={{ fontSize: 11.5, fontWeight: 800, color: '#0f4d3a', textDecoration: 'none' }}>عرض الكل ←</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {topCategories.map(c => (
              <Link key={c.id} href={`/search?q=${encodeURIComponent(c.name)}`} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '12px 6px', textAlign: 'center', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 24 }}>{resolveIcon(c.icon)}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#334155', lineHeight: 1.3, textAlign: 'center' }}>{c.name}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Stores */}
      {stores.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>🏪 متاجر مميزة</h2>
            <Link href="/stores" style={{ fontSize: 11.5, fontWeight: 800, color: '#0f4d3a', textDecoration: 'none' }}>المزيد ←</Link>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {stores.map(s => (
              <Link key={s.id} href={`/store/${encodeURIComponent(s.display_name)}`} style={{ flexShrink: 0, width: 140, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 12, textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
                {s.logo_url ? <img src={s.logo_url} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover' }} /> : <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏪</div>}
                <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{s.display_name}</div>
                {s.is_verified && <div style={{ fontSize: 9.5, color: '#10b981', fontWeight: 800 }}>✅ موثق</div>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Latest Products */}
      {products.length > 0 && (
        <div style={{ padding: '0 16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>🛍️ أحدث المنتجات</h2>
            <Link href="/stores" style={{ fontSize: 11.5, fontWeight: 800, color: '#0f4d3a', textDecoration: 'none' }}>المزيد ←</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {products.map(p => {
              const price = Number(p.price) || 0;
              const disc = Number(p.discount_percent) || 0;
              const finalPrice = Math.round(price - (price * disc / 100));
              return (
                <Link key={p.id} href={`/product/${p.id}`} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
                  {p.image_url ? <img src={p.image_url} alt={p.title} loading="lazy" style={{ width: '100%', height: 110, objectFit: 'cover' }} /> : <div style={{ height: 110, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>}
                  <div style={{ padding: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{p.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
    </div>
  );
}
