'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function ElderlyPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('elderly_requests').select('*').order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>👴 كبار السن</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>خدمات ومساعدة لكبار السن</div>
          </div>
          <div style={{ fontSize: 40 }}>👴</div>
        </div>
      </div>

      {loading ? <div style={{ padding: 16 }}><SkeletonList count={3} /></div> : (
        <div style={{ padding: 16 }}>
          {requests.length === 0 ? <EmptyState icon="👴" title="لا توجد طلبات" description="ستظهر طلبات المساعدة هنا" actionLabel="← الرئيسية" actionHref="/" /> : requests.map(r => (
            <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{r.service_type}</div>
              {r.description && <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 8 }}>{r.description}</div>}
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>📍 {r.address} {r.preferred_time && `· ⏰ ${r.preferred_time}`}</div>
              {r.requester_phone && (
                <a href={`https://wa.me/${String(r.requester_phone).replace(/\D/g, '').replace(/^0/, '963')}`} target="_blank" rel="noopener" style={{ display: 'block', width: '100%', padding: 10, background: 'rgba(8,145,178,.1)', color: '#0891b2', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📱 تواصل</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
