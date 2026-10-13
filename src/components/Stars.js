'use client';
export default function Stars({ value = 0, size = 16, onChange = null }) {
  const interactive = typeof onChange === 'function';
  return (
    <span className="stars-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`star ${n <= Math.round(value) ? 'filled' : ''} ${interactive ? 'star-btn' : ''} ${interactive && size > 20 ? 'lg' : ''}`}
          onClick={interactive ? () => onChange(n) : undefined}
          style={{ fontSize: size, cursor: interactive ? 'pointer' : 'default' }}
        >
          ★
        </span>
      ))}
    </span>
  );
}
