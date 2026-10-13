'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const FILE_ICONS = {
  pdf: { icon: '📄', cls: 'pdf' },
  video: { icon: '🎬', cls: 'video' },
  image: { icon: '🖼️', cls: 'image' },
  audio: { icon: '🎧', cls: 'audio' },
  doc: { icon: '📝', cls: '' },
  other: { icon: '📁', cls: '' },
};

export default function ClassPage() {
  const params = useParams();
  const schoolName = decodeURIComponent(params?.name || '');
  const classId = params?.id;

  const [cls, setCls] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!classId) return;
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const [c, f] = await Promise.all([
        supabase.from('classes').select('*').eq('id', classId).single(),
        supabase.from('class_files').select('*').eq('class_id', classId).order('created_at', { ascending: false }),
      ]);
      setCls(c.data);
      setFiles(Array.isArray(f.data) ? f.data : []);
      setLoading(false);
    }
    load();
  }, [classId]);

  const filtered = filter === 'all' ? files : files.filter((x) => x.file_type === filter);

  const types = ['all', ...new Set(files.map((f) => f.file_type || 'other'))];

  if (loading) return <div className="trans-empty" style={{ padding: 80 }}><span className="em">⏳</span><p>جارٍ التحميل...</p></div>;
  if (!cls) return <div className="trans-empty" style={{ padding: 80 }}><span className="em">🔍</span><p>الصف غير موجود</p></div>;

  return (
    <div className="doc-page">
      <header className="school-hero">
        <div className="doc-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Link href={`/school/${encodeURIComponent(schoolName)}`} style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
            <span style={{ letterSpacing: 3, fontSize: 11, fontWeight: 800, opacity: .7 }}>CLASS</span>
          </div>
          <h1 className="doc-title">{cls.grade} {cls.section || ''}</h1>
          <p className="doc-sub">{cls.teacher_name ? `المعلم: ${cls.teacher_name}` : schoolName}</p>
        </div>
      </header>

      <div className="store-cat-scroll" style={{ paddingTop: 14 }}>
        <button className={`store-cat-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} type="button">
          📁 الكل ({files.length})
        </button>
        {types.filter((t) => t !== 'all').map((t) => (
          <button
            key={t}
            className={`store-cat-chip ${filter === t ? 'active' : ''}`}
            onClick={() => setFilter(t)}
            type="button"
          >
            {FILE_ICONS[t]?.icon || '📁'} {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="trans-empty">
          <span className="em">📄</span>
          <p>لا توجد ملفات في هذا القسم</p>
        </div>
      ) : (
        <div className="files-list">
          {filtered.map((f) => {
            const icon = FILE_ICONS[f.file_type] || FILE_ICONS.other;
            return (
              <a
                key={f.id}
                href={f.file_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="file-card"
              >
                <div className={`file-icon ${icon.cls}`}>{icon.icon}</div>
                <div className="file-info">
                  <div className="file-title">{f.title}</div>
                  <div className="file-meta">
                    {f.category && `${f.category} · `}
                    {f.file_size_kb ? `${f.file_size_kb} KB` : ''}
                  </div>
                </div>
                <span style={{ color: 'var(--n-300)' }}>⬇</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
