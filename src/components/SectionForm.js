'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSectionConfig } from '@/lib/sectionConfigs';

export default function SectionForm({ sectionKey }) {
  const router = useRouter();
  const cfg = getSectionConfig(sectionKey);
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({});

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    const init = {};
    (cfg?.formFields || []).forEach((f) => { init[f.key] = ''; });
    setForm(init);
  }, [router, cfg]);

  if (!cfg) return <div className="sect-empty"><span className="em">❌</span><p>القسم غير موجود</p></div>;

  const update = (k, v) => setForm((o) => ({ ...o, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    for (const f of cfg.formFields) {
      if (f.required && !String(form[f.key] || '').trim()) {
        setError(`${f.label} مطلوب`);
        return;
      }
    }
    if (!supabase) { setError('قاعدة البيانات غير متصلة'); return; }

    setLoading(true);
    const payload = {};
    cfg.formFields.forEach((f) => {
      const v = form[f.key];
      if (v === '' || v === undefined) return;
      if (f.type === 'number') payload[f.key] = Number(v);
      else if (f.type === 'datetime-local') payload[f.key] = new Date(v).toISOString();
      else payload[f.key] = String(v).trim();
    });
    if (cfg.providerField && entity) payload[cfg.providerField] = entity.display_name;

    const { error: err } = await supabase.from(cfg.table).insert(payload);
    setLoading(false);
    if (err) { setError('تعذّر الحفظ: ' + err.message); return; }
    setDone(true);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  if (done) {
    return (
      <div className="prod-page">
        <div className="new-service-success">
          <div className="chk-circle">✓</div>
          <h2>تمت الإضافة</h2>
          <p>تم حفظ البيانات بنجاح</p>
          <Link href={`/${sectionKey}`} className="new-service-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 20 }}>
            عرض القسم
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="new-prod-page">
      <div className="prod-header">
        <Link href={`/${sectionKey}`} className="prod-back">→</Link>
        <span className="prod-header-title">{cfg.icon} {cfg.title}</span>
      </div>
      <form className="new-prod-form" onSubmit={submit}>
        {cfg.formFields.map((f) => (
          <div key={f.key} className="new-service-field">
            <label className="new-service-label">
              {f.label} {f.required && <span className="req">*</span>}
            </label>
            {f.type === 'textarea' ? (
              <textarea className="new-service-textarea" value={form[f.key] || ''} onChange={(e) => update(f.key, e.target.value)} />
            ) : f.type === 'select' ? (
              <select className="new-service-select" value={form[f.key] || ''} onChange={(e) => update(f.key, e.target.value)}>
                <option value="">— اختر —</option>
                {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                className="new-service-input"
                type={f.type || 'text'}
                value={form[f.key] || ''}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder || ''}
              />
            )}
          </div>
        ))}
        {error && <div style={{ color: '#dc2626', padding: 12, background: 'rgba(220,38,38,.1)', borderRadius: 12, fontSize: 13, fontWeight: 700 }}>{error}</div>}
        <button className="new-service-submit" type="submit" disabled={loading}>
          {loading ? '... جارٍ الحفظ' : '✓ إضافة'}
        </button>
      </form>
    </div>
  );
}
