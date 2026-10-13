'use client';

// Safe date for hydration
const __safeDate = (d) => (typeof window !== 'undefined' ? __safeDate(d) : __safeDate(0));

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodPage() {
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('requests');
  const [filterType, setFilterType] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [reqRes, donRes] = await Promise.all([
      supabase.from('blood_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }),
      supabase.from('blood_donors').select('*').eq('is_available', true).order('created_at', { ascending: false }),
    ]);
    setRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
    setDonors(Array.isArray(donRes.data) ? donRes.data : []);
    setLoading(false);
  }

  const filteredReqs = filterType ? requests.filter((r) => r.blood_type === filterType) : requests;
  const filteredDonors = filterType ? donors.filter((d) => d.blood_type === filterType) : donors;

  return (
    <div className="doc-page">
      <header className="doc-hero" style={{ background: 'linear-gradient(160deg, #dc2626 0%, #b91c1c 60%, #991b1b 100%)' }}>
        <div className="doc-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Link href="/" style={{ color: '#fff', fontSize: 22, textDecoration: 'none' }}>→</Link>
            <span style={{ letterSpacing: 3, fontSize: 11, fontWeight: 800, opacity: .7 }}>BLOOD</span>
          </div>
          <h1 className="doc-title">التبرع بالدم</h1>
          <p className="doc-sub">حياة شخص قد تعتمد على تبرعك</p>
        </div>
      </header>

      <div className="store-cat-scroll" style={{ paddingTop: 14 }}>
        <button className={`store-cat-chip ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')} type="button">
          🩸 الطلبات ({requests.length})
        </button>
        <button className={`store-cat-chip ${tab === 'donors' ? 'active' : ''}`} onClick={() => setTab('donors')} type="button">
          ❤️ المتبرعون ({donors.length})
        </button>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--n-700)', marginBottom: 10 }}>تصفية حسب الفصيلة</h3>
      </div>
      <div className="blood-grid">
        <button className={`blood-type ${filterType === '' ? 'active' : ''}`} onClick={() => setFilterType('')} type="button" style={{ fontSize: 13 }}>الكل</button>
        {TYPES.map((t) => (
          <button
            key={t}
            className={`blood-type ${filterType === t ? 'active' : ''}`}
            onClick={() => setFilterType(t)}
            type="button"
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px 40px' }}>
        {loading ? (
          <div className="trans-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
        ) : tab === 'requests' ? (
          filteredReqs.length === 0 ? (
            <div className="trans-empty"><span className="em">🩸</span><p>لا توجد طلبات دم</p></div>
          ) : (
            filteredReqs.map((r) => (
              <div key={r.id} className="blood-request-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="blood-urgency ${r.urgency}">{r.urgency === 'critical' ? 'عاجل جداً' : r.urgency === 'urgent' ? 'عاجل' : 'عادي'}</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#dc2626', direction: 'ltr' }}>{r.blood_type}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--n-900)', marginBottom: 6 }}>{r.requester_name}</div>
                {r.hospital && <div style={{ fontSize: 12.5, color: 'var(--n-500)', fontWeight: 600, marginBottom: 4 }}>🏥 {r.hospital}</div>}
                {r.notes && <div style={{ fontSize: 12.5, color: 'var(--n-500)', marginBottom: 8 }}>{r.notes}</div>}
                <div style={{ fontSize: 12, color: 'var(--n-400)', marginBottom: 12 }}>
                  {r.units_needed} وحدة · {__safeDate(r.created_at).toLocaleDateString('ar-EG')}
                </div>
                <a href={`tel:${r.requester_phone}`} className="trans-btn call" style={{ display: 'flex' }}>
                  📞 اتصل الآن
                </a>
              </div>
            ))
          )
        ) : (
          filteredDonors.length === 0 ? (
            <div className="trans-empty"><span className="em">❤️</span><p>لا يوجد متبرعون</p></div>
          ) : (
            filteredDonors.map((d) => (
              <div key={d.id} className="trans-card" style={{ borderRightColor: '#dc2626' }}>
                <div className="trans-head">
                  <div className="trans-avatar" style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', fontSize: 18, fontWeight: 900, color: '#fff', direction: 'ltr' }}>
                    {d.blood_type}
                  </div>
                  <div className="trans-info">
                    <div className="trans-name">{d.full_name}</div>
                    {d.city && <div className="trans-info-row"><strong>المدينة:</strong> {d.city}</div>}
                    {d.last_donation && <div className="trans-info-row"><strong>آخر تبرع:</strong> {__safeDate(d.last_donation).toLocaleDateString('ar-EG')}</div>}
                  </div>
                </div>
                <a href={`tel:${d.phone}`} className="trans-btn call" style={{ display: 'flex', marginTop: 8 }}>
                  📞 تواصل
                </a>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
