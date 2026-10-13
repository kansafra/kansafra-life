'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewClass() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({ grade: '', section: '', teacher_name: '', capacity: '30', description: '', cover_url: '' });

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
    if (!f.grade.trim()) { setError('اسم الصف مطلوب'); return; }
    setLoading(true);
    const { error: err } = await supabase.from('classes').insert({
      entity_name: entity.display_name,
      grade: f.grade.trim(),
      section: f.section.trim() || null,
      teacher_name: f.teacher_name.trim() || null,
      capacity: Number(f.capacity) || 30,
      description: f.description.trim() || null,
      cover_url: f.cover_url.trim() || null,
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
          <h2>تم إضافة الصف</h2>
          <Link href="/merchant" className="new-service-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            العودة للوحة
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="new-prod-page">
      <div className="prod-header">
        <Link href="/merchant" className="prod-back">→</Link>
        <span className="prod-header-title">صف جديد</span>
      </div>
      <form className="new-prod-form" onSubmit={submit}>
        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">الصف <span className="req">*</span></label>
            <input className="new-service-input" placeholder="الأول / الثاني..." value={f.grade} onChange={(e) => update('grade', e.target.value)} />
          </div>
          <div className="new-service-field">
            <label className="new-service-label">الشعبة</label>
            <input className="new-service-input" placeholder="أ / ب..." value={f.section} onChange={(e) => update('section', e.target.value)} />
          </div>
        </div>
        <div className="new-service-field">
          <label className="new-service-label">المعلم المسؤول</label>
          <input className="new-service-input" placeholder="اسم المعلم" value={f.teacher_name} onChange={(e) => update('teacher_name', e.target.value)} />
        </div>
        <div className="new-service-field">
          <label className="new-service-label">السعة</label>
          <input className="new-service-input" type="number" placeholder="30" value={f.capacity} onChange={(e) => update('capacity', e.target.value)} />
        </div>
        <div className="new-service-field">
          <label className="new-service-label">صورة الغلاف (رابط)</label>
          <input className="new-service-input" type="url" placeholder="https://..." value={f.cover_url} onChange={(e) => update('cover_url', e.target.value)} />
        </div>
        <div className="new-service-field">
          <label className="new-service-label">وصف</label>
          <textarea className="new-service-textarea" placeholder="نبذة عن الصف..." value={f.description} onChange={(e) => update('description', e.target.value)} />
        </div>
        {error && <div style={{ color: '#dc2626', fontSize: 13, fontWeight: 700, padding: 12, background: 'rgba(220,38,38,.1)', borderRadius: 12 }}>{error}</div>}
        <button className="new-service-submit" type="submit" disabled={loading}>
          {loading ? '... جارٍ الحفظ' : '✓ إضافة الصف'}
        </button>
      </form>
    </div>
  );
}
