'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function OncallPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => { load(); }, [selectedDate]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase.from('oncall_shifts').select('*').eq('shift_date', selectedDate).order('start_time');
      setShifts(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function changeDay(offset) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().slice(0, 10));
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${days[d.getDay()]} · ${d.getDate()} ${months[d.getMonth()]}`;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🌙 مناوبات الصيدليات</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>الصيدليات المناوبة اليوم</div>
          </div>
          <div style={{ fontSize: 40 }}>💊</div>
        </div>

        {/* Date Navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: 12, padding: 8 }}>
          <button onClick={() => changeDay(-1)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>‹</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 900 }}>{formatDate(selectedDate)}</div>
            {selectedDate === today && <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>اليوم</div>}
          </div>
          <button onClick={() => changeDay(1)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>›</button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <button onClick={() => setSelectedDate(today)} style={{ width: '100%', padding: 12, background: selectedDate === today ? 'rgba(8,145,178,.15)' : '#fff', color: selectedDate === today ? '#0891b2' : '#64748b', border: `1px solid ${selectedDate === today ? '#0891b2' : '#e5e7eb'}`, borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>📅 اليوم</button>

        {loading ? (
          <SkeletonList count={3} />
        ) : shifts.length === 0 ? (
          <EmptyState icon="🌙" title="لا توجد مناوبات" description="لم يتم تسجيل مناوبات لهذا اليوم" actionLabel="الأطباء" actionHref="/doctor" />
        ) : (
          shifts.map(s => (
            <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>💊 {s.pharmacy_name}</div>
                  {(s.start_time || s.end_time) && (
                    <div style={{ fontSize: 12, color: '#0891b2', fontWeight: 800 }}>🕐 {s.start_time || '—'} — {s.end_time || '—'}</div>
                  )}
                  {s.city && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>📍 {s.city}</div>}
                  {s.address && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>🏠 {s.address}</div>}
                </div>
                <div style={{ fontSize: 32 }}>🌙</div>
              </div>
              {s.notes && <div style={{ fontSize: 11.5, color: '#64748b', background: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 10, lineHeight: 1.6 }}>📝 {s.notes}</div>}
              {s.pharmacy_phone && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`tel:${s.pharmacy_phone}`} style={{ flex: 1, padding: 10, background: 'rgba(59,130,246,.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📞 اتصال</a>
                  <a href={`https://wa.me/${String(s.pharmacy_phone).replace(/\D/g, '').replace(/^0/, '963')}`} target="_blank" rel="noopener" style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,.1)', color: '#059669', border: '1px solid rgba(37,211,102,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📱 واتساب</a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
