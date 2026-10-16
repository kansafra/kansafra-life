'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function NewPlayer() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({ full_name: '', position: '', jersey_number: '', birth_year: '', photo_url: '' });

  useEffect(() => {
    let stored = null;
    try { stored = getSession(); } catch (e) {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
  }, [router]);

  async function submit(e) {
    e.preventDefault();
    if (!f.full_name.trim()) { setError('اسم اللاعب مطلوب'); return; }
    setLoading(true);
    const { error: err } = await supabase.from('sports_players').insert({
      club_name: entity.display_name,
      full_name: f.full_name.trim(),
      position: f.position.trim() || null,
      jersey_number: Number(f.jersey_number) || null,
      birth_year: Number(f.birth_year) || null,
      photo_url: f.photo_url.trim() || null,
    });
    setLoading(false);
    if (err) { setError('تعذّر الحفظ'); return; }
    setDone(true);
  }

  if (!entity) return <div className="trans-empty" style={{ padding: 80 }}>...</div>;
  if (done) return (
    <div className="prod-page">
      <div className="new-service-success">
        <div className="chk-circle">✓</div>
        <h2>تم إضافة اللاعب</h2>
        <Link href="/merchant" className="new-service-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>العودة</Link>
      </div>
    </div>
  );

  return (
    <div className="new-prod-page">
      <div className="prod-header"><Link href="/merchant" className="prod-back">→</Link><span className="prod-header-title">لاعب جديد</span></div>
      <form className="new-prod-form" onSubmit={submit}>
        <div className="new-service-field">
          <label className="new-service-label">الاسم الكامل <span className="req">*</span></label>
          <input className="new-service-input" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
        </div>
        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">المركز</label>
            <select className="new-service-select" value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })}>
              <option value="">— اختر —</option>
              <option value="حارس">حارس</option>
              <option value="مدافع">مدافع</option>
              <option value="وسط">وسط</option>
              <option value="مهاجم">مهاجم</option>
            </select>
          </div>
          <div className="new-service-field">
            <label className="new-service-label">رقم القميص</label>
            <input className="new-service-input" type="number" value={f.jersey_number} onChange={(e) => setF({ ...f, jersey_number: e.target.value })} />
          </div>
        </div>
        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">سنة الميلاد</label>
            <input className="new-service-input" type="number" value={f.birth_year} onChange={(e) => setF({ ...f, birth_year: e.target.value })} />
          </div>
          <div className="new-service-field">
            <label className="new-service-label">رابط الصورة</label>
            <input className="new-service-input" type="url" value={f.photo_url} onChange={(e) => setF({ ...f, photo_url: e.target.value })} />
          </div>
        </div>
        {error && <div style={{ color: '#dc2626', padding: 12, background: 'rgba(220,38,38,.1)', borderRadius: 12, fontSize: 13, fontWeight: 700 }}>{error}</div>}
        <button className="new-service-submit" type="submit" disabled={loading}>{loading ? '...' : '✓ إضافة'}</button>
      </form>
    </div>
  );
}
