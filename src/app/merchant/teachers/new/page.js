'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function NewTeacherPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({
    full_name: '',
    phone: '',
    email: '',
    specialization: '',
    salary: '',
  });

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession(s);
  }, [router]);

  const update = (k, v) => setF((o) => ({ ...o, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!f.full_name.trim()) { setError('اسم الأستاذ مطلوب'); return; }
    setLoading(true);

    const payload = {
      entity_id: session.id,
      entity_name: session.display_name,
      full_name: f.full_name.trim(),
      phone: f.phone.trim() || null,
      email: f.email.trim() || null,
      specialization: f.specialization.trim() || null,
      salary: parseFloat(f.salary) || 0,
      is_active: true,
    };

    const { error: err } = await supabase.from('teachers').insert(payload);
    setLoading(false);
    if (err) { setError('تعذّر: ' + err.message); return; }
    setDone(true);
  }

  if (!session) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  if (done) {
    return (
      <div className="prod-page">
        <div className="new-service-success">
          <div className="chk-circle">✓</div>
          <h2>تمت الإضافة</h2>
          <p>تم إضافة الأستاذ بنجاح</p>
          <Link href="/merchant/teachers" className="new-service-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 20 }}>
            عرض الأساتذة
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="new-prod-page">
      <div className="prod-header">
        <Link href="/merchant/teachers" className="prod-back">→</Link>
        <span className="prod-header-title">👨‍🏫 أستاذ جديد</span>
      </div>
      <form className="new-prod-form" onSubmit={submit}>
        <div className="new-service-field">
          <label className="new-service-label">الاسم الكامل *</label>
          <input className="new-service-input" value={f.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="محمد أحمد" />
        </div>

        <div className="new-prod-row">
          <div className="new-service-field">
            <label className="new-service-label">📞 الهاتف</label>
            <input className="new-service-input" type="tel" value={f.phone} onChange={(e) => update('phone', e.target.value)} placeholder="09XXXXXXXX" style={{ direction: 'ltr' }} />
          </div>
          <div className="new-service-field">
            <label className="new-service-label">📚 التخصص</label>
            <input className="new-service-input" value={f.specialization} onChange={(e) => update('specialization', e.target.value)} placeholder="رياضيات" />
          </div>
        </div>

        <div className="new-service-field">
          <label className="new-service-label">📧 الإيميل</label>
          <input className="new-service-input" type="email" value={f.email} onChange={(e) => update('email', e.target.value)} placeholder="teacher@example.com" style={{ direction: 'ltr' }} />
        </div>

        <div className="new-service-field">
          <label className="new-service-label">💰 الراتب الشهري</label>
          <input className="new-service-input" type="number" value={f.salary} onChange={(e) => update('salary', e.target.value)} placeholder="0" />
        </div>

        {error && <div style={{ color: '#dc2626', padding: 12, background: 'rgba(220,38,38,.1)', borderRadius: 12, fontSize: 13, fontWeight: 700 }}>{error}</div>}

        <button className="new-service-submit" type="submit" disabled={loading}>
          {loading ? '... جارٍ الحفظ' : '✓ إضافة'}
        </button>
      </form>
    </div>
  );
}
