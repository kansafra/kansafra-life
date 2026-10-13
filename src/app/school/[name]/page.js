'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SchoolPage() {
  const params = useParams();
  const schoolName = decodeURIComponent(params?.name || '');
  const [classes, setClasses] = useState([]);
  const [filesCount, setFilesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolName) return;
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const [classRes, filesRes] = await Promise.all([
        supabase.from('classes').select('*').eq('entity_name', schoolName).order('grade', { ascending: true }),
        supabase.from('class_files').select('id'),
      ]);
      setClasses(Array.isArray(classRes.data) ? classRes.data : []);
      setFilesCount(Array.isArray(filesRes.data) ? filesRes.data.length : 0);
      setLoading(false);
    }
    load();
  }, [schoolName]);

  return (
    <div className="doc-page">
      <header className="school-hero">
        <div className="doc-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
            <span style={{ letterSpacing: 3, fontSize: 11, fontWeight: 800, opacity: .7 }}>SCHOOL</span>
          </div>
          <h1 className="doc-title">{schoolName}</h1>
          <p className="doc-sub">{classes.length} صف · {filesCount} ملف تعليمي</p>
        </div>
      </header>

      {loading ? (
        <div className="trans-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : classes.length === 0 ? (
        <div className="trans-empty">
          <span className="em">📚</span>
          <p>لم تُضف الصفوف بعد</p>
        </div>
      ) : (
        <div className="classes-grid">
          {classes.map((c) => (
            <Link key={c.id} href={`/school/${encodeURIComponent(schoolName)}/class/${c.id}`} className="class-card">
              <div className="class-cover">
                {c.cover_url ? <img src={c.cover_url} alt="" /> : '📚'}
              </div>
              <div className="class-body">
                <div className="class-name">{c.grade} {c.section || ''}</div>
                {c.teacher_name && <div className="class-meta">👨‍🏫 {c.teacher_name}</div>}
                <div className="class-counts">
                  <span>👥 {c.students_count || 0}</span>
                  <span className="files">📄 {c.capacity ? `${c.capacity} مقعد` : '—'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
