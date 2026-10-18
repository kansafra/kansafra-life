'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function CraftsPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('entities').select('*').eq('entity_type', 'craftsman').eq('is_active', true).eq('approval_status', 'approved');
    setProviders(data || []);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#475569,#1e293b)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🛠️ الحرفيون</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{providers.length} حرفي</div>
          </div>
          <div style={{ fontSize: 40 }}>🛠️</div>
        </div>
      </div>

      {loading ? <div style={{ padding: 16 }}><SkeletonList count={3} /></div> : (
        <div style={{ padding: 16 }}>
          {providers.length === 0 ? <EmptyState icon="🛠️" title="لا يوجد حرفيون" description="ستظهر قائمة الحرفيين هنا" actionLabel="← الرئيسية" actionHref="/" /> : providers.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{p.display_name}</div>
              {p.bio && <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 8 }}>{p.bio}</div>}
              {p.city && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>📍 {p.city}</div>}
              {p.phone && (
                <a href={`https://wa.me/${String(p.phone).replace(/\D/g, '').replace(/^0/, '963')}`} target="_blank" rel="noopener" style={{ display: 'block', width: '100%', padding: 10, background: 'rgba(71,85,105,.1)', color: '#475569', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📱 تواصل</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
