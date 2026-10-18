'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function ClubPage() {
  const [tab, setTab] = useState('clubs');
  const [clubs, setClubs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const [c, m, s] = await Promise.all([
        supabase.from('entities').select('*').eq('is_active', true).eq('entity_type', 'sports'),
        supabase.from('sports_matches').select('*').order('match_date', { ascending: false }).limit(30),
        supabase.from('sports_standings').select('*').order('points', { ascending: false }),
      ]);
      setClubs(c.data || []);
      setMatches(m.data || []);
      setStandings(s.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16 }}>
        <div style={{ background: '#ea580c', margin: -16, padding: 20, marginBottom: 16 }}>
          <div style={{ width: 120, height: 20, background: 'rgba(255,255,255,.2)', borderRadius: 6 }} />
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#ea580c,#9a3412)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>⚽ الرياضة</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>الأندية والمباريات والترتيب</div>
          </div>
          <div style={{ fontSize: 40 }}>⚽</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setTab('clubs')} style={{ flex: 1, padding: 12, background: tab === 'clubs' ? '#ea580c' : '#fff', color: tab === 'clubs' ? '#fff' : '#64748b', border: `1px solid ${tab === 'clubs' ? '#ea580c' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🏟️ الأندية</button>
          <button onClick={() => setTab('matches')} style={{ flex: 1, padding: 12, background: tab === 'matches' ? '#ea580c' : '#fff', color: tab === 'matches' ? '#fff' : '#64748b', border: `1px solid ${tab === 'matches' ? '#ea580c' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📅 المباريات</button>
          <button onClick={() => setTab('standings')} style={{ flex: 1, padding: 12, background: tab === 'standings' ? '#ea580c' : '#fff', color: tab === 'standings' ? '#fff' : '#64748b', border: `1px solid ${tab === 'standings' ? '#ea580c' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🏆 الترتيب</button>
        </div>

        {/* Clubs */}
        {tab === 'clubs' && (
          <div>
            {clubs.length === 0 ? (
              <EmptyState icon="⚽" title="لا توجد أندية" description="ستظهر الأندية هنا" actionLabel="← الرئيسية" actionHref="/" />
            ) : clubs.map(c => (
              <div key={c.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  {c.logo_url ? (
                    <img src={c.logo_url} alt="" style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 60, height: 60, borderRadius: 12, background: 'linear-gradient(135deg,#ea580c,#9a3412)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>⚽</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{c.display_name}</div>
                      {c.is_verified && <span style={{ fontSize: 12 }}>✅</span>}
                    </div>
                    {c.bio && <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.5, marginBottom: 4 }}>{c.bio}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b', marginBottom: 12, flexWrap: 'wrap' }}>
                  {c.city && <span>📍 {c.city}</span>}
                  {c.address && <span>🏠 {c.address}</span>}
                  {c.opening_hours && <span>🕐 {c.opening_hours}</span>}
                </div>
                {c.phone && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`tel:${c.phone}`} style={{ flex: 1, padding: 10, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📞 اتصال</a>
                    <a href={`https://wa.me/${String(c.phone).replace(/\D/g, '').replace(/^0/, '963')}`} target="_blank" rel="noopener" style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,.1)', color: '#059669', border: '1px solid rgba(37,211,102,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📱 واتساب</a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Matches */}
        {tab === 'matches' && (
          <div>
            {matches.length === 0 ? (
              <EmptyState icon="📅" title="لا توجد مباريات" description="ستظهر المباريات هنا" actionLabel="← الرئيسية" actionHref="/" />
            ) : matches.map(m => (
              <div key={m.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>📅 {new Date(m.match_date).toLocaleDateString('ar-EG')}</div>
                  <span style={{ background: m.status === 'finished' ? 'rgba(16,185,129,.15)' : 'rgba(251,191,36,.15)', color: m.status === 'finished' ? '#10b981' : '#f59e0b', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{m.status === 'finished' ? 'انتهت' : 'قادمة'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, textAlign: 'right', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{m.home_team}</div>
                  <div style={{ padding: '0 16px', fontSize: 20, fontWeight: 900, color: '#ea580c' }}>{m.home_score !== null ? `${m.home_score} - ${m.away_score}` : 'vs'}</div>
                  <div style={{ flex: 1, textAlign: 'left', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{m.away_team}</div>
                </div>
                {m.location && <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 8 }}>📍 {m.location}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Standings */}
        {tab === 'standings' && (
          <div>
            {standings.length === 0 ? (
              <EmptyState icon="🏆" title="لا يوجد ترتيب" description="سيظهر ترتيب الفرق هنا" actionLabel="← الرئيسية" actionHref="/" />
            ) : (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px 40px 40px 50px', padding: 12, fontSize: 11, fontWeight: 900, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <span>#</span>
                  <span>الفريق</span>
                  <span style={{ textAlign: 'center' }}>لعب</span>
                  <span style={{ textAlign: 'center' }}>فاز</span>
                  <span style={{ textAlign: 'center' }}>خسر</span>
                  <span style={{ textAlign: 'center' }}>نقاط</span>
                </div>
                {standings.map((s, i) => (
                  <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px 40px 40px 50px', padding: 12, borderBottom: i < standings.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ fontWeight: 900, color: i < 3 ? '#ea580c' : '#64748b' }}>{i + 1}</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{s.team_name}</span>
                    <span style={{ textAlign: 'center', color: '#64748b' }}>{s.played || 0}</span>
                    <span style={{ textAlign: 'center', color: '#10b981', fontWeight: 800 }}>{s.won || 0}</span>
                    <span style={{ textAlign: 'center', color: '#ef4444', fontWeight: 800 }}>{s.lost || 0}</span>
                    <span style={{ textAlign: 'center', fontWeight: 900, color: '#ea580c' }}>{s.points || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
