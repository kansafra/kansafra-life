'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const JOB_TYPES = [
  { key: 'full_time', label: 'دوام كامل', icon: '💼' },
  { key: 'part_time', label: 'دوام جزئي', icon: '⏰' },
  { key: 'remote', label: 'عن بعد', icon: '🏠' },
  { key: 'freelance', label: 'عمل حر', icon: '🎯' },
  { key: 'contract', label: 'عقد', icon: '📄' },
];

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشطة' },
  { key: 'inactive', label: 'مخفية' },
];

export default function MerchantJobsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    loadJobs();
  }, [user, userLoading, dataOwnerName]);

  async function loadJobs() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('provider_name', dataOwnerName)
        .order('created_at', { ascending: false });
      setJobs(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function toggleActive(job) {
    const { error } = await supabase.from('jobs').update({ is_active: !job.is_active }).eq('id', job.id);
    if (error) toastError('فشل التحديث');
    else {
      success(job.is_active ? '🙈 تم الإخفاء' : '✅ تم الإظهار');
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, is_active: !j.is_active } : j));
    }
  }

  async function handleDelete(job) {
    if (!confirm(`حذف الوظيفة "${job.title}" نهائياً؟`)) return;
    setDeleting(job.id);
    const { error } = await supabase.from('jobs').delete().eq('id', job.id);
    if (error) toastError('فشل الحذف');
    else { success('🗑️ تم الحذف'); setJobs(prev => prev.filter(j => j.id !== job.id)); }
    setDeleting(null);
  }

  function openEdit(job) {
    setEditForm({
      title: job.title || '',
      company: job.company || '',
      description: job.description || '',
      location: job.location || '',
      job_type: job.job_type || 'full_time',
      salary_min: job.salary_min || '',
      salary_max: job.salary_max || '',
      phone: job.phone || '',
      email: job.email || '',
    });
    setEditing(job);
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editForm.title?.trim()) { toastError('عنوان الوظيفة مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        title: editForm.title.trim(),
        company: editForm.company?.trim() || null,
        description: editForm.description?.trim() || null,
        location: editForm.location?.trim() || null,
        job_type: editForm.job_type,
        salary_min: editForm.salary_min ? Number(editForm.salary_min) : null,
        salary_max: editForm.salary_max ? Number(editForm.salary_max) : null,
        phone: editForm.phone?.trim() || null,
        email: editForm.email?.trim() || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('jobs').update(payload).eq('id', editing.id);
      if (error) throw error;
      success('✅ تم حفظ التعديلات');
      setJobs(prev => prev.map(j => j.id === editing.id ? { ...j, ...payload } : j));
      setEditing(null);
    } catch (err) { toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  const stats = useMemo(() => {
    const active = jobs.filter(j => j.is_active).length;
    const inactive = jobs.length - active;
    return { total: jobs.length, active, inactive };
  }, [jobs]);

  const filtered = useMemo(() => {
    let list = jobs;
    if (filter === 'active') list = list.filter(j => j.is_active);
    if (filter === 'inactive') list = list.filter(j => !j.is_active);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(j => (j.title || '').toLowerCase().includes(q));
    }
    return list;
  }, [jobs, filter, search]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>💼 إدارة الوظائف</h1>
          <Link href="/merchant/jobs/new" style={{ background: '#fbbf24', color: '#0f4d3a', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>+ جديد</Link>
        </div>
        <input
          type="search"
          placeholder="🔍 ابحث في وظائفك..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#fff' : 'rgba(255,255,255,0.1)', color: filter === f.key ? '#0f4d3a' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {f.label} {f.key === 'active' && stats.active > 0 && `(${stats.active})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الكل" value={stats.total} color="#0f4d3a" />
          <StatBox label="نشطة" value={stats.active} color="#10b981" />
          <StatBox label="مخفية" value={stats.inactive} color="#94a3b8" />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💼</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>
              {jobs.length === 0 ? 'لم تنشر أي وظيفة بعد' : 'لا توجد نتائج مطابقة'}
            </div>
            {jobs.length === 0 && (
              <Link href="/merchant/jobs/new" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>
                + انشر أول وظيفة
              </Link>
            )}
          </div>
        ) : filtered.map(job => {
          const type = JOB_TYPES.find(t => t.key === job.job_type) || JOB_TYPES[0];
          return (
            <div key={job.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #e2e8f0', opacity: job.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{job.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {job.company && <span>🏢 {job.company}</span>}
                    {job.location && <span>📍 {job.location}</span>}
                  </div>
                </div>
                <div style={{ background: job.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)', color: job.is_active ? '#10b981' : '#64748b', padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap' }}>
                  {type.icon} {job.is_active ? 'نشطة' : 'مخفية'}
                </div>
              </div>

              {job.description && (
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {job.description}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => openEdit(job)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️ تعديل</button>
                <button onClick={() => toggleActive(job)} style={btnStyle(job.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', job.is_active ? '#f59e0b' : '#10b981')}>
                  {job.is_active ? '🙈 إخفاء' : '👁️ إظهار'}
                </button>
                <button onClick={() => handleDelete(job)} disabled={deleting === job.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>
                  {deleting === job.id ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>✏️ تعديل الوظيفة</h2>
              <button onClick={() => setEditing(null)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveEdit}>
              <div style={fieldStyle}><label style={labelStyle}>العنوان *</label>
                <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required style={inputStyle} /></div>
              <div style={fieldStyle}><label style={labelStyle}>الشركة</label>
                <input value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} style={inputStyle} /></div>
              <div style={fieldStyle}><label style={labelStyle}>النوع</label>
                <select value={editForm.job_type} onChange={e => setEditForm({ ...editForm, job_type: e.target.value })} style={inputStyle}>
                  {JOB_TYPES.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
                </select></div>
              <div style={fieldStyle}><label style={labelStyle}>الموقع</label>
                <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} style={inputStyle} /></div>
              <div style={fieldStyle}><label style={labelStyle}>الوصف</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ ...inputStyle, height: 100, resize: 'none' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={fieldStyle}><label style={labelStyle}>الراتب من</label>
                  <input type="number" value={editForm.salary_min} onChange={e => setEditForm({ ...editForm, salary_min: e.target.value })} style={inputStyle} /></div>
                <div style={fieldStyle}><label style={labelStyle}>الراتب إلى</label>
                  <input type="number" value={editForm.salary_max} onChange={e => setEditForm({ ...editForm, salary_max: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={fieldStyle}><label style={labelStyle}>الهاتف</label>
                <input type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} /></div>
              <div style={fieldStyle}><label style={labelStyle}>البريد</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} /></div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
                {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ التعديلات'}
              </button>
            </form>
          </div>
        </div>
      )}

      <Link href="/merchant/jobs/new" style={{ position: 'fixed', bottom: 20, left: 20, right: 20, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: 16, borderRadius: 14, textAlign: 'center', textDecoration: 'none', fontSize: 15, fontWeight: 900, boxShadow: '0 10px 30px rgba(16,185,129,0.4)', zIndex: 30 }}>
        + نشر وظيفة جديدة
      </Link>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </div>
  );
}

const btnStyle = (bg, color) => ({ flex: 1, minWidth: 80, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
const fieldStyle = { marginBottom: 12 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
