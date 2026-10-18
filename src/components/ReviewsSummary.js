'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReviewsSummary({ targetType, targetId, variant = 'compact' }) {
  const [stats, setStats] = useState({ avg: 0, total: 0, dist: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [targetType, targetId]);

  async function load() {
    if (!supabase || !targetId) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('reviews')
        .select('rating')
        .eq('target_type', targetType)
        .eq('target_id', targetId);
      
      if (!data || data.length === 0) { setLoading(false); return; }
      
      const total = data.length;
      const sum = data.reduce((s, r) => s + Number(r.rating || 0), 0);
      const avg = sum / total;
      const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      data.forEach(r => {
        const n = Math.round(Number(r.rating || 0));
        if (dist[n] !== undefined) dist[n]++;
      });
      setStats({ avg, total, dist });
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (loading) return null;
  if (stats.total === 0) {
    if (variant === 'compact') return null;
    return (
      <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
        ⭐ لا توجد تقييمات بعد
      </div>
    );
  }

  const stars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? '#fbbf24' : '#e5e7eb', fontSize: 14 }}>★</span>
    ));
  };

  // COMPACT: سطر صغير
  if (variant === 'compact') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#fbbf24', fontSize: 12 }}>★</span>
        <span style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>{stats.avg.toFixed(1)}</span>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>({stats.total})</span>
      </div>
    );
  }

  // BADGE: شارة صغيرة
  if (variant === 'badge') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(251,191,36,.15)', padding: '4px 10px', borderRadius: 8 }}>
        <span style={{ color: '#fbbf24', fontSize: 14 }}>★</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#92400e' }}>{stats.avg.toFixed(1)}</span>
        <span style={{ fontSize: 10, color: '#92400e', opacity: 0.7 }}>({stats.total})</span>
      </div>
    );
  }

  // FULL: كامل مع توزيع
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{stats.avg.toFixed(1)}</div>
          <div style={{ marginTop: 6 }}>{stars(stats.avg)}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{stats.total} تقييم</div>
        </div>
        <div style={{ flex: 1 }}>
          {[5, 4, 3, 2, 1].map(n => {
            const pct = (stats.dist[n] / stats.total) * 100;
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#64748b', width: 12 }}>{n}</span>
                <span style={{ fontSize: 11, color: '#fbbf24' }}>★</span>
                <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#fbbf24', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8', width: 24, textAlign: 'left' }}>{stats.dist[n]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
