'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const STATUS = {
  pending: { label: 'قيد المراجعة', color: '#f59e0b', icon: '⏳' },
  confirmed: { label: 'مؤكد', color: '#10b981', icon: '✅' },
  completed: { label: 'مكتمل', color: '#64748b', icon: '✔️' },
  cancelled: { label: 'ملغي', color: '#ef4444', icon: '❌' },
  no_show: { label: 'لم يحضر', color: '#94a3b8', icon: '⚠️' },
};

export default function MyAppointmentsPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    let c = null;
    try { c = JSON.parse(localStorage.getItem('sanad_customer') || 'null'); } catch {}
    if (!c) { router.replace('/login'); return; }
    load(c.phone);
  }, [router]);

  async function load(phone) {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('appointments').select('*').eq('customer_phone', phone).order('appointment_date', { ascending: false });
      setAppointments(data || []);
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  const now = new Date();
  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status) && a.appointment_date && new Date(a.appointment_date) >= now);
  const past = appointments.filter(a => ['completed', 'cancelled', 'no_show'].includes(a.status) || (a.appointment_date && new Date(a.appointment_date) < now));
  const filtered = filter === 'upcoming' ? upcoming : past;

  async function cancel(a) {
    if (!confirm('إلغاء الموعد؟')) return;
    try {
      const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', a.id);
      if (error) throw error;
      success('تم إلغاء الموعد');
      load(JSON.parse(localStorage.getItem('sanad_customer') || '{}').phone);
    } catch (e) { tE('تعذّر'); }
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={3} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#dc2626', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>→</button>
        <div style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 900 }}>📅 مواعيدي</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setFilter('upcoming')} style={{ flex: 1, padding: 12, background: filter === 'upcoming' ? '#dc2626' : '#fff', color: filter === 'upcoming' ? '#fff' : '#64748b', border: `1px solid ${filter === 'upcoming' ? '#dc2626' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🔜 القادمة ({upcoming.length})</button>
          <button onClick={() => setFilter('past')} style={{ flex: 1, padding: 12, background: filter === 'past' ? '#dc2626' : '#fff', color: filter === 'past' ? '#fff' : '#64748b', border: `1px solid ${filter === 'past' ? '#dc2626' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📋 السابقة ({past.length})</button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="📅" title={filter === 'upcoming' ? 'لا توجد مواعيد قادمة' : 'لا توجد مواعيد سابقة'} description="احجز موعداً من قسم الصحة والعيادات" actionLabel="الأطباء" actionHref="/doctor" />
        ) : filtered.map(a => {
          const s = STATUS[a.status] || STATUS.pending;
          return (
            <div key={a.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>🏥 {a.provider_name || a.doctor_name || 'عيادة'}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>👤 د. {a.doctor_name || 'طبيب'}</div>
                </div>
                <span style={{ background: `${s.color}20`, color: s.color, padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, height: 'fit-content' }}>{s.icon} {s.label}</span>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#334155', fontWeight: 800, marginBottom: 4 }}>📅 {new Date(a.appointment_date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                {a.appointment_time && <div style={{ fontSize: 12, color: '#334155', fontWeight: 800 }}>🕐 {a.appointment_time}</div>}
              </div>
              {a.notes && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, lineHeight: 1.6 }}>📝 {a.notes}</div>}
              <div style={{ display: 'flex', gap: 6 }}>
                {a.status === 'confirmed' && a.provider_phone && (
                  <a href={`tel:${a.provider_phone}`} style={{ flex: 1, padding: 8, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 8, textAlign: 'center', fontSize: 11, fontWeight: 900, textDecoration: 'none' }}>📞 اتصال</a>
                )}
                {['pending', 'confirmed'].includes(a.status) && (
                  <button onClick={() => cancel(a)} style={{ flex: 1, padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✕ إلغاء</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
