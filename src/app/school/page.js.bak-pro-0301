'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const STAGES = [
  { key: 'all', label: 'الكل', icon: '🏫' },
  { key: 'ابتدائي', label: 'ابتدائي', icon: '📚' },
  { key: 'إعدادي', label: 'إعدادي', icon: '📖' },
  { key: 'ثانوي', label: 'ثانوي', icon: '🎓' },
  { key: 'روضة', label: 'روضة', icon: '🧸' },
  { key: 'معهد', label: 'معهد', icon: '🏛️' },
];

export default function SchoolListPage() {
  const router = useRouter();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('entities')
      .select('*')
      .eq('entity_type', 'school')
      .eq('is_active', true)
      .order('display_name');
    setSchools(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return schools.filter((s) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [s.display_name, s.bio, s.phone].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (stage !== 'all') {
        const bio = (s.bio || '').toLowerCase();
        if (!bio.includes(stage.toLowerCase())) return false;
      }
      return true;
    });
  }, [schools, search, stage]);

  return (
    <div className="sect-page" style={{ paddingBottom: 100 }}>
      <div className="inv-header">
        <button className="inv-back" onClick={() => router.back()} type="button">→</button>
        <span className="inv-title">🏫 المدارس</span>
        <span className="inv-count">{filtered.length}</span>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div className="search-box">
          <span className="ico">⌕</span>
          <input type="text" placeholder="ابحث عن مدرسة..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="chips-scroll" style={{ padding: '0 16px 12px' }}>
        {STAGES.map((st) => (
          <button key={st.key} className={`chip ${stage === st.key ? 'active' : ''}`} onClick={() => setStage(st.key)} type="button">
            {st.icon} {st.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty">
          <span className="em">🏫</span>
          <p>{search ? 'لا توجد نتائج' : 'لا يوجد مدارس بعد'}</p>
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => router.push('/school/' + encodeURIComponent(s.username || s.display_name))}
              type="button"
              className="debt-card"
              style={{ borderRightColor: '#0284c7', marginBottom: 10, width: '100%', textAlign: 'right', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(2,132,199,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {s.logo_url ? <img src={s.logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover' }} /> : '🏫'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{s.display_name}</div>
                {s.bio && <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.bio}</div>}
                {s.phone && <div style={{ fontSize: 11, color: 'var(--n-400)', marginTop: 4, direction: 'ltr', textAlign: 'right' }}>📞 {s.phone}</div>}
              </div>
              <span style={{ fontSize: 22, color: 'var(--n-500)' }}>›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
