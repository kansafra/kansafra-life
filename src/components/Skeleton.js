'use client';

export function Skeleton({ width = '100%', height = 16, radius = 8, style = {} }) {
  return (
    <div
      className="sanad-skeleton"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <Skeleton width={48} height={48} radius={12} />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} height={10} style={{ marginTop: 8 }} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
