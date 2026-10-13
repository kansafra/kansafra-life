'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewMemory() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [tab, setTab] = useState('story');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [story, setStory] = useState({ title: '', body: '', author_name: '', decade: '', image_url: '' });
  const [place, setPlace] = useState({ place_name: '', description: '', era: '', image_url: '' });
  const [item, setItem] = useState({ title: '', description: '', media_url: '', decade: '' });

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
  }, [router]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    let err = null;
    if (tab === 'story') {
      if (!story.title.trim() || !story.body.trim()) { setError('العنوان والنص مطلوبان'); setLoading(false); return; }
      ({ error: err } = await supabase.from('memory_stories').insert({
        entity_name: entity.display_name,
        title: story.title.trim(),
        body: story.body.trim(),
        author_name: story.author_name.trim() || null,
        decade: story.decade.trim() || null,
        image_url: story.image_url.trim() || null,
      }));
    } else if (tab === 'place') {
      if (!place.place_name.trim()) { setError('اسم المكان مطلوب'); setLoading(false); return; }
      ({ error: err } = await supabase.from('memory_places').insert({
        entity_name: entity.display_name,
        place_name: place.place_name.trim(),
        description: place.description.trim() || null,
        era: place.era.trim() || null,
        image_url: place.image_url.trim() || null,
      }));
    } else {
      if (!item.title.trim() || !item.media_url.trim()) { setError('العنوان والرابط مطلوبان'); setLoading(false); return; }
      ({ error: err } = await supabase.from('memory_items').insert({
        entity_name: entity.display_name,
        title: item.title.trim(),
        description: item.description.trim() || null,
        media_url: item.media_url.trim(),
        decade: item.decade.trim() || null,
        item_type: 'photo',
      }));
    }

    setLoading(false);
    if (err) { setError('تعذّر الحفظ: ' + err.message); return; }
    setDone(true);
  }

  if (!entity) return <div className="trans-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  if (done) {
    return (
      <div className="prod-page">
        <div className="new-service-success">
          <div className="chk-circle">✓</div>
          <h2>تم الإضافة</h2>
          <Link href="/merchant" className="new-service-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>العودة</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="new-prod-page">
      <div className="prod-header">
        <Link href="/merchant" className="prod-back">→</Link>
        <span className="prod-header-title">إضافة للذاكرة</span>
      </div>

      <div className="store-cat-scroll" style={{ paddingTop: 14 }}>
        <button className={`store-cat-chip ${tab === 'story' ? 'active' : ''}`} onClick={() => setTab('story')} type="button">📖 حكاية</button>
        <button className={`store-cat-chip ${tab === 'place' ? 'active' : ''}`} onClick={() => setTab('place')} type="button">📍 مكان</button>
        <button className={`store-cat-chip ${tab === 'photo' ? 'active' : ''}`} onClick={() => setTab('photo')} type="button">🖼️ صورة</button>
      </div>

      <form className="new-prod-form" onSubmit={submit}>
        {tab === 'story' && (
          <>
            <div className="new-service-field">
              <label className="new-service-label">عنوان الحكاية <span className="req">*</span></label>
              <input className="new-service-input" value={story.title} onChange={(e) => setStory({ ...story, title: e.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">النص <span className="req">*</span></label>
              <textarea className="new-service-textarea" style={{ minHeight: 140 }} value={story.body} onChange={(e) => setStory({ ...story, body: e.target.value })} />
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">الراوي / المؤلف</label>
                <input className="new-service-input" value={story.author_name} onChange={(e) => setStory({ ...story, author_name: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">العقد</label>
                <input className="new-service-input" placeholder="1970s / 1980s" value={story.decade} onChange={(e) => setStory({ ...story, decade: e.target.value })} />
              </div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label">رابط صورة (اختياري)</label>
              <input className="new-service-input" type="url" value={story.image_url} onChange={(e) => setStory({ ...story, image_url: e.target.value })} />
            </div>
          </>
        )}
        {tab === 'place' && (
          <>
            <div className="new-service-field">
              <label className="new-service-label">اسم المكان <span className="req">*</span></label>
              <input className="new-service-input" placeholder="مثال: الجامع القديم" value={place.place_name} onChange={(e) => setPlace({ ...place, place_name: e.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">الوصف</label>
              <textarea className="new-service-textarea" value={place.description} onChange={(e) => setPlace({ ...place, description: e.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">الحقبة</label>
              <input className="new-service-input" placeholder="مثال: قبل 1950" value={place.era} onChange={(e) => setPlace({ ...place, era: e.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">رابط صورة</label>
              <input className="new-service-input" type="url" value={place.image_url} onChange={(e) => setPlace({ ...place, image_url: e.target.value })} />
            </div>
          </>
        )}
        {tab === 'photo' && (
          <>
            <div className="new-service-field">
              <label className="new-service-label">عنوان الصورة <span className="req">*</span></label>
              <input className="new-service-input" value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label">رابط الصورة <span className="req">*</span></label>
              <input className="new-service-input" type="url" placeholder="https://..." value={item.media_url} onChange={(e) => setItem({ ...item, media_url: e.target.value })} />
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">العقد</label>
                <input className="new-service-input" placeholder="1960s" value={item.decade} onChange={(e) => setItem({ ...item, decade: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">وصف</label>
                <input className="new-service-input" value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })} />
              </div>
            </div>
          </>
        )}
        {error && <div style={{ color: '#dc2626', fontSize: 13, fontWeight: 700, padding: 12, background: 'rgba(220,38,38,.1)', borderRadius: 12 }}>{error}</div>}
        <button className="new-service-submit" type="submit" disabled={loading}>
          {loading ? '... جارٍ الحفظ' : '✓ إضافة'}
        </button>
      </form>
    </div>
  );
}
