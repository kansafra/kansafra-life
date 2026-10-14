'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function MemoryPage() {
  const [tab, setTab] = useState('gallery');
  const [stories, setStories] = useState([]);
  const [places, setPlaces] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const [s, p, m] = await Promise.all([
        supabase.from('memory_stories').select('*').eq('is_approved', true).order('created_at', { ascending: false }),
        supabase.from('memory_places').select('*').order('created_at', { ascending: false }),
        supabase.from('memory_items').select('*').order('created_at', { ascending: false }),
      ]);
      setStories(Array.isArray(s.data) ? s.data : []);
      setPlaces(Array.isArray(p.data) ? p.data : []);
      setItems(Array.isArray(m.data) ? m.data : []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="doc-page">
      <header className="memory-hero">
        <div className="doc-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
            <span style={{ letterSpacing: 3, fontSize: 11, fontWeight: 800, opacity: .7 }}>MEMORY</span>
          </div>
          <h1 className="doc-title">ذاكرة كنصفرة</h1>
          <p className="doc-sub">أرشيف رقمي للأجيال القادمة</p>
        </div>
      </header>

      <div className="store-cat-scroll" style={{ paddingTop: 14 }}>
        <button className={`store-cat-chip ${tab === 'gallery' ? 'active' : ''}`} onClick={() => setTab('gallery')} type="button">🖼️ المعرض ({items.length})</button>
        <button className={`store-cat-chip ${tab === 'stories' ? 'active' : ''}`} onClick={() => setTab('stories')} type="button">📖 الحكايات ({stories.length})</button>
        <button className={`store-cat-chip ${tab === 'places' ? 'active' : ''}`} onClick={() => setTab('places')} type="button">📍 الأماكن ({places.length})</button>
      </div>

      {loading ? (
        <div className="trans-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : tab === 'gallery' ? (
        items.length === 0 ? (
          <div className="trans-empty"><span className="em">🖼️</span><p>لم تُضف صور بعد</p></div>
        ) : (
          <div className="gallery-grid">
            {items.map((m, i) => (
              <div key={m.id} className={`gallery-item ${i % 5 === 0 ? 'tall' : ''}`}>
                {m.media_url ? <img src={m.media_url} alt={m.title} /> : '📷'}
                {m.title && <div className="overlay">{m.title}</div>}
              </div>
            ))}
          </div>
        )
      ) : tab === 'stories' ? (
        <div className="timeline">
          {stories.length === 0 ? (
            <div className="trans-empty"><span className="em">📖</span><p>لا توجد حكايات بعد</p></div>
          ) : (
            stories.map((s) => (
              <div key={s.id} className="timeline-item">
                <div className="timeline-year">{s.decade || '—'}</div>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-title">{s.title}</div>
                  <div className="timeline-body">{s.body}</div>
                  {s.author_name && (
                    <div style={{ fontSize: 11, color: 'var(--n-400)', marginTop: 8, fontWeight: 700 }}>
                      — {s.author_name}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="files-list">
          {places.length === 0 ? (
            <div className="trans-empty"><span className="em">📍</span><p>لا توجد أماكن مسجلة</p></div>
          ) : (
            places.map((p) => (
              <div key={p.id} className="file-card" style={{ borderRight: '3px solid #4f46e5' }}>
                <div className="file-icon" style={{ background: 'rgba(79,70,229,.1)', color: '#4f46e5' }}>📍</div>
                <div className="file-info">
                  <div className="file-title">{p.place_name}</div>
                  <div className="file-meta">{p.era || ''} {p.description ? '· ' + p.description : ''}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
