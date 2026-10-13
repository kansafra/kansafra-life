'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function EnvironmentPage() {
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [r, p] = await Promise.all([
      supabase.from('env_reports').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('recycling_points').select('*'),
    ]);
    setReports(Array.isArray(r.data) ? r.data : []);
    setPoints(Array.isArray(p.data) ? p.data : []);
    setLoading(false);
  }

  async function addReport() {
    const type = prompt('نوع التبليغ (نفايات/تلوث/تشجير):');
    if (!type) return;
    const location = prompt('الموقع:');
    const desc = prompt('الوصف:');
    const name = prompt('اسمك:');
    if (!name) return;
    const phone = prompt('هاتفك (اختياري):') || '';
    await supabase.from('env_reports').insert({
      reporter_name: name, reporter_phone: phone, report_type: type,
      location_text: location, description: desc, status: 'open',
    });
    alert('✅ تم إرسال التبليغ');
    load();
  }

  return (
    <div className="ent-page">
      <div className="inv-header">
        <Link href="/" className="inv-back">→</Link>
        <span className="inv-title">🌿 البيئة</span>
        <button className="mng-add-btn" onClick={addReport} type="button">+ تبليغ</button>
      </div>

      <div className="store-cat-scroll" style={{ paddingTop: 14 }}>
        <button className={`store-cat-chip ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')} type="button">📋 التبليغات ({reports.length})</button>
        <button className={`store-cat-chip ${tab === 'points' ? 'active' : ''}`} onClick={() => setTab('points')} type="button">♻️ إعادة تدوير ({points.length})</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : tab === 'reports' ? (
        reports.length === 0 ? (
          <div className="sect-empty"><span className="em">🌿</span><p>لا توجد تبليغات</p></div>
        ) : (
          <div className="sect-list" style={{ paddingTop: 14 }}>
            {reports.map((r) => (
              <div key={r.id} className="dlv-card" style={{ borderRightColor: '#10b981' }}>
                <div className="dlv-head">
                  <div className="dlv-name">{r.report_type}</div>
                  <span className={`dlv-status ${r.status === 'open' ? 'busy' : 'available'}`}>
                    {r.status === 'open' ? '⏳ قيد المعالجة' : '✓ تم'}
                  </span>
                </div>
                {r.location_text && <div className="dlv-info">📍 {r.location_text}</div>}
                {r.description && <div className="dlv-info">{r.description}</div>}
                <div style={{ fontSize: 10.5, color: 'var(--n-400)', marginTop: 6 }}>
                  {__safeDate(r.created_at).toLocaleDateString('ar-EG')}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        points.length === 0 ? (
          <div className="sect-empty"><span className="em">♻️</span><p>لا توجد نقاط إعادة تدوير</p></div>
        ) : (
          <div className="sect-list" style={{ paddingTop: 14 }}>
            {points.map((p) => (
              <div key={p.id} className="dlv-card" style={{ borderRightColor: '#059669' }}>
                <div className="dlv-head"><div className="dlv-name">♻️ {p.name}</div></div>
                {p.location_text && <div className="dlv-info">📍 {p.location_text}</div>}
                {p.working_hours && <div className="dlv-info">🕐 {p.working_hours}</div>}
                {p.phone && <div className="dlv-info">📞 {p.phone}</div>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
