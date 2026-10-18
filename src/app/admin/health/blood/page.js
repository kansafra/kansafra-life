'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function AdminBloodPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [tab, setTab] = useState('requests');
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [d, r] = await Promise.all([
        supabase.from('blood_donors').select('*').order('created_at', { ascending: false }),
        supabase.from('blood_requests').select('*').order('created_at', { ascending: false }),
      ]);
      setDonors(d.data || []);
      setRequests(r.data || []);
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  const filteredDonors = useMemo(() => {
    if (filter === 'all') return donors;
    return donors.filter(d => d.blood_type === filter);
  }, [donors, filter]);

  const stats = useMemo(() => {
    const byType = {};
    BLOOD_TYPES.forEach(t => byType[t] = 0);
    donors.filter(d => d.is_available).forEach(d => {
      if (byType[d.blood_type] !== undefined) byType[d.blood_type]++;
    });
    return {
      totalDonors: donors.length,
      availableDonors: donors.filter(d => d.is_available).length,
      openRequests: requests.filter(r => r.status === 'open').length,
      byType,
    };
  }, [donors, requests]);

  async function toggleDonorAvailability(donor) {
    await supabase.from('blood_donors').update({ is_available: !donor.is_available }).eq('id', donor.id);
    success('✅ تم التحديث');
    load();
  }

  async function closeRequest(req) {
    if (!confirm('إغلاق هذا الطلب؟')) return;
    await supabase.from('blood_requests').update({ status: 'closed' }).eq('id', req.id);
    success('✅ تم إغلاق الطلب');
    load();
  }

  async function deleteDonor(donor) {
    if (!confirm(`حذف المتبرع "${donor.full_name}"؟`)) return;
    await supabase.from('blood_donors').delete().eq('id', donor.id);
    success('✅ تم الحذف');
    load();
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin/health" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🩸 بنك الدم</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{stats.availableDonors} متبرع متاح</div>
        </div>
      </div>

      {/* Blood Type Distribution */}
      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>📊 توزيع المتبرعين حسب الفصيلة</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {BLOOD_TYPES.map(type => (
              <button key={type} onClick={() => setFilter(filter === type ? 'all' : type)} style={{
                background: filter === type ? '#dc2626' : stats.byType[type] > 0 ? 'rgba(220,38,38,.08)' : '#f8fafc',
                color: filter === type ? '#fff' : stats.byType[type] > 0 ? '#dc2626' : '#94a3b8',
                border: `1px solid ${filter === type ? '#dc2626' : '#e5e7eb'}`,
                borderRadius: 10, padding: 10, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <div style={{ fontSize: 12, fontWeight: 900 }}>{type}</div>
                <div style={{ fontSize: 16, fontWeight: 900, marginTop: 2 }}>{stats.byType[type]}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setTab('requests')} style={{
            flex: 1, padding: 12,
            background: tab === 'requests' ? '#dc2626' : '#fff',
            color: tab === 'requests' ? '#fff' : '#64748b',
            border: `1px solid ${tab === 'requests' ? '#dc2626' : '#e5e7eb'}`,
            borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
          }}>🚨 الطلبات ({stats.openRequests})</button>
          <button onClick={() => setTab('donors')} style={{
            flex: 1, padding: 12,
            background: tab === 'donors' ? '#dc2626' : '#fff',
            color: tab === 'donors' ? '#fff' : '#64748b',
            border: `1px solid ${tab === 'donors' ? '#dc2626' : '#e5e7eb'}`,
            borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
          }}>💉 المتبرعون ({filter !== 'all' ? filteredDonors.length : donors.length})</button>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Requests Tab */}
        {tab === 'requests' && (
          requests.length === 0 ? (
            <EmptyState icon="🩸" title="لا توجد طلبات دم" description="جميع المرضى بحالة جيدة" />
          ) : requests.map(r => {
            const isOpen = r.status === 'open';
            return (
              <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: `2px solid ${isOpen && r.urgency === 'urgent' ? '#ef4444' : '#e5e7eb'}`, opacity: isOpen ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ background: '#dc2626', color: '#fff', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 900 }}>{r.blood_type}</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{r.units} وحدة</span>
                      {isOpen && r.urgency === 'urgent' && <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900 }}>⚠️ عاجل</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#334155', fontWeight: 800 }}>👤 {r.patient_name}</div>
                    {r.hospital && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>🏥 {r.hospital}</div>}
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, direction: 'ltr', textAlign: 'right' }}>📞 {r.contact_phone}</div>
                  </div>
                  <span style={{ background: isOpen ? 'rgba(16,185,129,.15)' : '#f1f5f9', color: isOpen ? '#10b981' : '#64748b', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, height: 'fit-content' }}>{isOpen ? 'مفتوح' : 'مغلق'}</span>
                </div>
                {r.notes && <div style={{ fontSize: 11.5, color: '#64748b', background: '#f8fafc', padding: 8, borderRadius: 6, marginBottom: 10 }}>{r.notes}</div>}
                {isOpen && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`tel:${r.contact_phone}`} style={{ flex: 1, padding: 10, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, textDecoration: 'none', textAlign: 'center' }}>📞 اتصال</a>
                    <button onClick={() => closeRequest(r)} style={{ flex: 1, padding: 10, background: 'rgba(100,116,139,.1)', color: '#64748b', border: '1px solid rgba(100,116,139,.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✓ إغلاق</button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Donors Tab */}
        {tab === 'donors' && (
          filteredDonors.length === 0 ? (
            <EmptyState icon="💉" title="لا يوجد متبرعون" description="سيظهر المتبرعون المسجلون هنا" />
          ) : filteredDonors.map(d => (
            <div key={d.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb', opacity: d.is_available ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, flexShrink: 0 }}>{d.blood_type}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{d.full_name}</div>
                  {d.city && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📍 {d.city}</div>}
                  <div style={{ fontSize: 11, color: '#64748b', direction: 'ltr', textAlign: 'right', marginTop: 2 }}>{d.phone}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button onClick={() => toggleDonorAvailability(d)} style={{ padding: '6px 10px', background: d.is_available ? 'rgba(16,185,129,.1)' : '#f1f5f9', color: d.is_available ? '#10b981' : '#64748b', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{d.is_available ? '● متاح' : '○ غير متاح'}</button>
                  <a href={`tel:${d.phone}`} style={{ padding: '6px 10px', background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 6, fontSize: 10, fontWeight: 900, textDecoration: 'none', textAlign: 'center' }}>📞</a>
                  <button onClick={() => deleteDonor(d)} style={{ padding: '6px 10px', background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
