'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getTimeBasedSuggestions } from '@/lib/smartSearch';

export default function SmartSuggestions() {
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const suggestions = useMemo(() => getTimeBasedSuggestions(), []);

  useEffect(() => {
    loadTrending();
    loadRecent();
  }, []);

  async function loadTrending() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('entities')
        .select('id, display_name, entity_type, logo_url, city, is_verified')
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);
      setTrending(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function loadRecent() {
    try {
      const stored = JSON.parse(localStorage.getItem('sanad_recent_searches') || '[]');
      setRecent(stored.slice(0, 5));
    } catch {}
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Dynamic Greeting */}
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', borderRadius: 16, padding: 20, color: '#fff', marginBottom: 12, boxShadow: '0 6px 20px rgba(15,77,58,0.15)' }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>{suggestions.emoji}</div>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{suggestions.greeting}</div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>{suggestions.prompt}</div>
      </div>

      {/* Time-based Chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        {suggestions.chips.map((chip, i) => (
          <Link key={i} href={`/search?q=${encodeURIComponent(chip.query)}`} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 6px', textAlign: 'center', textDecoration: 'none', color: '#0f4d3a', fontSize: 10.5, fontWeight: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 20 }}>{chip.label.split(' ')[0]}</span>
            <span>{chip.label.substring(chip.label.indexOf(' ') + 1)}</span>
          </Link>
        ))}
      </div>

      {/* Recent Searches */}
      {recent.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>🕐 بحثت مؤخراً</h3>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {recent.map((r, i) => (
              <Link key={i} href={`/search?q=${encodeURIComponent(r)}`} style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', color: '#0284c7', padding: '6px 12px', borderRadius: 16, fontSize: 11, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                {r}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending Stores */}
      {trending.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', margin: 0 }}>🔥 جديد على سند</h3>
            <Link href="/stores" style={{ fontSize: 11, color: '#0f4d3a', fontWeight: 900, textDecoration: 'none' }}>عرض الكل ←</Link>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {trending.map(s => (
              <Link key={s.id} href={`/store/${encodeURIComponent(s.display_name)}`} style={{ flexShrink: 0, width: 130, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 10, textDecoration: 'none', color: 'inherit', textAlign: 'center' }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, overflow: 'hidden', margin: '0 auto 8px', background: 'linear-gradient(135deg, #0f4d3a, #075640)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff' }}>
                  {s.logo_url ? <img src={s.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏪'}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.display_name}</div>
                {s.city && <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>📍 {s.city}</div>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
