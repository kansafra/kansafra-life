'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewClassFile() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id;
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({ title: '', description: '', file_type: 'pdf', file_url: '', category: '', file_size_kb: '' });

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
  }, [router]);

  const update = (k, v) => setF((o) => ({ ...o, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!f.title.trim()) { setError('عنوان الملف مطلوب'); return; }
    if (!f.file_url.trim()) { setError('رابط الملف مطلوب'); return; }
    setLoading(true);
    const { error: err } = await supabase.from('class_files').insert({
      class_id: classId,
      title: f.title.trim(),
      description: f.description.trim() || null,
      file_type: f.file_type,
      file_url: f.file_url.trim(),
      category: f.category.trim() || null,
      file_size_kb: Number(f.file_size_kb) || null,
    });
    setLoading(false);
    if (err) { setError('تعذّر الحفظ'); return; }
    setDone(true);
  }

  if (!entity) return <div className="trans-empty" style={{ padding: 80 }}><span className="em">⏳</span><p>جارٍ التحميل...</p></div>;

  if (done) {
    return (
      <div className="prod-page">
        <div className="new-service-success">
          <div className="chk-circle">✓</div>
          <h2>تم رفع الملف</h2>
          <Link href="/merchant" className="new-service-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            العودة
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="new-prod-page">
      <div className="prod-header">
        <Link href="/merchant" className="prod-back">→</Link>
        <span className="prod-header-title">ملف جديد</span>
      </div>
      <form className="new-prod-form" onSubmit={submit}>
        <div className="new-service-field">
          <label className="new-service-label">عنوان الملف <span className="req">*</span></label>
          <input className="new-service-input" placeholder="مثال: شرح الوحدة الأولى" value={f.title} onChange={(e) => update('title', e.target.value)} />
        </div>
        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">نوع الملف</label>
            <select className="new-service-select" value={f.file_type} onChange={(e) => update('file_type', e.target.value)}>
              <option value="pdf">📄 PDF</option>
              <option value="video">🎬 فيديو</option>
              <option value="audio">🎧 صوتي</option>
              <option value="image">🖼️ صورة</option>
              <option value="doc">📝 مستند</option>
              <option value="other">📁 أخرى</option>
            </select>
          </div>
          <div className="new-service-field">
            <label className="new-service-label">الفئة</label>
            <input className="new-service-input" placeholder="رياضيات / عربي..." value={f.category} onChange={(e) => update('category', e.target.value)} />
          </div>
        </div>
        <div className="new-service-field">
          <label className="new-service-label">رابط الملف <span className="req">*</span></label>
          <input className="new-service-input" type="url" placeholder="https://drive.google.com/..." value={f.file_url} onChange={(e) => update('file_url', e.target.value)} />
        </div>
        <div className="new-service-field">
          <label className="new-service-label">حجم الملف (KB) — اختياري</label>
          <input className="new-service-input" type="number" value={f.file_size_kb} onChange={(e) => update('file_size_kb', e.target.value)} />
        </div>
        <div className="new-service-field">
          <label className="new-service-label">وصف مختصر</label>
          <textarea className="new-service-textarea" value={f.description} onChange={(e) => update('description', e.target.value)} />
        </div>
        {error && <div style={{ color: '#dc2626', fontSize: 13, fontWeight: 700, padding: 12, background: 'rgba(220,38,38,.1)', borderRadius: 12 }}>{error}</div>}
        <button className="new-service-submit" type="submit" disabled={loading}>
          {loading ? '... جارٍ الحفظ' : '✓ إضافة الملف'}
        </button>
      </form>
    </div>
  );
}
