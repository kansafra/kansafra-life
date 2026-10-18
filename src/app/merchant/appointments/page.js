'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const STATUS = {
  pending: { label: 'قيد المراجعة', color: '#f59e0b', icon: '⏳' },
  confirmed: { label: 'مؤكد', color: '#10b981', icon: '✅' },
  completed: { label: 'مكتمل', color: '#3b82f6', icon: '✔️' },
  cancelled: { label: 'ملغي', color: '#ef4444', icon: '❌' },
  no_show: { label: 'لم يحضر', color: '#94a3b8', icon: '⚠️' },
};

export default function AppointmentsPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('appointments')
        .select('*')
        .eq('provider_name', dataOwnerName)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
      setAppointments(data || []);
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    if (filter === 'today') return appointments.filter(a => a.appointment_date === today);
    if (filter === 'upcoming') return appointments.filter(a => a.appointment_date > today && a.status !== 'cancelled');
    if (filter === 'pending') return appointments.filter(a => a.status === 'pending');
    if (filter === 'all') return appointments;
    return appointments.filter(a => a.status === filter);
  }, [appointments, filter, today]);

  async function changeStatus(id, newStatus) {
    setSaving(true);
    try {
      const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      success(`✅ تم التحديث إلى "${STATUS[newStatus].label}"`);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      if (selected?.id === id) setSelected({ ...selected, status: newStatus });
    } catch (e) { tE('تعذّر التحديث'); }
    setSaving(false);
  }

  function call(phone) {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  }

  function whatsapp(a) {
    if (!a.customer_phone) return;
    const clean = String(a.customer_phone).replace(/\D/g, '');
    const phone = clean.startsWith('0') ? '963' + clean.slice(1) : clean;
    const msg = `مرحباً ${a.customer_name}، موعدك يوم ${new Date(a.appointment_date).toLocaleDateString('ar-EG')} الساعة ${a.appointment_time}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  if (userLoading || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  const stats = {
    today: appointments.filter(a => a.appointment_date === today && a.status !== 'cancelled').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#dc2626', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>📅 المواعيد</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{stats.today} اليوم · {stats.pending} معلّق</div>
        </div>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>اليوم</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0f4d3a' }}>{stats.today}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>معلّق</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b' }}>{stats.pending}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, marginBottom: 4 }}>مؤكد</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>{stats.confirmed}</div>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { k: 'today', l: 'اليوم' },
            { k: 'upcoming', l: 'القادمة' },
            { k: 'pending', l: 'معلقة' },
            { k: 'all', l: 'الكل' },
          ].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              padding: '8px 14px', background: filter === f.k ? '#dc2626' : '#fff',
              color: filter === f.k ? '#fff' : '#64748b',
              border: `1px solid ${filter === f.k ? '#dc2626' : '#e5e7eb'}`,
              borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}>{f.l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="📅" title={filter === 'today' ? 'لا توجد مواعيد اليوم' : 'لا توجد مواعيد'} description="ستظهر هنا حجوزات المرضى" />
        ) : filtered.map(a => {
          const s = STATUS[a.status] || STATUS.pending;
          return (
            <div key={a.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${a.status === 'pending' ? '#f59e0b' : '#e5e7eb'}`, cursor: 'pointer' }} onClick={() => setSelected(a)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>👤 {a.customer_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', direction: 'ltr', textAlign: 'right', marginTop: 2 }}>{a.customer_phone}</div>
                </div>
                <span style={{ background: `${s.color}20`, color: s.color, padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, height: 'fit-content' }}>{s.icon} {s.label}</span>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>📅 {new Date(a.appointment_date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })} · 🕐 {a.appointment_time}</div>
              </div>
              {a.notes && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>📝 {a.notes}</div>}
              {a.status === 'pending' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={(e) => { e.stopPropagation(); changeStatus(a.id, 'confirmed'); }} style={{ flex: 1, padding: 8, background: 'rgba(16,185,129,.1)', color: '#10b981', border: '1px solid rgba(16,185,129,.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✓ تأكيد</button>
                  <button onClick={(e) => { e.stopPropagation(); changeStatus(a.id, 'cancelled'); }} style={{ flex: 1, padding: 8, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✕ رفض</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>تفاصيل الموعد</h3>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}><span style={{ fontSize: 11, color: '#64748b' }}>المريض</span> · <span style={{ fontWeight: 900, fontSize: 13 }}>{selected.customer_name}</span></div>
              <div style={{ marginBottom: 8 }}><span style={{ fontSize: 11, color: '#64748b' }}>الهاتف</span> · <span style={{ fontWeight: 900, fontSize: 13, direction: 'ltr', display: 'inline-block' }}>{selected.customer_phone}</span></div>
              <div style={{ marginBottom: 8 }}><span style={{ fontSize: 11, color: '#64748b' }}>التاريخ</span> · <span style={{ fontWeight: 900, fontSize: 13 }}>{selected.appointment_date} · {selected.appointment_time}</span></div>
              {selected.notes && <div><span style={{ fontSize: 11, color: '#64748b' }}>ملاحظات</span> · <span style={{ fontSize: 12 }}>{selected.notes}</span></div>}
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => call(selected.customer_phone)} style={{ flex: 1, padding: 10, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📞 اتصال</button>
              <button onClick={() => whatsapp(selected)} style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,.1)', color: '#059669', border: '1px solid rgba(37,211,102,.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📱 واتساب</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {selected.status === 'pending' && (
                <>
                  <button onClick={() => { changeStatus(selected.id, 'confirmed'); }} disabled={saving} style={{ padding: 10, background: 'rgba(16,185,129,.15)', color: '#10b981', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>✓ تأكيد</button>
                  <button onClick={() => { changeStatus(selected.id, 'cancelled'); }} disabled={saving} style={{ padding: 10, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>✕ إلغاء</button>
                </>
              )}
              {selected.status === 'confirmed' && (
                <>
                  <button onClick={() => { changeStatus(selected.id, 'completed'); }} disabled={saving} style={{ padding: 10, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>✅ إكمال</button>
                  <button onClick={() => { changeStatus(selected.id, 'no_show'); }} disabled={saving} style={{ padding: 10, background: 'rgba(100,116,139,.1)', color: '#64748b', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>⚠️ لم يحضر</button>
                </>
              )}
            </div>

            <button onClick={() => setSelected(null)} style={{ width: '100%', marginTop: 10, padding: 12, background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
