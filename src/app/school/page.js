'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function SchoolPage() {
  const router = useRouter();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('entities')
        .select('*')
        .eq('is_active', true)
        .eq('entity_type', 'school')
        .order('display_name');
      setSchools(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = schools;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s => (s.display_name || '').toLowerCase().includes(q) || (s.bio || '').toLowerCase().includes(q) || (s.city || '').toLowerCase().includes(q));
    }
    return list;
  }, [schools, search]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🎓 التعليم</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{filtered.length} مدرسة ومعهد</div>
          </div>
          <div style={{ fontSize: 40 }}>🎓</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🏫</div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155' }}>المدارس</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>📚</div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155' }}>الدروس</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>📝</div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155' }}>التسجيل</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 16px' }}>
        <input type="text" placeholder="🔍 ابحث باسم المدرسة..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 16 }}><SkeletonList count={3} /></div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0 ? (
            <EmptyState icon="🎓" title={search ? 'لا توجد نتائج' : 'لا توجد مدارس بعد'} description={search ? 'جرّب البحث بكلمات مختلفة' : 'ستظهر المدارس والمعاهد هنا قريباً'} actionLabel="← الرئيسية" actionHref="/" />
          ) : filtered.map(s => (
            <div key={s.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                {s.logo_url ? (
                  <img src={s.logo_url} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🏫</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{s.display_name}</div>
                    {s.is_verified && <span style={{ fontSize: 12 }}>✅</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#7c3aed', fontWeight: 800 }}>🎓 مدرسة</div>
                  {s.bio && <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.bio}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b', marginBottom: 12, flexWrap: 'wrap' }}>
                {s.city && <span>📍 {s.city}</span>}
                {s.address && <span>🏠 {s.address}</span>}
                {s.opening_hours && <span>🕐 {s.opening_hours}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/school/${encodeURIComponent(s.display_name)}`} style={{ flex: 1, padding: 10, background: 'rgba(124,58,237,.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>👁️ عرض</Link>
                {s.phone && (
                  <a href={`tel:${s.phone}`} style={{ flex: 1, padding: 10, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📞 اتصال</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
