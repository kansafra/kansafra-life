'use client';
import { useState } from 'react';

const CATEGORIES = [
  { key: 'urgent', label: '🔴 عاجل', href: '/notifications' },
  { key: 'service', label: '🟢 خدمي', href: '/search' },
  { key: 'price', label: '🟡 أسعار', href: '/auctions' },
];

export default function NewsTicker({ latest }) {
  return (
    <div className="news-ticker">
      {CATEGORIES.map((c) => (
        <a key={c.key} href={c.href} className={`ticker-item ${c.key}`} style={{ textDecoration: 'none' }}>
          <span className="dot" /> {c.label}
        </a>
      ))}
      {latest && (
        <span className="ticker-item service" style={{ paddingRight: 16 }}>
          <span className="dot" /> {latest.slice(0, 40)}
        </span>
      )}
    </div>
  );
}
