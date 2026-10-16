'use client';
import { useState, useEffect } from 'react';

const SLIDES = [
  { bg: 'linear-gradient(135deg, #0f4d3a, #0a6b50)', title: 'أهلاً بك يوجد سند', desc: 'منصة مجتمعك الشاملة', btn: 'تعرف أكثر', href: '/sos' },
  { bg: 'linear-gradient(135deg, #dc2626, #991b1b)', title: '🚨 الطوارئ SOS', desc: 'إسعاف فوري بضغطة زر', btn: 'افتح', href: '/sos' },
  { bg: 'linear-gradient(135deg, #7c3aed, #6d28d9)', title: '📚 المكتبة الرقمية', desc: 'آلاف الكتب والمراجع', btn: 'تصفح', href: '/library' },
  { bg: 'linear-gradient(135deg, #059669, #047857)', title: '🕌 أوقات الصلاة', desc: 'المواقيت تلقائياً', btn: 'افتح', href: '/mosque' },
];

const STORAGE_KEY = 'sanad_carousel_idx';
const PAUSE_MS = 15000;

export default function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // استرجاع آخر شريحة
  useEffect(() => {
    try {
      const saved = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
      if (!isNaN(saved) && saved >= 0 && saved < SLIDES.length) setIdx(saved);
    } catch {}
  }, []);

  // حفظ الشريحة
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(idx)); } catch {}
  }, [idx]);

  // تقليب تلقائي (يتوقف عند paused)
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [paused]);

  const goToSlide = (i) => {
    const safe = ((i % SLIDES.length) + SLIDES.length) % SLIDES.length;
    setIdx(safe);
    setPaused(true);
    setTimeout(() => setPaused(false), PAUSE_MS);
  };

  const next = () => goToSlide(idx + 1);
  const prev = () => goToSlide(idx - 1);

  return (
    <div className="carousel">
      <div className="carousel-track" style={{ transform: `translateX(${idx * 100}%)` }}>
        {SLIDES.map((s, i) => (
          <div key={i} className="carousel-slide" style={{ background: s.bg }}>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
            <a href={s.href} className="btn-slide">{s.btn} →</a>
          </div>
        ))}
      </div>

      <button className="carousel-nav prev" type="button" onClick={prev} aria-label="السابق">‹</button>
      <button className="carousel-nav next" type="button" onClick={next} aria-label="التالي">›</button>

      <div className="carousel-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot ${i === idx ? 'active' : ''}`}
            onClick={() => goToSlide(i)}
            type="button"
            aria-label={`شريحة ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
