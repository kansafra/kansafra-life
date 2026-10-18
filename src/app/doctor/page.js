'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const SPECIALTIES = {
  general: { label: 'طب عام', icon: '🩺' },
  dental: { label: 'أسنان', icon: '🦷' },
  pediatric: { label: 'أطفال', icon: '👶' },
  cardiology: { label: 'قلبية', icon: '❤️' },
  dermatology: { label: 'جلدية', icon: '🧴' },
  ophthalmology: { label: 'عيون', icon: '👁️' },
  ortho: { label: 'عظام', icon: '🦴' },
  gynecology: { label: 'نسائية', icon: '👩' },
  internal: { label: 'باطنية', icon: '🫀' },
  other: { label: 'أخرى', icon: '⚕️' },
};

export default function DoctorPage() {
  const router = useRouter();
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('entities')
        .select('*')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .in('entity_type', ['doctor', 'pharmacy']);
      setEntities(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = entities;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(e =>
        (e.display_name || '').toLowerCase().includes(q) ||
        (e.bio || '').toLowerCase().includes(q) ||
        (e.city || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [entities, search]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#dc2626,#991b1b)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>❤️ الصحة والعيادات</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{filtered.length} طبيب ومركز</div>
          </div>
          <div style={{ fontSize: 40 }}>🩺</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <Link href="/my-appointments" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, textDecoration: 'none', color: 'inherit', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>📅</div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155' }}>مواعيدي</div>
        </Link>
        <Link href="/oncall" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, textDecoration: 'none', color: 'inherit', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🌙</div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155' }}>المناوبات</div>
        </Link>
        <Link href="/blood" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, textDecoration: 'none', color: 'inherit', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🩸</div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155' }}>التبرع بالدم</div>
        </Link>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 16px' }}>
        <input type="text" placeholder="🔍 ابحث باسم الطبيب أو التخصص..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 16 }}><SkeletonList count={3} /></div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0 ? (
            <EmptyState icon="🩺" title={search ? 'لا توجد نتائج' : 'لا يوجد أطباء بعد'} description={search ? 'جرّب البحث بكلمات مختلفة' : 'ستظهر العيادات والأطباء هنا قريباً'} actionLabel="← الرئيسية" actionHref="/" />
          ) : filtered.map(d => (
            <div key={d.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                {d.logo_url ? (
                  <img src={d.logo_url} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                    {d.entity_type === 'pharmacy' ? '💊' : '🩺'}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{d.display_name}</div>
                    {d.is_verified && <span style={{ fontSize: 12 }}>✅</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#dc2626', fontWeight: 800 }}>
                    {d.entity_type === 'pharmacy' ? '💊 صيدلية' : '🩺 عيادة'}
                  </div>
                  {d.bio && <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.bio}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b', marginBottom: 12, flexWrap: 'wrap' }}>
                {d.city && <span>📍 {d.city}</span>}
                {d.opening_hours && <span>🕐 {d.opening_hours}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/doctor/${encodeURIComponent(d.display_name)}`} style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📅 احجز الآن</Link>
                {d.phone && (
                  <>
                    <a href={`tel:${d.phone}`} style={{ flex: 1, padding: 10, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📞 اتصال</a>
                    <a href={`https://wa.me/${String(d.phone).replace(/\D/g, '').replace(/^0/, '963')}`} target="_blank" rel="noopener" style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,.1)', color: '#059669', border: '1px solid rgba(37,211,102,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📱 واتساب</a>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Banner */}
      <div style={{ margin: '16px', padding: 14, background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.3)', borderRadius: 12, fontSize: 12, color: '#92400e', fontWeight: 700, lineHeight: 1.7 }}>
        💡 في حالة الطوارئ، اتصل مباشرة بأرقام الطوارئ من صفحة <Link href="/sos" style={{ color: '#dc2626', fontWeight: 900, textDecoration: 'underline' }}>الطوارئ</Link>
      </div>
    </div>
  );
}
