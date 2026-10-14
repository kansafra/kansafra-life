'use client';
import { useState, useEffect } from 'react';

const SLIDES = [
  { bg: 'linear-gradient(135deg, #0f4d3a, #0a6b50)', title: 'أهلاً بك في سند', desc: 'منصة مجتمعك الشاملة', btn: 'تعرف أكثر', href: '/sos' },
  { bg: 'linear-gradient(135deg, #dc2626, #991b1b)', title: '🚨 الطوارئ SOS', desc: 'إسعاف فوري بضغطة زر', btn: 'افتح', href: '/sos' },
  { bg: 'linear-gradient(135deg, #7c3aed, #6d28d9)', title: '📚 المكتبة الرقمية', desc: 'آلاف الكتب والمراجع', btn: 'تصفح', href: '/library' },
  { bg: 'linear-gradient(135deg, #059669, #047857)', title: '🕌 أوقات الصلاة', desc: 'المواقيت تلقائياً', btn: 'افتح', href: '/mosque/جامع كنصفرة الكبير' },
];

export default function HeroCarousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

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
      <div className="carousel-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot ${i === idx ? 'active' : ''}`}
            onClick={() => setIdx(i)}
            type="button"
            aria-label={`شريحة ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
