'use client';
import { useState, useEffect } from 'react';
import { isFavorite, toggleFavorite } from '@/lib/reviews';

export default function FavoriteButton({ targetType, targetId, targetName, targetImage, className = '' }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isFavorite(targetType, targetId));
    const refresh = () => setActive(isFavorite(targetType, targetId));
    window.addEventListener('sanad-fav-updated', refresh);
    return () => window.removeEventListener('sanad-fav-updated', refresh);
  }, [targetType, targetId]);

  function handleClick(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    toggleFavorite({
      target_type: targetType,
      target_id: targetId,
      target_name: targetName || '',
      target_image: targetImage || null,
    });
  }

  return (
    <button
      className={`fav-btn ${active ? 'active' : ''} ${className}`}
      onClick={handleClick}
      type="button"
      aria-label="مفضلة"
    >
      {active ? '❤️' : '🤍'}
    </button>
  );
}
