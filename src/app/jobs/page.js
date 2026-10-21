'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const JOB_TYPES = {
  full_time: { label: 'دوام كامل', icon: '💼', color: '#10b981' },
  part_time: { label: 'دوام جزئي', icon: '⏰', color: '#f59e0b' },
  remote: { label: 'عن بعد', icon: '🏠', color: '#8b5cf6' },
  freelance: { label: 'عمل حر', icon: '🎯', color: '#0ea5e9' },
  contract: { label: 'عقد', icon: '📄', color: '#64748b' },
};

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'full_time', label: 'دوام كامل' },
  { key: 'part_time', label: 'دوام جزئي' },
  { key: 'remote', label: 'عن بعد' },
  { key: 'freelance', label: 'عمل حر' },
];

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setJobs(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    let list = jobs;
    if (filter !== 'all') list = list.filter(j => j.job_type === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(j =>
        (j.title || '').toLowerCase().includes(q) ||
        (j.company || '').toLowerCase().includes(q) ||
        (j.description || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [jobs, filter, search]);

  const stats = useMemo(() => {
    const byType = {};
    jobs.forEach(j => { byType[j.job_type] = (byType[j.job_type] || 0) + 1; });
    return { total: jobs.length, byType };
  }, [jobs]);

  function timeAgo(date) {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diff < 60) return 'الآن';
    if (diff < 1440) return `قبل ${Math.floor(diff / 60)} ساعة`;
    if (diff < 10080) return `قبل ${Math.floor(diff / 1440)} يوم`;
    return new Date(date).toLocaleDateString('ar-SY');
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.back()} style={{ color: '#fff', background: 'rgba(255,255,255,.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>💼 الوظائف</h1>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{stats.total} وظيفة متاحة</div>
          </div>
          <Link href="/merchant/jobs/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ أعلن</Link>
        </div>
        <input
          type="search"
          placeholder="🔍 ابحث عن وظيفة، شركة، مدينة..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#0f4d3a' : '#fff', color: filter === f.key ? '#fff' : '#64748b', border: filter === f.key ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {f.label} {f.key !== 'all' && stats.byType[f.key] > 0 && `(${stats.byType[f.key]})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>💼</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>
              {jobs.length === 0 ? 'لا توجد وظائف منشورة بعد' : 'لا توجد نتائج مطابقة'}
            </div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>
              {jobs.length === 0 ? 'كن أول من ينشر وظيفة' : 'جرّب تغيير الفلتر أو البحث'}
            </div>
            {jobs.length === 0 && (
              <Link href="/merchant/jobs/new" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>
                + انشر وظيفة
              </Link>
            )}
          </div>
        ) : (
          filtered.map(job => {
            const type = JOB_TYPES[job.job_type] || JOB_TYPES.full_time;
            return (
              <div key={job.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>🏢 {job.company || job.provider_name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {job.location && <span>📍 {job.location}</span>}
                      <span style={{ color: '#94a3b8' }}>· {timeAgo(job.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ background: `${type.color}15`, color: type.color, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap' }}>
                    {type.icon} {type.label}
                  </div>
                </div>

                {job.description && (
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {job.description}
                  </div>
                )}

                {(job.salary_min || job.salary_max) && (
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 12, fontWeight: 900, color: '#059669' }}>
                    💵 {job.salary_min ? `${Number(job.salary_min).toLocaleString()} - ` : 'يبدأ من '}{Number(job.salary_max || job.salary_min || 0).toLocaleString()} {job.currency || 'SYP'}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6 }}>
                  {job.phone && (
                    <a href={`tel:${job.phone}`} style={{ flex: 1, textAlign: 'center', padding: 10, background: 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 900, border: '1px solid rgba(16,185,129,0.3)' }}>
                      📞 اتصل
                    </a>
                  )}
                  {job.phone && (
                    <a href={`https://wa.me/${(job.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً، أرغب بالتقديم على وظيفة: ${job.title}`)}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', padding: 10, background: 'rgba(37,211,102,0.1)', color: '#25D366', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 900, border: '1px solid rgba(37,211,102,0.3)' }}>
                      💬 واتساب
                    </a>
                  )}
                  {job.email && (
                    <a href={`mailto:${job.email}?subject=${encodeURIComponent('استفسار عن وظيفة: ' + job.title)}`} style={{ flex: 1, textAlign: 'center', padding: 10, background: 'rgba(14,165,233,0.1)', color: '#0284c7', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 900, border: '1px solid rgba(14,165,233,0.3)' }}>
                      ✉️ بريد
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
