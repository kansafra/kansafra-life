'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const DEFAULT_PRAYERS = [
  { name: 'Fajr', ar: 'الفجر', time: '05:30' },
  { name: 'Dhuhr', ar: 'الظهر', time: '12:30' },
  { name: 'Asr', ar: 'العصر', time: '15:45' },
  { name: 'Maghrib', ar: 'المغرب', time: '18:15' },
  { name: 'Isha', ar: 'العشاء', time: '19:45' },
];

export default function MosquePage() {
  const params = useParams();
  const mosqueName = decodeURIComponent(params?.name || '');
  const [tab, setTab] = useState('prayer');
  const [lessons, setLessons] = useState([]);
  const [circles, setCircles] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mosqueName) return;
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const [l, c, d] = await Promise.all([
        supabase.from('lessons').select('*').eq('mosque_name', mosqueName).order('created_at', { ascending: false }).limit(20),
        supabase.from('circles').select('*').eq('mosque_name', mosqueName).order('created_at', { ascending: false }),
        supabase.from('donations').select('*').eq('recipient_name', mosqueName).order('created_at', { ascending: false }).limit(20),
      ]);
      setLessons(Array.isArray(l.data) ? l.data : []);
      setCircles(Array.isArray(c.data) ? c.data : []);
      setDonations(Array.isArray(d.data) ? d.data : []);
      setLoading(false);
    }
    load();
  }, [mosqueName]);

  return (
    <div className="doc-page">
      <header className="mosque-hero">
        <div className="doc-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
            <span style={{ letterSpacing: 3, fontSize: 11, fontWeight: 800, opacity: .7 }}>MOSQUE</span>
          </div>
          <h1 className="doc-title">{mosqueName}</h1>
          <p className="doc-sub">{lessons.length} درس · {circles.length} حلقة</p>
        </div>
      </header>

      <div className="store-cat-scroll" style={{ paddingTop: 14 }}>
        <button className={`store-cat-chip ${tab === 'prayer' ? 'active' : ''}`} onClick={() => setTab('prayer')} type="button">🕌 المواقيت</button>
        <button className={`store-cat-chip ${tab === 'lessons' ? 'active' : ''}`} onClick={() => setTab('lessons')} type="button">📖 الدروس ({lessons.length})</button>
        <button className={`store-cat-chip ${tab === 'circles' ? 'active' : ''}`} onClick={() => setTab('circles')} type="button">🎯 الحلقات ({circles.length})</button>
        <button className={`store-cat-chip ${tab === 'donations' ? 'active' : ''}`} onClick={() => setTab('donations')} type="button">🎁 التبرعات</button>
      </div>

      {tab === 'prayer' && (
        <div className="prayer-grid">
          {DEFAULT_PRAYERS.map((p) => (
            <div key={p.name} className="prayer-item">
              <div className="prayer-name">{p.name}</div>
              <div className="prayer-time">{p.time}</div>
              <div style={{ fontSize: 12, color: 'var(--n-500)', fontWeight: 700, marginTop: 4 }}>{p.ar}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'lessons' && (
        <div className="files-list">
          {loading ? <div className="trans-empty"><p>...</p></div> :
           lessons.length === 0 ? <div className="trans-empty"><span className="em">📖</span><p>لا توجد دروس</p></div> :
           lessons.map((l) => (
            <div key={l.id} className="lesson-card">
              <span className="lesson-type">{l.lesson_type === 'khutbah' ? 'خطبة' : 'درس'}</span>
              <div className="lesson-title">{l.title}</div>
              <div className="lesson-meta">
                {l.teacher_name && <span>👤 {l.teacher_name}</span>}
                {l.scheduled_at && <span>📅 {new Date(l.scheduled_at).toLocaleDateString('ar-EG')}</span>}
              </div>
              {l.content && <p style={{ fontSize: 13, color: 'var(--n-600)', lineHeight: 1.7, margin: 0 }}>{l.content}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'circles' && (
        <div className="files-list">
          {circles.length === 0 ? <div className="trans-empty"><span className="em">🎯</span><p>لا توجد حلقات</p></div> :
           circles.map((c) => (
            <div key={c.id} className="lesson-card circle">
              <span className="lesson-type circle">حلقة</span>
              <div className="lesson-title">{c.title}</div>
              <div className="lesson-meta">
                {c.teacher_name && <span>👤 {c.teacher_name}</span>}
                {c.level && <span>📊 {c.level}</span>}
                <span>👥 {c.students_count} طالب</span>
              </div>
              {c.schedule && <div style={{ fontSize: 12, color: 'var(--n-500)', fontWeight: 600 }}>⏰ {c.schedule}</div>}
            </div>
          ))}
        </div>
      )}

      {tab === 'donations' && (
        <div className="files-list">
          {donations.length === 0 ? <div className="trans-empty"><span className="em">🎁</span><p>لا توجد تبرعات مسجلة</p></div> :
           donations.map((d) => (
            <div key={d.id} className="file-card" style={{ borderRight: '3px solid #059669' }}>
              <div className="file-icon" style={{ background: 'rgba(5,150,105,.1)', color: '#059669' }}>💚</div>
              <div className="file-info">
                <div className="file-title">{d.is_anonymous ? 'متبرع مجهول' : d.donor_name}</div>
                <div className="file-meta">{d.purpose || 'تبرع عام'}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#059669', direction: 'ltr' }}>
                {Number(d.amount || 0).toLocaleString()} {d.currency}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
