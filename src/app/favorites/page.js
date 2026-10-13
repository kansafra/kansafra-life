'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFavorites, removeFavorite } from '@/lib/reviews';

export default function FavoritesPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    refresh();
    window.addEventListener('sanad-fav-updated', refresh);
    return () => window.removeEventListener('sanad-fav-updated', refresh);
  }, []);

  function refresh() { setItems(getFavorites()); }

  function del(t, id) { removeFavorite(t, id); refresh(); }

  function urlFor(item) {
    if (item.target_type === 'product') return `/store/${encodeURIComponent(item.target_name)}`;
    if (item.target_type === 'service') return `/service/${item.target_id}`;
    return '#';
  }

  return (
    <div className="prod-page">
      <header className="prod-header">
        <Link href="/" className="prod-back">→</Link>
        <span className="prod-header-title">مفضلتي</span>
        <span style={{ width: 40 }} />
      </header>

      {items.length === 0 ? (
        <div className="ol-empty-state" style={{ padding: 80 }}>
          <span className="em">🤍</span>
          <p>لا توجد عناصر مفضلة بعد</p>
          <p style={{ fontSize: 12, marginTop: 8, color: 'var(--n-400)' }}>
            اضغط ❤️ على أي منتج أو خدمة لحفظها هنا
          </p>
        </div>
      ) : (
        <div className="orders-list">
          {items.map((item, i) => (
            <div key={i} className="order-card" style={{ borderLeft: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="cart-item-img">
                {item.target_image ? <img src={item.target_image} alt="" /> : '📦'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={urlFor(item)} style={{ textDecoration: 'none' }}>
                  <div className="order-customer" style={{ marginBottom: 4 }}>{item.target_name}</div>
                </Link>
                <div style={{ fontSize: 11, color: 'var(--n-400)', fontWeight: 600 }}>
                  {item.target_type === 'product' ? 'منتج' : item.target_type === 'service' ? 'خدمة' : item.target_type}
                </div>
              </div>
              <button
                className="prod-action-btn del"
                onClick={() => del(item.target_type, item.target_id)}
                type="button"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
