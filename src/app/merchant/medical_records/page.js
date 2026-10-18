'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function MedicalRecordsPage() {
  const router = useRouter();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [records, setRecords] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('records');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      const [rRes, aRes] = await Promise.all([
        supabase.from('medical_records').select('*').eq('doctor_name', dataOwnerName).order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').eq('provider_name', dataOwnerName).eq('status', 'completed').order('appointment_date', { ascending: false }),
      ]);
      setRecords(rRes.data || []);
      setCompleted(aRes.data || []);
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.trim().toLowerCase();
    return records.filter(r =>
      (r.patient_name || '').toLowerCase().includes(q) ||
      (r.patient_phone || '').includes(q)
    );
  }, [records, search]);

  async function saveRecord() {
    if (!form.patient_name?.trim()) { tE('اسم المريض مطلوب'); return; }
    if (!form.patient_phone?.trim()) { tE('الهاتف مطلوب'); return; }
    if (!form.diagnosis?.trim()) { tE('التشخيص مطلوب'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('medical_records').insert({
        doctor_name: dataOwnerName,
        patient_name: form.patient_name.trim(),
        patient_phone: form.patient_phone.trim(),
        diagnosis: form.diagnosis.trim(),
        prescription: form.prescription?.trim() || null,
        notes: form.notes?.trim() || null,
      });
      if (error) throw error;
      success('✅ تم حفظ السجل الطبي');
      setModal(null); setForm({}); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  function openRecordForAppointment(a) {
    setForm({
      patient_name: a.customer_name,
      patient_phone: a.customer_phone,
      diagnosis: '',
      prescription: '',
      notes: a.notes || '',
    });
    setModal('new');
  }

  if (userLoading || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  const tabs = [
    { k: 'records', label: '📋 السجلات', count: records.length },
    { k: 'completed', label: '✅ زيارات مكتملة', count: completed.length },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#dc2626', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>📋 السجلات الطبية</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{records.length} سجل</div>
        </div>
        <button onClick={() => { setForm({}); setModal('new'); }} style={{ background: '#fff', color: '#dc2626', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ سجل</button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {tabs.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              flex: 1, padding: 12,
              background: tab === t.k ? '#dc2626' : '#fff',
              color: tab === t.k ? '#fff' : '#64748b',
              border: `1px solid ${tab === t.k ? '#dc2626' : '#e5e7eb'}`,
              borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            }}>{t.label} ({t.count})</button>
          ))}
        </div>
        <input type="text" placeholder="🔍 ابحث باسم المريض..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {tab === 'records' && (
          filteredRecords.length === 0 ? (
            <EmptyState icon="📋" title="لا توجد سجلات" description="ستظهر هنا السجلات الطبية التي تنشئها" actionLabel="+ سجل جديد" onAction={() => { setForm({}); setModal('new'); }} />
          ) : filteredRecords.map(r => (
            <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>👤 {r.patient_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, direction: 'ltr', textAlign: 'right' }}>{r.patient_phone}</div>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString('ar-EG')}</div>
              </div>
              {r.diagnosis && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 900, color: '#dc2626' }}>🔍 التشخيص: </span>
                  <span style={{ fontSize: 12, color: '#334155' }}>{r.diagnosis}</span>
                </div>
              )}
              {r.prescription && (
                <div style={{ padding: 8, background: 'rgba(16,185,129,.08)', borderRadius: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#10b981', marginBottom: 2 }}>💊 الوصفة</div>
                  <div style={{ fontSize: 11.5, color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{r.prescription}</div>
                </div>
              )}
              {r.notes && <div style={{ fontSize: 11, color: '#64748b' }}>📝 {r.notes}</div>}
            </div>
          ))
        )}

        {tab === 'completed' && (
          completed.length === 0 ? (
            <EmptyState icon="✅" title="لا توجد زيارات مكتملة" description="ستظهر المواعيد المكتملة هنا لإنشاء سجل لها" />
          ) : completed.map(a => {
            const hasRecord = records.some(r => r.patient_phone === a.customer_phone && new Date(r.created_at) >= new Date(a.appointment_date));
            return (
              <div key={a.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>👤 {a.customer_name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📅 {new Date(a.appointment_date).toLocaleDateString('ar-EG')} · {a.appointment_time}</div>
                  </div>
                  {hasRecord ? (
                    <span style={{ background: 'rgba(16,185,129,.15)', color: '#10b981', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, height: 'fit-content' }}>✓ له سجل</span>
                  ) : (
                    <button onClick={() => openRecordForAppointment(a)} style={{ background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ سجل</button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>سجل طبي جديد</h3>

            <input type="text" placeholder="اسم المريض *" value={form.patient_name || ''} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="tel" placeholder="رقم الهاتف *" value={form.patient_phone || ''} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }} />
            <textarea placeholder="التشخيص *" value={form.diagnosis || ''} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            <textarea placeholder="الوصفة الطبية (سطر لكل دواء)" value={form.prescription || ''} onChange={(e) => setForm({ ...form, prescription: e.target.value })} rows={3} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            <textarea placeholder="ملاحظات إضافية" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={saveRecord} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
