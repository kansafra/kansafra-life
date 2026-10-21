'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const ICON_MAP = {
  'shopping-bag': '🛍️', 'heart-pulse': '❤️', 'graduation-cap': '🎓',
  'landmark': '🕌', 'building-2': '🏢', 'hand-heart': '🎁',
  'newspaper': '📰', 'shield-alert': '🚨', 'store': '🏪',
  'utensils': '🍽️', 'car': '🚗', 'home': '🏠', 'wrench': '🛠️',
  'dumbbell': '⚽', 'camera': '📷', 'book-open': '📚',
  'map': '🗺️', 'briefcase': '💼', 'search': '🔍',
  'users': '👴', 'globe': '🌍', 'trophy': '🏆',
  'banknote': '💱', 'factory': '🏭', 'wifi': '📡',
  'heart': '❤️', 'graduation': '🎓', 'shopping': '🛍️',
};

const FALLBACK_CATEGORIES = [
  { id: 'f1', name: 'المتاجر والتسوق', icon: '🛍️', slug: 'shopping' },
  { id: 'f2', name: 'الصحة والعيادات', icon: '❤️', slug: 'health' },
  { id: 'f3', name: 'التعليم', icon: '🎓', slug: 'education' },
  { id: 'f4', name: 'المساجد', icon: '🕌', slug: 'mosques' },
  { id: 'f5', name: 'البلدية والخدمات العامة', icon: '🏢', slug: 'municipality' },
  { id: 'f6', name: 'الجمعيات والمساعدات', icon: '🎁', slug: 'charities' },
  { id: 'f7', name: 'الأخبار والإعلانات', icon: '📰', slug: 'news' },
  { id: 'f8', name: 'الطوارئ', icon: '🚨', slug: 'emergency' },
  { id: 'f9', name: 'الرياضة', icon: '⚽', slug: 'sports' },
  { id: 'f10', name: 'المواصلات', icon: '🚗', slug: 'transport' },
  { id: 'f11', name: 'ذاكرة كنصفرة', icon: '📷', slug: 'memory' },
  { id: 'f12', name: 'المكتبة', icon: '📚', slug: 'library' },
  { id: 'f13', name: 'السياحة', icon: '🏛️', slug: 'tourism' },
  { id: 'f14', name: 'التوظيف', icon: '💼', slug: 'jobs' },
  { id: 'f15', name: 'العقارات', icon: '🏠', slug: 'realestate' },
  { id: 'f16', name: 'المفقودات', icon: '🔍', slug: 'lostfound' },
  { id: 'f17', name: 'كبار السن', icon: '👴', slug: 'elderly' },
  { id: 'f18', name: 'المغتربون', icon: '🌍', slug: 'expat' },
  { id: 'f19', name: 'المزادات', icon: '🏆', slug: 'auctions' },
  { id: 'f20', name: 'الصرافة والحوالات', icon: '💱', slug: 'exchange' },
  { id: 'f21', name: 'الحرفيون', icon: '🛠️', slug: 'crafts' },
  { id: 'f22', name: 'ورشات التصنيع', icon: '🏭', slug: 'workshops' },
  { id: 'f23', name: 'مزودو الإنترنت', icon: '📡', slug: 'internet' },
];

function resolveIcon(icon) {
  if (!icon) return '📦';
  const k = String(icon).toLowerCase().trim();
  if (ICON_MAP[k]) return ICON_MAP[k];
  if (/\p{Emoji}/u.test(k)) return icon;
  return '📦';
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      try {
        const { data } = await supabase
          .from('service_categories')
          .select('*')
          .eq('is_active', true)
          .eq('is_visible', true)
          .order('sort_order');
        if (data && data.length > 0) setCategories(data);
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.trim();
    return categories.filter(c => (c.name || '').includes(q));
  }, [categories, search]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/" style={{ width: 36, height: 36, background: 'rgba(255,255,255,.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#fff', fontSize: 18 }}>←</Link>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: '#fbbf24' }}>SANAD</div>
            <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>جميع الأقسام</h1>
          </div>
        </div>
        <input
          type="search"
          placeholder="ابحث عن قسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#0f172a', textAlign: 'right', background: '#fff', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 13 }}>⏳ جارٍ التحميل...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 13 }}>لا توجد نتائج لـ "{search}"</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
            {filtered.map(c => (
              <Link
                key={c.id}
                href={`/search?q=${encodeURIComponent(c.name)}`}
                style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 8px', textAlign: 'center', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
              >
                <div style={{ fontSize: 32 }}>{resolveIcon(c.icon)}</div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#334155', lineHeight: 1.4 }}>{c.name}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
