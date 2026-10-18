'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function AdminOncallPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [shifts, setShifts] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    loadPharmacies();
  }, [router]);

  useEffect(() => {
    if (!loading) loadShifts();
  }, [selectedDate, loading]);

  async function loadPharmacies() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('entities').select('id, display_name, phone, city').eq('entity_type', 'pharmacy').eq('is_active', true).order('display_name');
    setPharmacies(data || []);
    setLoading(false);
  }

  async function loadShifts() {
    if (!supabase) return;
    const { data } = await supabase.from('oncall_shifts').select('*').eq('shift_date', selectedDate).order('start_time');
    setShifts(data || []);
  }

  function openAdd() {
    setForm({ pharmacy_name: '', pharmacy_phone: '', city: '', address: '', start_time: '20:00', end_time: '08:00', notes: '' });
    setModal(true);
  }

  function selectPharmacy(id) {
    const p = pharmacies.find(x => x.id === id);
    if (p) {
      setForm({ ...form, pharmacy_name: p.display_name, pharmacy_phone: p.phone || '', city: p.city || '' });
    }
  }

  async function save() {
    if (!form.pharmacy_name?.trim()) { tE('اسم الصيدلية مطلوب'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('oncall_shifts').insert({
        pharmacy_name: form.pharmacy_name.trim(),
        pharmacy_phone: form.pharmacy_phone?.trim() || null,
        city: form.city?.trim() || null,
        address: form.address?.trim() || null,
        shift_date: selectedDate,
        start_time: form.start_time || '20:00',
        end_time: form.end_time || '08:00',
        notes: form.notes?.trim() || null,
      });
      if (error) throw error;
      success('✅ تمت إضافة المناوبة');
      setModal(false); loadShifts();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function del(shift) {
    if (!confirm('حذف هذه المناوبة؟')) return;
    await supabase.from('oncall_shifts').delete().eq('id', shift.id);
    success('✅ تم الحذف'); loadShifts();
  }

  const formattedDate = new Date(selectedDate).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(135deg,#0891b2,#0e7490)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin/health" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>🌙 مناوبات الصيدليات</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{shifts.length} صيدلية مناوبة</div>
        </div>
        <button onClick={openAdd} style={{ background: '#fff', color: '#0891b2', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ إضافة</button>
      </div>

      <div style={{ padding: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>📅 اختر التاريخ</label>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
          style={{ width: '100%', padding: 14, border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', fontWeight: 800 }} />
        <div style={{ marginTop: 8, fontSize: 12, color: '#64748b', fontWeight: 700 }}>{formattedDate}</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {shifts.length === 0 ? (
          <EmptyState icon="🌙" title="لا توجد مناوبات" description={`لم يتم تسجيل مناوبات لتاريخ ${formattedDate}`} actionLabel="+ إضافة مناوبة" onAction={openAdd} />
        ) : shifts.map(s => (
          <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>💊 {s.pharmacy_name}</div>
                <div style={{ fontSize: 12, color: '#0891b2', fontWeight: 800, marginTop: 4 }}>🕐 {s.start_time} — {s.end_time}</div>
                {s.city && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📍 {s.city}</div>}
                {s.pharmacy_phone && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, direction: 'ltr', textAlign: 'right' }}>📞 {s.pharmacy_phone}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {s.pharmacy_phone && <a href={`tel:${s.pharmacy_phone}`} style={{ padding: '6px 10px', background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 6, fontSize: 11, fontWeight: 900, textDecoration: 'none', textAlign: 'center' }}>📞</a>}
                <button onClick={() => del(s)} style={{ padding: '6px 10px', background: 'rgba(220,38,38,.1)', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
            {s.notes && <div style={{ fontSize: 11.5, color: '#64748b', padding: 8, background: '#f8fafc', borderRadius: 6 }}>{s.notes}</div>}
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>🌙 مناوبة جديدة</h3>

            {pharmacies.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 4 }}>اختر من الصيدليات المسجلة</label>
                <select onChange={(e) => selectPharmacy(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}>
                  <option value="">— اختر —</option>
                  {pharmacies.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
                </select>
              </div>
            )}

            <input type="text" placeholder="اسم الصيدلية *" value={form.pharmacy_name || ''} onChange={(e) => setForm({ ...form, pharmacy_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="tel" placeholder="رقم الهاتف" value={form.pharmacy_phone || ''} onChange={(e) => setForm({ ...form, pharmacy_phone: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }} />
            <input type="text" placeholder="المدينة" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 4 }}>من الساعة</label>
                <input type="time" value={form.start_time || '20:00'} onChange={(e) => setForm({ ...form, start_time: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 4 }}>إلى الساعة</label>
                <input type="time" value={form.end_time || '08:00'} onChange={(e) => setForm({ ...form, end_time: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>

            <textarea placeholder="ملاحظات" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#0891b2,#0e7490)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
