'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

export default function PrescriptionsPage() {
  const router = useRouter();
  const { user, loading: userLoading, isOwner, dataOwnerName } = useCurrentUser();
  const { success, error: tE } = useToast();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('prescriptions')
        .select('*')
        .eq('doctor_name', dataOwnerName)
        .order('created_at', { ascending: false });
      setPrescriptions(data || []);
    } catch (e) { tE('تعذّر التحميل'); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return prescriptions;
    const q = search.trim().toLowerCase();
    return prescriptions.filter(p =>
      (p.patient_name || '').toLowerCase().includes(q) ||
      (p.patient_phone || '').includes(q)
    );
  }, [prescriptions, search]);

  async function savePrescription() {
    if (!form.patient_name?.trim()) { tE('اسم المريض مطلوب'); return; }
    if (!form.patient_phone?.trim()) { tE('الهاتف مطلوب'); return; }
    if (!form.medications?.trim()) { tE('الأدوية مطلوبة'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('prescriptions').insert({
        doctor_name: dataOwnerName,
        patient_name: form.patient_name.trim(),
        patient_phone: form.patient_phone.trim(),
        diagnosis: form.diagnosis?.trim() || null,
        medications: form.medications.trim(),
        instructions: form.instructions?.trim() || null,
      });
      if (error) throw error;
      success('✅ تم حفظ الوصفة');
      setModal(null); setForm({}); load();
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  function printPrescription(p) {
    const win = window.open('', '_blank');
    win.document.write(`
      <html dir="rtl"><head><title>وصفة طبية - ${p.patient_name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 3px double #0f4d3a; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 48px; margin-bottom: 10px; }
        .title { font-size: 24px; font-weight: 900; color: #0f4d3a; }
        .info { background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 16px; font-weight: 900; color: #0f4d3a; border-bottom: 2px solid #0f4d3a; padding-bottom: 5px; margin-bottom: 15px; }
        .medications { white-space: pre-line; line-height: 2; }
        .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #64748b; }
        @media print { body { padding: 20px; } }
      </style></head>
      <body>
        <div class="header">
          <div class="logo">🏥</div>
          <div class="title">وصفة طبية</div>
          <div style="font-size: 14px; color: #64748b; margin-top: 8px;">د. ${p.doctor_name}</div>
        </div>
        <div class="info">
          <div class="info-row"><span><strong>المريض:</strong> ${p.patient_name}</span><span><strong>الهاتف:</strong> ${p.patient_phone}</span></div>
          <div class="info-row"><span><strong>التاريخ:</strong> ${new Date(p.created_at).toLocaleDateString('ar-EG')}</span><span><strong>رقم الوصفة:</strong> ${p.id.slice(0, 8).toUpperCase()}</span></div>
          ${p.diagnosis ? `<div class="info-row"><span><strong>التشخيص:</strong> ${p.diagnosis}</span></div>` : ''}
        </div>
        <div class="section">
          <div class="section-title">💊 الأدوية</div>
          <div class="medications">${p.medications}</div>
        </div>
        ${p.instructions ? `<div class="section"><div class="section-title">📝 التعليمات</div><div style="line-height: 1.8;">${p.instructions}</div></div>` : ''}
        <div class="footer">
          <div>منصة سند · كنصفرة · إدلب · سوريا</div>
          <div style="margin-top: 8px;">هذه الوصفة صادرة إلكترونياً ولا تحتاج ختم</div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    win.document.close();
  }

  function sendWhatsApp(p) {
    const clean = String(p.patient_phone).replace(/\D/g, '');
    const phone = clean.startsWith('0') ? '963' + clean.slice(1) : clean;
    const msg = `*وصفة طبية*\n\n👨‍⚕️ د. ${p.doctor_name}\n👤 ${p.patient_name}\n📅 ${new Date(p.created_at).toLocaleDateString('ar-EG')}\n\n💊 *الأدوية:*\n${p.medications}\n${p.instructions ? `\n📝 *التعليمات:*\n${p.instructions}` : ''}\n\n— منصة سند`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  if (userLoading || loading) return <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh' }}><SkeletonList count={4} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(135deg,#dc2626,#991b1b)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>💊 الوصفات الطبية</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 2 }}>{filtered.length} وصفة</div>
        </div>
        <button onClick={() => { setForm({}); setModal('new'); }} style={{ background: '#fff', color: '#dc2626', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ وصفة</button>
      </div>

      <div style={{ padding: 16 }}>
        <input type="text" placeholder="🔍 ابحث باسم المريض..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="💊" title="لا توجد وصفات" description="ستظهر هنا الوصفات الطبية التي تصدرها" actionLabel="+ وصفة جديدة" onAction={() => { setForm({}); setModal('new'); }} />
        ) : filtered.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>👤 {p.patient_name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, direction: 'ltr', textAlign: 'right' }}>{p.patient_phone}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>📅 {new Date(p.created_at).toLocaleString('ar-EG')}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => printPrescription(p)} title="طباعة" style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', border: 'none', fontSize: 14, cursor: 'pointer' }}>🖨️</button>
                <button onClick={() => sendWhatsApp(p)} title="واتساب" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(37,211,102,.15)', color: '#059669', border: 'none', fontSize: 14, cursor: 'pointer' }}>📱</button>
              </div>
            </div>
            {p.diagnosis && (
              <div style={{ fontSize: 11.5, color: '#dc2626', fontWeight: 800, marginBottom: 6 }}>🔍 {p.diagnosis}</div>
            )}
            <div style={{ padding: 10, background: 'rgba(16,185,129,.05)', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#10b981', marginBottom: 4 }}>💊 الأدوية</div>
              <div style={{ fontSize: 12, color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{p.medications}</div>
            </div>
            {p.instructions && (
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>📝 {p.instructions}</div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>وصفة جديدة</h3>

            <input type="text" placeholder="اسم المريض *" value={form.patient_name || ''} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="tel" placeholder="رقم الهاتف *" value={form.patient_phone || ''} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }} />
            <input type="text" placeholder="التشخيص (اختياري)" value={form.diagnosis || ''} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>💊 الأدوية *</label>
            <textarea placeholder="دواء 1 - جرعة - مدة&#10;دواء 2 - جرعة - مدة" value={form.medications || ''} onChange={(e) => setForm({ ...form, medications: e.target.value })} rows={4} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>📝 التعليمات</label>
            <textarea placeholder="تعليمات إضافية للمريض" value={form.instructions || ''} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={2} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={savePrescription} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
