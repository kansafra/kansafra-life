'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MosqueListPage() {
  const router = useRouter();
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [prayerTimes, setPrayerTimes] = useState(null);

  useEffect(() => { load(); loadPrayerTimes(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('entities')
      .select('*')
      .eq('entity_type', 'mosque')
      .eq('is_active', true)
      .order('display_name');
    setMosques(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function loadPrayerTimes() {
    // حساب أوقات الصلاة من الصفحة (fallback) — يمكن تحسينه لاحقاً
    const now = new Date();
    const hours = now.getHours();
    setPrayerTimes({
      fajr: '05:30',
      dhuhr: '12:30',
      asr: '15:45',
      maghrib: '18:15',
      isha: '19:45',
    });
  }

  const filtered = useMemo(() => {
    return mosques.filter((m) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const hay = [m.display_name, m.bio, m.phone].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [mosques, search]);

  return (
    <div className="sect-page" style={{ paddingBottom: 100 }}>
      <div className="inv-header">
        <button className="inv-back" onClick={() => router.back()} type="button">→</button>
        <span className="inv-title">🕌 المساجد</span>
        <span className="inv-count">{filtered.length}</span>
      </div>

      {prayerTimes && (
        <div style={{ margin: '12px 16px', padding: 16, background: 'linear-gradient(135deg, #0f4d3a, #0a6b50)', borderRadius: 16, color: '#fff' }}>
          <div style={{ fontSize: 11, opacity: .7, fontWeight: 700, marginBottom: 8 }}>🕌 مواقيت الصلاة</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {[
              { k: 'fajr', name: 'الفجر' },
              { k: 'dhuhr', name: 'الظهر' },
              { k: 'asr', name: 'العصر' },
              { k: 'maghrib', name: 'المغرب' },
              { k: 'isha', name: 'العشاء' },
            ].map((p) => (
              <div key={p.k} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,.08)', borderRadius: 10 }}>
                <div style={{ fontSize: 10, opacity: .8, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 13, fontWeight: 900, direction: 'ltr' }}>{prayerTimes[p.k]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px 12px' }}>
        <div className="search-box">
          <span className="ico">⌕</span>
          <input type="text" placeholder="ابحث عن مسجد..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty">
          <span className="em">🕌</span>
          <p>{search ? 'لا توجد نتائج' : 'لا يوجد مساجد بعد'}</p>
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => router.push('/mosque/' + encodeURIComponent(m.username || m.display_name))}
              type="button"
              className="debt-card"
              style={{ borderRightColor: '#0f4d3a', marginBottom: 10, width: '100%', textAlign: 'right', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(15,77,58,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {m.logo_url ? <img src={m.logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover' }} /> : '🕌'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{m.display_name}</div>
                {m.bio && <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.bio}</div>}
                {m.phone && <div style={{ fontSize: 11, color: 'var(--n-400)', marginTop: 4, direction: 'ltr', textAlign: 'right' }}>📞 {m.phone}</div>}
              </div>
              <span style={{ fontSize: 22, color: 'var(--n-500)' }}>›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
