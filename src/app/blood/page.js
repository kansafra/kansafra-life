'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodPage() {
  const { success, error: tE } = useToast();
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [r, d] = await Promise.all([
        supabase.from('blood_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }),
        supabase.from('blood_donors').select('*').eq('is_available', true).order('created_at', { ascending: false }),
      ]);
      setRequests(r.data || []);
      setDonors(d.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filteredDonors = useMemo(() => {
    if (filter === 'all') return donors;
    return donors.filter(d => d.blood_type === filter);
  }, [donors, filter]);

  async function submitRequest() {
    if (!form.patient_name?.trim()) { tE('اسم المريض مطلوب'); return; }
    if (!form.blood_type) { tE('فصيلة الدم مطلوبة'); return; }
    if (!form.contact_phone?.trim()) { tE('رقم التواصل مطلوب'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('blood_requests').insert({
        patient_name: form.patient_name.trim(),
        blood_type: form.blood_type,
        units: Number(form.units) || 1,
        hospital: form.hospital?.trim() || null,
        contact_phone: form.contact_phone.trim(),
        urgency: form.urgency || 'normal',
        notes: form.notes?.trim() || null,
      });
      if (error) throw error;
      success('✅ تم نشر الطلب');
      setModal(null); setForm({}); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  async function submitDonor() {
    if (!form.full_name?.trim()) { tE('الاسم مطلوب'); return; }
    if (!form.phone?.trim()) { tE('الهاتف مطلوب'); return; }
    if (!form.blood_type) { tE('فصيلة الدم مطلوبة'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('blood_donors').insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        blood_type: form.blood_type,
        city: form.city?.trim() || null,
        last_donation_date: form.last_donation_date || null,
        notes: form.notes?.trim() || null,
      });
      if (error) throw error;
      success('✅ تم تسجيلك كمتبرع');
      setModal(null); setForm({}); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  if (loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', padding: '20px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🩸 التبرع بالدم</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>أنقذ حياة — تبرع اليوم</div>
          </div>
          <div style={{ fontSize: 40 }}>🩸</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setTab('requests')} style={{ flex: 1, padding: 12, background: tab === 'requests' ? '#dc2626' : '#fff', color: tab === 'requests' ? '#fff' : '#64748b', border: `1px solid ${tab === 'requests' ? '#dc2626' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🚨 طلبات ({requests.length})</button>
          <button onClick={() => setTab('donors')} style={{ flex: 1, padding: 12, background: tab === 'donors' ? '#dc2626' : '#fff', color: tab === 'donors' ? '#fff' : '#64748b', border: `1px solid ${tab === 'donors' ? '#dc2626' : '#e5e7eb'}`, borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>💉 متبرعون ({donors.length})</button>
        </div>

        {tab === 'requests' && (
          <>
            <button onClick={() => { setForm({}); setModal('request'); }} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>🩸 طلب دم جديد</button>
            {requests.length === 0 ? (
              <EmptyState icon="🩸" title="لا توجد طلبات" description="جميع المرضى بحالة جيدة" />
            ) : requests.map(r => (
              <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: `2px solid ${r.urgency === 'urgent' ? '#ef4444' : '#e5e7eb'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>🩸 {r.blood_type} · {r.units} وحدة</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>👤 {r.patient_name}</div>
                    {r.hospital && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>🏥 {r.hospital}</div>}
                  </div>
                  {r.urgency === 'urgent' && <span style={{ background: '#ef4444', color: '#fff', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, height: 'fit-content' }}>⚠️ عاجل</span>}
                </div>
                {r.notes && <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 8, lineHeight: 1.6 }}>{r.notes}</div>}
                <a href={`tel:${r.contact_phone}`} style={{ display: 'block', padding: 10, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>📞 تبرع — اتصل الآن</a>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>📅 {new Date(r.created_at).toLocaleString('ar-EG')}</div>
              </div>
            ))}
          </>
        )}

        {tab === 'donors' && (
          <>
            <button onClick={() => { setForm({}); setModal('donor'); }} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>💉 سجّل كمتبرع</button>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
              <button onClick={() => setFilter('all')} style={{ padding: '6px 12px', background: filter === 'all' ? '#dc2626' : '#fff', color: filter === 'all' ? '#fff' : '#64748b', border: `1px solid ${filter === 'all' ? '#dc2626' : '#e5e7eb'}`, borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>الكل</button>
              {BLOOD_TYPES.map(bt => (
                <button key={bt} onClick={() => setFilter(bt)} style={{ padding: '6px 12px', background: filter === bt ? '#dc2626' : '#fff', color: filter === bt ? '#fff' : '#64748b', border: `1px solid ${filter === bt ? '#dc2626' : '#e5e7eb'}`, borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', direction: 'ltr' }}>{bt}</button>
              ))}
            </div>
            {filteredDonors.length === 0 ? (
              <EmptyState icon="💉" title="لا يوجد متبرعون" description="كن أول متبرع" />
            ) : filteredDonors.map(d => (
              <div key={d.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, flexShrink: 0 }}>{d.blood_type}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{d.full_name}</div>
                    {d.city && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📍 {d.city}</div>}
                    {d.last_donation_date && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>آخر تبرع: {new Date(d.last_donation_date).toLocaleDateString('ar-EG')}</div>}
                  </div>
                  <a href={`tel:${d.phone}`} style={{ padding: '8px 14px', background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, textDecoration: 'none' }}>📞</a>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{modal === 'request' ? '🩸 طلب دم' : '💉 تسجيل متبرع'}</h3>
            {modal === 'request' ? (
              <>
                <input type="text" placeholder="اسم المريض *" value={form.patient_name || ''} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                <select value={form.blood_type || ''} onChange={(e) => setForm({ ...form, blood_type: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
                  <option value="">— فصيلة الدم —</option>
                  {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
                <input type="number" placeholder="عدد الوحدات" value={form.units || 1} onChange={(e) => setForm({ ...form, units: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                <input type="text" placeholder="المستشفى" value={form.hospital || ''} onChange={(e) => setForm({ ...form, hospital: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                <input type="tel" placeholder="رقم التواصل *" value={form.contact_phone || ''} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }} />
                <select value={form.urgency || 'normal'} onChange={(e) => setForm({ ...form, urgency: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
                  <option value="normal">عادي</option>
                  <option value="urgent">⚠️ عاجل</option>
                </select>
                <textarea placeholder="ملاحظات" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
                  <button onClick={submitRequest} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ نشر'}</button>
                </div>
              </>
            ) : (
              <>
                <input type="text" placeholder="الاسم *" value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                <input type="tel" placeholder="الهاتف *" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }} />
                <select value={form.blood_type || ''} onChange={(e) => setForm({ ...form, blood_type: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
                  <option value="">— فصيلة الدم —</option>
                  {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
                <input type="text" placeholder="المدينة" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#334155', marginBottom: 4 }}>آخر تبرع (اختياري)</label>
                  <input type="date" value={form.last_donation_date || ''} onChange={(e) => setForm({ ...form, last_donation_date: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
                  <button onClick={submitDonor} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ تسجيل'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
