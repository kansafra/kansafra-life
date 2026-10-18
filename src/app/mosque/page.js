'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function MosquePage() {
  const router = useRouter();
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [prayerTimes, setPrayerTimes] = useState(null);

  useEffect(() => {
    load();
    loadPrayerTimes();
  }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('entities')
        .select('*')
        .eq('is_active', true)
        .eq('entity_type', 'mosque')
        .order('display_name');
      setMosques(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadPrayerTimes() {
    try {
      const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Idlib&country=Syria&method=3');
      const json = await res.json();
      if (json?.data?.timings) setPrayerTimes(json.data.timings);
    } catch (e) { console.error(e); }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return mosques;
    const q = search.trim().toLowerCase();
    return mosques.filter(m => (m.display_name || '').toLowerCase().includes(q) || (m.city || '').toLowerCase().includes(q));
  }, [mosques, search]);

  const prayers = prayerTimes ? [
    { key: 'Fajr', label: 'الفجر', icon: '🌅' },
    { key: 'Dhuhr', label: 'الظهر', icon: '☀️' },
    { key: 'Asr', label: 'العصر', icon: '🌤️' },
    { key: 'Maghrib', label: 'المغرب', icon: '🌇' },
    { key: 'Isha', label: 'العشاء', icon: '🌙' },
  ] : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f4d3a,#075640)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🕌 المساجد</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{filtered.length} مسجد</div>
          </div>
          <div style={{ fontSize: 40 }}>🕌</div>
        </div>

        {/* Prayer Times */}
        {prayers.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>مواقيت الصلاة اليوم — إدلب</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
              {prayers.map(p => (
                <div key={p.key} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16 }}>{p.icon}</div>
                  <div style={{ fontSize: 9, opacity: 0.85, marginTop: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, marginTop: 2, direction: 'ltr' }}>{prayerTimes[p.key]?.slice(0, 5)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث باسم المسجد..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 16 }}><SkeletonList count={3} /></div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0 ? (
            <EmptyState icon="🕌" title={search ? 'لا توجد نتائج' : 'لا توجد مساجد'} description={search ? 'جرّب البحث بكلمات مختلفة' : 'ستظهر المساجد هنا'} actionLabel="← الرئيسية" actionHref="/" />
          ) : filtered.map(m => (
            <div key={m.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                {m.logo_url ? (
                  <img src={m.logo_url} alt="" style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 12, background: 'linear-gradient(135deg,#0f4d3a,#075640)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🕌</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{m.display_name}</div>
                    {m.is_verified && <span style={{ fontSize: 12 }}>✅</span>}
                  </div>
                  {m.bio && <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.5, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.bio}</div>}
                </div>
              </div>
              
              <Link href={`/mosque/${encodeURIComponent(m.display_name)}`} style={{ display: 'block', padding: 10, background: 'rgba(15,77,58,.1)', color: '#0f4d3a', border: '1px solid rgba(15,77,58,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none', marginBottom: 10 }}>👁️ عرض تفاصيل المسجد</Link>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b', marginBottom: 12, flexWrap: 'wrap' }}>
                {m.city && <span>📍 {m.city}</span>}
                {m.address && <span>🏠 {m.address}</span>}
                {m.opening_hours && <span>🕐 {m.opening_hours}</span>}
              </div>
              {m.phone && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`tel:${m.phone}`} style={{ flex: 1, padding: 10, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📞 اتصال</a>
                  <a href={`https://wa.me/${String(m.phone).replace(/\D/g, '').replace(/^0/, '963')}`} target="_blank" rel="noopener" style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,.1)', color: '#059669', border: '1px solid rgba(37,211,102,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📱 واتساب</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div style={{ margin: 16, padding: 14, background: 'rgba(15,77,58,.08)', border: '1px solid rgba(15,77,58,.15)', borderRadius: 12, fontSize: 12, color: '#0f4d3a', fontWeight: 700, lineHeight: 1.7, textAlign: 'center' }}>
        🕌 مواقيت الصلاة حسب تقويم أم القرى — قد تختلف بدقائق حسب الموقع
      </div>
    </div>
  );
}
