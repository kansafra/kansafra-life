'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('job_postings').select('*').order('created_at', { ascending: false });
    setJobs(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = jobs;
    if (filter !== 'all') list = list.filter(j => j.job_type === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(j => (j.title || '').toLowerCase().includes(q) || (j.employer_name || '').toLowerCase().includes(q) || (j.location || '').toLowerCase().includes(q));
    }
    return list;
  }, [jobs, search, filter]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#059669,#065f46)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>💼 التوظيف</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{filtered.length} وظيفة متاحة</div>
          </div>
          <div style={{ fontSize: 40 }}>💼</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث بالوظيفة أو الشركة..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all', 'الكل'], ['دوام كامل', 'دوام كامل'], ['دوام جزئي', 'دوام جزئي'], ['عن بعد', 'عن بعد'], ['مؤقت', 'مؤقت'], ['تدريب', 'تدريب']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 14px', background: filter === k ? '#059669' : '#fff', color: filter === k ? '#fff' : '#64748b', border: `1px solid ${filter === k ? '#059669' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ padding: 16 }}><SkeletonList count={3} /></div> : (
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0 ? <EmptyState icon="💼" title="لا توجد وظائف" description="ستظهر الوظائف الشاغرة هنا" actionLabel="← الرئيسية" actionHref="/" /> : filtered.map(j => (
            <div key={j.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{j.title}</div>
                {j.job_type && <span style={{ background: 'rgba(5,150,105,.15)', color: '#059669', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900 }}>{j.job_type}</span>}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>🏢 {j.employer_name || 'شركة'} · 📍 {j.location || 'غير محدد'}</div>
              {j.description && <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{j.description}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#059669' }}>{(j.salary_min || j.salary_max) ? `${Number(j.salary_min || 0).toLocaleString()} - ${Number(j.salary_max || 0).toLocaleString()} ${j.currency || 'SYP'}` : 'الراتب غير محدد'}</div>
                {j.employer_phone && <a href={`https://wa.me/${String(j.employer_phone).replace(/\D/g, '').replace(/^0/, '963')}`} target="_blank" rel="noopener" style={{ padding: '8px 16px', background: 'rgba(37,211,102,.1)', color: '#059669', borderRadius: 8, fontSize: 11, fontWeight: 900, textDecoration: 'none' }}>📱 تقدم</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
