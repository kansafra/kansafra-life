'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewMatch() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({ opponent: '', match_date: '', location: '', competition: '', status: 'upcoming', our_score: 0, their_score: 0, notes: '' });

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
  }, [router]);

  async function submit(e) {
    e.preventDefault();
    if (!f.opponent.trim()) { setError('اسم الفريق المنافس مطلوب'); return; }
    setLoading(true);
    const { error: err } = await supabase.from('sports_matches').insert({
      club_name: entity.display_name,
      opponent: f.opponent.trim(),
      match_date: f.match_date ? new Date(f.match_date).toISOString() : null,
      location: f.location.trim() || null,
      competition: f.competition.trim() || null,
      status: f.status,
      our_score: Number(f.our_score) || 0,
      their_score: Number(f.their_score) || 0,
      notes: f.notes.trim() || null,
    });
    setLoading(false);
    if (err) { setError('تعذّر الحفظ'); return; }
    setDone(true);
  }

  if (!entity) return <div className="trans-empty" style={{ padding: 80 }}>...</div>;
  if (done) return (
    <div className="prod-page">
      <div className="new-service-success">
        <div className="chk-circle">✓</div>
        <h2>تم إضافة المباراة</h2>
        <Link href="/merchant" className="new-service-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>العودة</Link>
      </div>
    </div>
  );

  return (
    <div className="new-prod-page">
      <div className="prod-header"><Link href="/merchant" className="prod-back">→</Link><span className="prod-header-title">مباراة جديدة</span></div>
      <form className="new-prod-form" onSubmit={submit}>
        <div className="new-service-field">
          <label className="new-service-label">الفريق المنافس <span className="req">*</span></label>
          <input className="new-service-input" value={f.opponent} onChange={(e) => setF({ ...f, opponent: e.target.value })} />
        </div>
        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">الحالة</label>
            <select className="new-service-select" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              <option value="upcoming">قادمة</option>
              <option value="live">مباشر</option>
              <option value="finished">انتهت</option>
            </select>
          </div>
          <div className="new-service-field">
            <label className="new-service-label">البطولة</label>
            <input className="new-service-input" value={f.competition} onChange={(e) => setF({ ...f, competition: e.target.value })} />
          </div>
        </div>
        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">التاريخ والوقت</label>
            <input className="new-service-input" type="datetime-local" value={f.match_date} onChange={(e) => setF({ ...f, match_date: e.target.value })} />
          </div>
          <div className="new-service-field">
            <label className="new-service-label">الملعب</label>
            <input className="new-service-input" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
          </div>
        </div>
        {f.status !== 'upcoming' && (
          <div className="new-prod-row">
            <div className="new-service-field">
              <label className="new-service-label">أهدافنا</label>
              <input className="new-service-input" type="number" value={f.our_score} onChange={(e) => setF({ ...f, our_score: e.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">أهدافهم</label>
              <input className="new-service-input" type="number" value={f.their_score} onChange={(e) => setF({ ...f, their_score: e.target.value })} />
            </div>
          </div>
        )}
        {error && <div style={{ color: '#dc2626', padding: 12, background: 'rgba(220,38,38,.1)', borderRadius: 12, fontSize: 13, fontWeight: 700 }}>{error}</div>}
        <button className="new-service-submit" type="submit" disabled={loading}>{loading ? '...' : '✓ إضافة'}</button>
      </form>
    </div>
  );
}
