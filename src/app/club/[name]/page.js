'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ClubPage() {
  const params = useParams();
  const clubName = decodeURIComponent(params?.name || '');
  const [tab, setTab] = useState('squad');
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubName) return;
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const [p, m, s] = await Promise.all([
        supabase.from('sports_players').select('*').eq('club_name', clubName).order('jersey_number', { ascending: true }),
        supabase.from('sports_matches').select('*').eq('club_name', clubName).order('match_date', { ascending: false }),
        supabase.from('sports_standings').select('*').order('points', { ascending: false }),
      ]);
      setPlayers(Array.isArray(p.data) ? p.data : []);
      setMatches(Array.isArray(m.data) ? m.data : []);
      setStandings(Array.isArray(s.data) ? s.data : []);
      setLoading(false);
    }
    load();
  }, [clubName]);

  const wins = matches.filter((m) => m.status === 'finished' && Number(m.our_score) > Number(m.their_score)).length;

  return (
    <div className="doc-page">
      <header className="sports-hero">
        <div className="doc-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
            <span style={{ letterSpacing: 3, fontSize: 11, fontWeight: 800, opacity: .7 }}>CLUB</span>
          </div>
          <h1 className="doc-title">⚽ {clubName}</h1>
          <p className="doc-sub">{players.length} لاعب · {matches.length} مباراة · {wins} فوز</p>
        </div>
      </header>

      <div className="store-cat-scroll" style={{ paddingTop: 14 }}>
        <button className={`store-cat-chip ${tab === 'squad' ? 'active' : ''}`} onClick={() => setTab('squad')} type="button">👥 الفريق ({players.length})</button>
        <button className={`store-cat-chip ${tab === 'matches' ? 'active' : ''}`} onClick={() => setTab('matches')} type="button">⚽ المباريات ({matches.length})</button>
        <button className={`store-cat-chip ${tab === 'standings' ? 'active' : ''}`} onClick={() => setTab('standings')} type="button">🏆 الترتيب</button>
      </div>

      {loading ? (
        <div className="trans-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : tab === 'squad' ? (
        players.length === 0 ? (
          <div className="trans-empty"><span className="em">👥</span><p>لم يُضف اللاعبون بعد</p></div>
        ) : (
          <div className="players-grid">
            {players.map((p) => (
              <div key={p.id} className="player-card">
                {p.jersey_number && <div className="player-number">{p.jersey_number}</div>}
                <div className="player-photo">
                  {p.photo_url ? <img src={p.photo_url} alt="" /> : '⚽'}
                </div>
                <div className="player-name">{p.full_name}</div>
                <div className="player-position">{p.position || 'لاعب'}</div>
                <div className="player-stats">
                  <div className="player-stat">
                    <div className="player-stat-val">{p.matches || 0}</div>
                    <div className="player-stat-lbl">مباريات</div>
                  </div>
                  <div className="player-stat">
                    <div className="player-stat-val">{p.goals || 0}</div>
                    <div className="player-stat-lbl">أهداف</div>
                  </div>
                  <div className="player-stat">
                    <div className="player-stat-val">{p.assists || 0}</div>
                    <div className="player-stat-lbl">صناعة</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === 'matches' ? (
        <div className="files-list">
          {matches.length === 0 ? (
            <div className="trans-empty"><span className="em">⚽</span><p>لا توجد مباريات</p></div>
          ) : (
            matches.map((m) => {
              const statusLabel = m.status === 'finished' ? 'انتهت' : m.status === 'live' ? 'مباشر' : 'قادمة';
              return (
                <div key={m.id} className="match-card">
                  <div className="match-head">
                    {m.competition && <span className="match-competition">{m.competition}</span>}
                    <span className={`match-status ${m.status}`}>{statusLabel}</span>
                  </div>
                  <div className="match-teams">
                    <div className="match-team">{clubName}</div>
                    {m.status === 'upcoming' ? (
                      <span className="match-vs">VS</span>
                    ) : (
                      <span className="match-score">{m.our_score} - {m.their_score}</span>
                    )}
                    <div className="match-team">{m.opponent}</div>
                  </div>
                  <div className="match-meta">
                    {m.match_date && <span>📅 {new Date(m.match_date).toLocaleDateString('ar-EG')}</span>}
                    {m.location && <span>📍 {m.location}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="standings-table">
          <div className="standings-head">
            <span>#</span><span style={{ textAlign: 'right', paddingRight: 6 }}>الفريق</span>
            <span>لعب</span><span>فاز</span><span>تعادل</span><span>نقاط</span>
          </div>
          {standings.length === 0 ? (
            <div className="trans-empty" style={{ padding: 40 }}><p>لا يوجد ترتيب</p></div>
          ) : (
            standings.map((s, i) => (
              <div key={s.id} className={`standings-row ${i < 3 ? 'top' : ''}`}>
                <span className="standings-pos">{i + 1}</span>
                <span className="standings-team">{s.team_name}</span>
                <span>{s.played || 0}</span>
                <span>{s.won || 0}</span>
                <span>{s.drawn || 0}</span>
                <span className="standings-pts">{s.points || 0}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
