'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function CharityPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('entities')
      .select('*')
      .eq('entity_type', 'charity')
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .order('display_name');
    setOrgs(data || []);
    setLoading(false);
  }

  const filtered = orgs.filter(o => !search.trim() || (o.display_name || '').toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#059669,#065f46)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🤝 الجمعيات والمساعدات</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{filtered.length} جمعية</div>
          </div>
          <div style={{ fontSize: 40 }}>🤝</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث عن جمعية..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      {loading ? (
        <div style={{ padding: 16 }}><SkeletonList count={3} /></div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0 ? (
            <EmptyState icon="🤝" title={search ? 'لا توجد نتائج' : 'لا توجد جمعيات'} description="ستظهر الجمعيات الخيرية هنا" actionLabel="← الرئيسية" actionHref="/" />
          ) : filtered.map(o => (
            <div key={o.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                {o.logo_url ? (
                  <img src={o.logo_url} alt="" style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 12, background: 'linear-gradient(135deg,#059669,#065f46)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🤝</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{o.display_name}</div>
                  {o.city && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📍 {o.city}</div>}
                  {o.bio && <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{o.bio}</div>}
                </div>
              </div>
              {o.phone && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`tel:${o.phone}`} style={{ flex: 1, padding: 10, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📞 اتصال</a>
                  <a href={`https://wa.me/${String(o.phone).replace(/\D/g, '').replace(/^0/, '963')}`} target="_blank" rel="noopener" style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,.1)', color: '#059669', border: '1px solid rgba(37,211,102,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📱 واتساب</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
