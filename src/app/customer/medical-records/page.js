'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import EmptyState from '@/components/EmptyState';

export default function CustomerMedicalRecords() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('records');

  useEffect(() => {
    let c = null;
    try { c = JSON.parse(localStorage.getItem('sanad_customer') || 'null'); } catch {}
    if (!c) { router.replace('/login'); return; }
    load(c.phone);
  }, [router]);

  async function load(phone) {
    if (!supabase) { setLoading(false); return; }
    try {
      const [rRes, aRes] = await Promise.all([
        supabase.from('medical_records').select('*').eq('patient_phone', phone).order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').eq('customer_phone', phone).eq('status', 'completed').order('appointment_date', { ascending: false }),
      ]);
      setRecords(rRes.data || []);
      setAppointments(aRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  const tabs = [
    { k: 'records', label: '🏥 السجلات', count: records.length },
    { k: 'appointments', label: '✅ زيارات', count: appointments.length },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: '#dc2626', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/customer" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>📋 سجلي الطبي</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>تاريخك الصحي الكامل</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {tabs.map(t => (
            <button key={t.k} onClick={() => setFilter(t.k)} style={{
              flex: 1, padding: 12,
              background: filter === t.k ? '#dc2626' : '#fff',
              color: filter === t.k ? '#fff' : '#64748b',
              border: `1px solid ${filter === t.k ? '#dc2626' : '#e5e7eb'}`,
              borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            }}>{t.label} ({t.count})</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filter === 'records' && (
          records.length === 0 ? (
            <EmptyState icon="📋" title="لا توجد سجلات طبية" description="ستظهر هنا سجلاتك عند زيارة أي طبيب" actionLabel="الأطباء" actionHref="/doctor" />
          ) : records.map(r => (
            <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>🏥 {r.doctor_name || 'عيادة'}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📅 {new Date(r.created_at).toLocaleDateString('ar-EG')}</div>
                </div>
              </div>
              {r.diagnosis && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', marginBottom: 4 }}>🔍 التشخيص</div>
                  <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}>{r.diagnosis}</div>
                </div>
              )}
              {r.prescription && (
                <div style={{ padding: 10, background: 'rgba(16,185,129,.08)', borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', marginBottom: 4 }}>💊 الوصفة</div>
                  <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{r.prescription}</div>
                </div>
              )}
              {r.notes && (
                <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.6 }}>📝 {r.notes}</div>
              )}
            </div>
          ))
        )}

        {filter === 'appointments' && (
          appointments.length === 0 ? (
            <EmptyState icon="✅" title="لا توجد زيارات سابقة" description="ستظهر زياراتك المكتملة هنا" />
          ) : appointments.map(a => (
            <div key={a.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>🏥 {a.doctor_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📅 {new Date(a.appointment_date).toLocaleDateString('ar-EG')} · 🕐 {a.appointment_time}</div>
                </div>
                <span style={{ background: 'rgba(16,185,129,.15)', color: '#10b981', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, height: 'fit-content' }}>✅ مكتمل</span>
              </div>
              {a.notes && <div style={{ fontSize: 11.5, color: '#64748b', padding: 8, background: '#f8fafc', borderRadius: 6 }}>📝 {a.notes}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
