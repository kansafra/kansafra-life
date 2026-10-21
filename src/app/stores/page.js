'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const TYPE_LABELS = {
  merchant: '🏪 متجر', restaurant: '🍽️ مطعم', doctor: '👨‍⚕️ طبيب',
  pharmacy: '💊 صيدلية', school: '🏫 مدرسة', mosque: '🕌 جامع',
  charity: '🤝 جمعية', sports: '⚽ نادي', hotel: '🏨 فندق',
  office: '📁 مكتب', exchange: '💱 صرافة', transport: '🚗 مواصلات',
  memory: '📸 ذاكرة', municipality: '🏢 بلدية', craftsman: '🛠️ حرفي',
  workshop: '🏭 ورشة', isp: '📡 إنترنت', council: '🏛️ مجلس',
};

const SORT_OPTIONS = [
  { key: 'nearest', label: '📍 الأقرب', icon: '📍' },
  { key: 'rating', label: '⭐ الأعلى تقييماً', icon: '⭐' },
  { key: 'newest', label: '🆕 الأحدث', icon: '🆕' },
  { key: 'name', label: '🔤 الاسم', icon: '🔤' },
];

function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export default function StoresPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [stores, setStores] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState(null);
  const [gettingLoc, setGettingLoc] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nearest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // قراءة موقع المستخدم من localStorage
    try {
      const loc = JSON.parse(localStorage.getItem('sanad_location') || 'null');
      if (loc?.lat && loc?.lng) setUserLoc(loc);
    } catch {}
    loadData();
  }, []);

  async function loadData() {
    if (!supabase) return;
    setLoading(true);
    try {
      // ١. جلب المتاجر المعتمدة فقط
      const { data: ents } = await supabase
        .from('entities')
        .select('*')
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setStores(ents || []);

      // ٢. جلب التقييمات لحساب المتوسط
      try {
        const { data: revs } = await supabase
          .from('reviews')
          .select('entity_id, rating')
          .eq('status', 'approved');
        setReviews(revs || []);
      } catch {}
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function requestLocation() {
    if (!navigator.geolocation) { toastError('المتصفح لا يدعم تحديد الموقع'); return; }
    setGettingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        localStorage.setItem('sanad_location', JSON.stringify(loc));
        success('✅ تم تحديد موقعك');
        setSortBy('nearest');
        setGettingLoc(false);
      },
      (err) => { toastError('تعذر تحديد الموقع: ' + err.message); setGettingLoc(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // حساب التقييم لكل متجر
  const ratingMap = useMemo(() => {
    const map = {};
    reviews.forEach(r => {
      if (!r.entity_id) return;
      if (!map[r.entity_id]) map[r.entity_id] = { total: 0, count: 0 };
      map[r.entity_id].total += Number(r.rating || 0);
      map[r.entity_id].count++;
    });
    const result = {};
    Object.entries(map).forEach(([id, s]) => {
      result[id] = { avg: Number((s.total / s.count).toFixed(1)), count: s.count };
    });
    return result;
  }, [reviews]);

  // قائمة المدن الفريدة
  const cities = useMemo(() => {
    const set = new Set();
    stores.forEach(s => { if (s.city) set.add(s.city); });
    return Array.from(set).sort();
  }, [stores]);

  // قائمة الأنواع الفريدة الموجودة
  const availableTypes = useMemo(() => {
    const set = new Set();
    stores.forEach(s => { if (s.entity_type) set.add(s.entity_type); });
    return Array.from(set);
  }, [stores]);

  // فلترة وترتيب
  const filteredStores = useMemo(() => {
    let list = [...stores];

    // فلترة نوع
    if (typeFilter !== 'all') list = list.filter(s => s.entity_type === typeFilter);
    
    // فلترة مدينة
    if (cityFilter !== 'all') list = list.filter(s => s.city === cityFilter);

    // بحث
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s =>
        (s.display_name || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q)
      );
    }

    // إضافة المسافة والتقييم
    list = list.map(s => {
      let distance = null;
      if (userLoc && s.lat && s.lng) {
        distance = getDistanceKm(userLoc.lat, userLoc.lng, s.lat, s.lng);
      }
      return {
        ...s,
        _distance: distance,
        _rating: ratingMap[s.id]?.avg || 0,
        _reviewCount: ratingMap[s.id]?.count || 0,
      };
    });

    // ترتيب
    if (sortBy === 'nearest') {
      list.sort((a, b) => {
        if (a._distance === null) return 1;
        if (b._distance === null) return -1;
        return a._distance - b._distance;
      });
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b._rating - a._rating);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.display_name || '').localeCompare(b.display_name || '', 'ar'));
    }

    return list;
  }, [stores, typeFilter, cityFilter, search, sortBy, userLoc, ratingMap]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '16px 20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => router.back()} style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>←</button>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, flex: 1 }}>🏪 المتاجر والخدمات</h1>
          <button onClick={() => setShowFilters(!showFilters)} style={{ background: showFilters ? '#fbbf24' : 'rgba(255,255,255,0.15)', color: showFilters ? '#0f4d3a' : '#fff', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            {showFilters ? '✕' : '⚙️'} فلترة
          </button>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="🔍 ابحث عن متجر، مطعم، طبيب..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit' }}
        />

        {/* Location banner */}
        {!userLoc && (
          <button onClick={requestLocation} disabled={gettingLoc} style={{ width: '100%', marginTop: 12, padding: 10, background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.5)', color: '#fbbf24', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: gettingLoc ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            {gettingLoc ? '⏳ جارٍ التحديد...' : '📍 حدد موقعك لعرض الأقرب إليك'}
          </button>
        )}
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>

        {/* Filters Panel */}
        {showFilters && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0', marginBottom: 16 }}>
            
            {/* Type Filter */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#475569', marginBottom: 8 }}>النوع</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setTypeFilter('all')} style={chipStyle(typeFilter === 'all', '#0f4d3a')}>الكل</button>
                {availableTypes.map(t => (
                  <button key={t} onClick={() => setTypeFilter(t)} style={chipStyle(typeFilter === t, '#0f4d3a')}>
                    {TYPE_LABELS[t] || t}
                  </button>
                ))}
              </div>
            </div>

            {/* City Filter */}
            {cities.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#475569', marginBottom: 8 }}>المدينة</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => setCityFilter('all')} style={chipStyle(cityFilter === 'all', '#0ea5e9')}>الكل</button>
                  {cities.map(c => (
                    <button key={c} onClick={() => setCityFilter(c)} style={chipStyle(cityFilter === c, '#0ea5e9')}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Reset Button */}
            {(typeFilter !== 'all' || cityFilter !== 'all' || search) && (
              <button onClick={() => { setTypeFilter('all'); setCityFilter('all'); setSearch(''); }} style={{ width: '100%', padding: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                🗑️ مسح كل الفلاتر
              </button>
            )}
          </div>
        )}

        {/* Sort Bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {SORT_OPTIONS.map(opt => {
            const isActive = sortBy === opt.key;
            const isNearestWithoutLoc = opt.key === 'nearest' && !userLoc;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  if (isNearestWithoutLoc) { requestLocation(); return; }
                  setSortBy(opt.key);
                }}
                style={{
                  background: isActive ? '#0f4d3a' : '#fff',
                  color: isActive ? '#fff' : '#64748b',
                  border: isActive ? '1px solid #0f4d3a' : '1px solid #e2e8f0',
                  padding: '8px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
              >
                {opt.icon} {opt.label}
                {isNearestWithoutLoc && ' (حدد موقعك)'}
              </button>
            );
          })}
        </div>

        {/* Results Count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>
            {filteredStores.length} {filteredStores.length === 1 ? 'نتيجة' : 'نتيجة'}
          </div>
          {userLoc && (
            <div style={{ fontSize: 10, color: '#10b981', fontWeight: 900 }}>
              📍 موقعك محدد
            </div>
          )}
        </div>

        {/* Stores Grid */}
        {filteredStores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>لا توجد نتائج</div>
            <div style={{ fontSize: 12 }}>جرب تغيير الفلاتر أو البحث</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {filteredStores.map(store => (
              <Link
                key={store.id}
                href={`/store/${encodeURIComponent(store.display_name)}`}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Logo/Icon */}
                <div style={{ position: 'relative', paddingTop: '75%', background: 'linear-gradient(135deg, #f0fdf4, #e0f2fe)' }}>
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.display_name}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50 }}>
                      {TYPE_LABELS[store.entity_type]?.split(' ')[0] || '🏪'}
                    </div>
                  )}
                  
                  {/* Rating Badge */}
                  {store._reviewCount > 0 && (
                    <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 3 }}>
                      ⭐ {store._rating}
                    </div>
                  )}

                  {/* Verified Badge */}
                  {store.is_verified && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: '#10b981', color: '#fff', padding: '3px 8px', borderRadius: 8, fontSize: 9, fontWeight: 900 }}>
                      ✅ موثق
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {store.display_name}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700 }}>
                    {TYPE_LABELS[store.entity_type] || store.entity_type || 'نشاط'}
                  </div>

                  {/* Distance + City */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#94a3b8', flexWrap: 'wrap' }}>
                    {store._distance !== null && (
                      <span style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '2px 6px', borderRadius: 4, fontWeight: 900 }}>
                        📍 {store._distance} كم
                      </span>
                    )}
                    {store.city && (
                      <span>🏙️ {store.city}</span>
                    )}
                  </div>

                  {/* Review stars (compact) */}
                  {store._reviewCount > 0 && (
                    <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 900 }}>
                      {'★'.repeat(Math.round(store._rating))} <span style={{ color: '#94a3b8' }}>({store._reviewCount})</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}

function chipStyle(active, color) {
  return {
    background: active ? color : '#f8fafc',
    color: active ? '#fff' : '#475569',
    border: active ? `1px solid ${color}` : '1px solid #e2e8f0',
    padding: '6px 12px',
    borderRadius: 16,
    fontSize: 11,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  };
}
