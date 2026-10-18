'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function MosquePage() {
  const params = useParams();
  const mosqueName = decodeURIComponent(params?.name || '');
  const [mosque, setMosque] = useState(null);
  const [sermons, setSermons] = useState([]);
  const [circles, setCircles] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [tab, setTab] = useState('sermons');
  const [prayers, setPrayers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mosqueName) return;
    load();
    loadPrayers();
  }, [mosqueName]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [mRes, sRes, cRes, lRes] = await Promise.all([
        supabase.from('entities').select('*').eq('display_name', mosqueName).eq('entity_type', 'mosque').maybeSingle(),
        supabase.from('sermons').select('*').eq('entity_name', mosqueName).eq('is_published', true).order('sermon_date', { ascending: false }).limit(20),
        supabase.from('circles').select('*').eq('entity_name', mosqueName).eq('is_active', true),
        supabase.from('lessons').select('*').eq('entity_name', mosqueName).eq('is_published', true).limit(20),
      ]);
      setMosque(mRes.data);
      setSermons(sRes.data || []);
      setCircles(cRes.data || []);
      setLessons(lRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadPrayers() {
    try {
      const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Idlib&country=Syria&method=3');
      const json = await res.json();
      if (json?.data?.timings) setPrayers(json.data.timings);
    } catch (e) { console.error(e); }
  }

  function call() {
    if (!mosque?.phone) return;
    window.location.href = `tel:${mosque.phone}`;
  }

  function whatsapp() {
    if (!mosque?.phone) return;
    const clean = String(mosque.phone).replace(/\D/g, '');
    const phone = clean.startsWith('0') ? '963' + clean.slice(1) : clean;
    window.open(`https://wa.me/${phone}`, '_blank');
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  const prayerList = prayers ? [
    { key: 'Fajr', label: 'الفجر', icon: '🌅' },
    { key: 'Dhuhr', label: 'الظهر', icon: '☀️' },
    { key: 'Asr', label: 'العصر', icon: '🌤️' },
    { key: 'Maghrib', label: 'المغرب', icon: '🌇' },
    { key: 'Isha', label: 'العشاء', icon: '🌙' },
  ] : [];

  const tabs = [
    { k: 'sermons', label: '📖 الخطب', count: sermons.length },
    { k: 'circles', label: '🎯 الحلقات', count: circles.length },
    { k: 'lessons', label: '📚 الدروس', count: lessons.length },
    { k: 'prayer', label: '🕌 المواقيت' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0f4d3a,#075640)', padding: '20px 20px 32px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, left: -40, width: 180, height: 180, background: 'rgba(251,191,36,.1)', borderRadius: '50%', filter: 'blur(40px)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative', zIndex: 1 }}>
          <Link href="/mosque" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>←</Link>
          <span style={{ letterSpacing: 3, fontSize: 11, fontWeight: 800, opacity: 0.7 }}>MOSQUE</span>
          <div style={{ fontSize: 40 }}>🕌</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1, marginBottom: 16 }}>
          {mosque?.logo_url ? (
            <img src={mosque.logo_url} alt="" style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', border: '3px solid rgba(255,255,255,.2)' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 16, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🕌</div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{mosqueName}</h1>
            {mosque?.city && <div style={{ fontSize: 12, opacity: 0.85 }}>📍 {mosque.city}</div>}
            {mosque?.address && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>🏠 {mosque.address}</div>}
          </div>
        </div>

        {mosque?.bio && (
          <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.7, marginBottom: 12, position: 'relative', zIndex: 1, padding: 12, background: 'rgba(255,255,255,.08)', borderRadius: 10 }}>
            {mosque.bio}
          </div>
        )}

        {mosque?.phone && (
          <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1 }}>
            <button onClick={call} style={{ flex: 1, padding: 10, background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📞 اتصال</button>
            <button onClick={whatsapp} style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,.2)', color: '#fff', border: '1px solid rgba(37,211,102,.3)', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📱 واتساب</button>
          </div>
        )}
      </div>

      {/* Prayer Times */}
      {prayerList.length > 0 && (
        <div style={{ padding: 16, marginTop: -16, position: 'relative', zIndex: 2 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 4px 16px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#0f4d3a', marginBottom: 10, textAlign: 'center' }}>🕌 مواقيت الصلاة اليوم — إدلب</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
              {prayerList.map(p => (
                <div key={p.key} style={{ textAlign: 'center', padding: 8, background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 16 }}>{p.icon}</div>
                  <div style={{ fontSize: 9, color: '#64748b', marginTop: 2, fontWeight: 700 }}>{p.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#0f4d3a', marginTop: 2, direction: 'ltr' }}>{prayers[p.key]?.slice(0, 5)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {tabs.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              padding: '8px 14px', background: tab === t.k ? '#0f4d3a' : '#fff',
              color: tab === t.k ? '#fff' : '#64748b',
              border: `1px solid ${tab === t.k ? '#0f4d3a' : '#e5e7eb'}`,
              borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}>{t.label}{t.count !== undefined ? ` (${t.count})` : ''}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* Sermons */}
        {tab === 'sermons' && (
          sermons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>📖</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>لا توجد خطب منشورة</div>
            </div>
          ) : sermons.map(s => (
            <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>📖 {s.title}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                {s.khatib && `👨‍🏫 ${s.khatib}`}
                {s.sermon_date && ` · 📅 ${new Date(s.sermon_date).toLocaleDateString('ar-EG')}`}
              </div>
              {s.content && <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.content}</div>}
              {s.audio_url && <a href={s.audio_url} target="_blank" rel="noopener" style={{ display: 'inline-block', marginTop: 8, padding: '6px 12px', background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 8, fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>🔊 استماع</a>}
            </div>
          ))
        )}

        {/* Circles */}
        {tab === 'circles' && (
          circles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>🎯</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>لا توجد حلقات تحفيظ</div>
            </div>
          ) : circles.map(c => (
            <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>🎯 {c.name}</div>
              {c.teacher_name && <div style={{ fontSize: 11, color: '#64748b' }}>👨‍🏫 {c.teacher_name}</div>}
              {c.schedule && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>🕐 {c.schedule}</div>}
              {c.level && <div style={{ fontSize: 11, color: '#0f4d3a', fontWeight: 800, marginTop: 4 }}>🎯 {c.level}</div>}
            </div>
          ))
        )}

        {/* Lessons */}
        {tab === 'lessons' && (
          lessons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>📚</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>لا توجد دروس</div>
            </div>
          ) : lessons.map(l => (
            <div key={l.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>📚 {l.title}</div>
              {l.subject && <div style={{ fontSize: 11, color: '#64748b' }}>📖 {l.subject}</div>}
              {l.content && <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.7, marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.content}</div>}
            </div>
          ))
        )}

        {/* Prayer Tab */}
        {tab === 'prayer' && prayers && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🕌</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f4d3a' }}>مواقيت الصلاة</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>إدلب — تقويم أم القرى</div>
            </div>
            {prayerList.map(p => (
              <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{p.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 900 }}>{p.label}</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#0f4d3a', direction: 'ltr' }}>{prayers[p.key]?.slice(0, 5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
