'use client';
import { useState, useEffect } from 'react';
import { loadCommunities, getCurrentCommunity, setCurrentCommunity } from '@/lib/tenant';

export default function CommunityPicker() {
  const [communities, setCommunities] = useState([]);
  const [current, setCurrent] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadCommunities().then((data) => {
      setCommunities(data);
      setCurrent(getCurrentCommunity() || data[0] || null);
    });
  }, []);

  if (!current) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="location-chip"
        type="button"
      >
        <span className="dot" />
        {current.name}
        {current.district && ` — ${current.district}`}
      </button>

      {open && (
        <div className="mng-modal-bg" onClick={() => setOpen(false)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">🏘️ اختر بلدتك</h3>
            {communities.map((c) => (
              <button
                key={c.id}
                className={`geo-option ${current.id === c.id ? 'active' : ''}`}
                onClick={() => {
                  setCurrentCommunity(c);
                  setCurrent(c);
                  setOpen(false);
                  setTimeout(() => window.location.reload(), 300);
                }}
                type="button"
              >
                <span style={{ fontSize: 20 }}>📍</span>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--n-500)', fontWeight: 600 }}>
                    {c.country} · {c.governorate} · {c.district}
                  </div>
                </div>
                {current.id === c.id && <span style={{ color: 'var(--f-600)', fontWeight: 900 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
