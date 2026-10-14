'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const TYPES = [
  { key: 'all', label: 'الكل', icon: '🏆' },
  { key: 'رياضي', label: 'رياضي', icon: '⚽' },
  { key: 'ثقافي', label: 'ثقافي', icon: '📚' },
  { key: 'اجتماعي', label: 'اجتماعي', icon: '🤝' },
  { key: 'فني', label: 'فني', icon: '🎨' },
];

export default function ClubListPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('entities')
      .select('*')
      .in('entity_type', ['sports', 'club'])
      .eq('is_active', true)
      .order('display_name');
    setClubs(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return clubs.filter((c) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [c.display_name, c.bio].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (type !== 'all') {
        const bio = (c.bio || '').toLowerCase();
        if (!bio.includes(type.toLowerCase())) return false;
      }
      return true;
    });
  }, [clubs, search, type]);

  return (
    <div className="sect-page" style={{ paddingBottom: 100 }}>
      <div className="inv-header">
        <button className="inv-back" onClick={() => router.back()} type="button">→</button>
        <span className="inv-title">🏆 الأندية</span>
        <span className="inv-count">{filtered.length}</span>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div className="search-box">
          <span className="ico">⌕</span>
          <input type="text" placeholder="ابحث عن نادي..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="chips-scroll" style={{ padding: '0 16px 12px' }}>
        {TYPES.map((t) => (
          <button key={t.key} className={`chip ${type === t.key ? 'active' : ''}`} onClick={() => setType(t.key)} type="button">
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty">
          <span className="em">🏆</span>
          <p>{search ? 'لا توجد نتائج' : 'لا توجد أندية بعد'}</p>
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push('/club/' + encodeURIComponent(c.username || c.display_name))}
              type="button"
              className="debt-card"
              style={{ borderRightColor: '#f59e0b', marginBottom: 10, width: '100%', textAlign: 'right', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {c.logo_url ? <img src={c.logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover' }} /> : '🏆'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{c.display_name}</div>
                {c.bio && <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.bio}</div>}
              </div>
              <span style={{ fontSize: 22, color: 'var(--n-500)' }}>›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
