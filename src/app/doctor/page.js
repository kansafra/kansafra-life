'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const SPECIALTIES = [
  { key: 'all', label: 'الكل', icon: '🏥' },
  { key: 'قلب', label: 'قلب', icon: '❤️' },
  { key: 'أطفال', label: 'أطفال', icon: '👶' },
  { key: 'عيون', label: 'عيون', icon: '👁️' },
  { key: 'أسنان', label: 'أسنان', icon: '🦷' },
  { key: 'جلدية', label: 'جلدية', icon: '✨' },
  { key: 'نساء', label: 'نساء وتوليد', icon: '🌸' },
  { key: 'عظام', label: 'عظام', icon: '🦴' },
  { key: 'باطنية', label: 'باطنية', icon: '🩺' },
];

export default function DoctorListPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('all');
  const [sort, setSort] = useState('name');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('entities')
      .select('*')
      .eq('entity_type', 'doctor')
      .eq('is_active', true)
      .order('display_name');
    setDoctors(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = doctors.filter((d) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [d.display_name, d.bio, d.phone].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (specialty !== 'all') {
        const bio = (d.bio || '').toLowerCase();
        if (!bio.includes(specialty.toLowerCase())) return false;
      }
      return true;
    });

    if (sort === 'name') list.sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
    else if (sort === 'newest') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return list;
  }, [doctors, search, specialty, sort]);

  return (
    <div className="sect-page" style={{ paddingBottom: 100 }}>
      <div className="inv-header">
        <button className="inv-back" onClick={() => router.back()} type="button">→</button>
        <span className="inv-title">👨‍⚕️ الأطباء</span>
        <span className="inv-count">{filtered.length}</span>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div className="search-box">
          <span className="ico">⌕</span>
          <input
            type="text"
            placeholder="ابحث عن طبيب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="chips-scroll" style={{ padding: '0 16px 8px' }}>
        {SPECIALTIES.map((s) => (
          <button
            key={s.key}
            className={`chip ${specialty === s.key ? 'active' : ''}`}
            onClick={() => setSpecialty(s.key)}
            type="button"
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div className="chips-scroll" style={{ padding: '0 16px 12px' }}>
        <button className={`chip ${sort === 'name' ? 'active' : ''}`} onClick={() => setSort('name')} type="button">🔤 الاسم</button>
        <button className={`chip ${sort === 'newest' ? 'active' : ''}`} onClick={() => setSort('newest')} type="button">🆕 الأحدث</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty">
          <span className="em">👨‍⚕️</span>
          <p>{search ? 'لا توجد نتائج' : 'لا يوجد أطباء بعد'}</p>
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          {filtered.map((d) => (
            <button
              key={d.id}
              onClick={() => router.push('/doctor/' + encodeURIComponent(d.username || d.display_name))}
              type="button"
              className="debt-card"
              style={{ borderRightColor: '#dc2626', marginBottom: 10, width: '100%', textAlign: 'right', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(220,38,38,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {d.logo_url ? <img src={d.logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover' }} /> : '👨‍⚕️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{d.display_name}</div>
                {d.bio && <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.bio}</div>}
                {d.phone && <div style={{ fontSize: 11, color: 'var(--n-400)', marginTop: 4, direction: 'ltr', textAlign: 'right' }}>📞 {d.phone}</div>}
              </div>
              <span style={{ fontSize: 22, color: 'var(--n-500)' }}>›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
