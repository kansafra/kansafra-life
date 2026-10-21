'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function MedicalRecordsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form, setForm] = useState({ patient_name: '', patient_phone: '', patient_age: '', diagnosis: '', treatment: '', notes: '', follow_up_date: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) {
      supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) setEntityId(data.id); });
    }
    loadRecords();
  }, [user, userLoading, dataOwnerName]);

  async function loadRecords() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('medical_records').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false });
      setRecords(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ patient_name: '', patient_phone: '', patient_age: '', diagnosis: '', treatment: '', notes: '', follow_up_date: '' });
    setEditRecord(null);
    setShowForm(true);
  }

  function openEdit(r) {
    setForm({
      patient_name: r.patient_name || '', patient_phone: r.patient_phone || '',
      patient_age: String(r.patient_age || ''), diagnosis: r.diagnosis || '',
      treatment: r.treatment || '', notes: r.notes || '',
      follow_up_date: r.follow_up_date || '',
    });
    setEditRecord(r);
    setShowForm(true);
  }

  async function saveRecord(e) {
    e.preventDefault();
    if (!form.patient_name.trim()) { toastError('اسم المريض مطلوب'); return; }
    if (!form.diagnosis.trim()) { toastError('التشخيص مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        patient_name: form.patient_name.trim(), patient_phone: form.patient_phone.trim() || null,
        patient_age: form.patient_age ? Number(form.patient_age) : null,
        diagnosis: form.diagnosis.trim(), treatment: form.treatment.trim() || null,
        notes: form.notes.trim() || null, follow_up_date: form.follow_up_date || null,
      };
      if (editRecord) {
        const { error } = await supabase.from('medical_records').update(payload).eq('id', editRecord.id);
        if (error) throw error;
        success('✅ تم التعديل');
      } else {
        const { error } = await supabase.from('medical_records').insert(payload);
        if (error) throw error;
        success('🎉 تم حفظ السجل');
      }
      setShowForm(false);
      loadRecords();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function deleteRecord(r) {
    if (!confirm(`حذف سجل "${r.patient_name}"؟`)) return;
    setDeleting(r.id);
    const { error } = await supabase.from('medical_records').delete().eq('id', r.id);
    if (!error) { success('🗑️ تم الحذف'); setRecords(prev => prev.filter(x => x.id !== r.id)); }
    setDeleting(null);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.trim().toLowerCase();
    return records.filter(r => (r.patient_name || '').toLowerCase().includes(q) || (r.patient_phone || '').includes(q) || (r.diagnosis || '').toLowerCase().includes(q));
  }, [records, search]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>📋 السجلات الطبية</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
        <input type="search" placeholder="🔍 ابحث بالمريض أو التشخيص..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/doctor_schedules" style={navStyle(false)}>📅 الجدول</Link>
        <Link href="/merchant/medical_records" style={navStyle(true)}>📋 السجلات</Link>
        <Link href="/merchant/prescriptions" style={navStyle(false)}>💊 الوصفات</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{records.length === 0 ? 'لا توجد سجلات طبية' : 'لا نتائج'}</div>
            {records.length === 0 && (
              <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف أول سجل</button>
            )}
          </div>
        ) : filtered.map(r => (
          <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>👤 {r.patient_name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {r.patient_phone && `📱 ${r.patient_phone}`}
                  {r.patient_age && ` · ${r.patient_age} سنة`}
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>
                {new Date(r.created_at).toLocaleDateString('ar-SY')}
              </div>
            </div>
            <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 900, marginBottom: 2 }}>🔬 التشخيص</div>
              <div style={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.5 }}>{r.diagnosis}</div>
            </div>
            {r.treatment && (
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#059669', fontWeight: 900, marginBottom: 2 }}>💊 العلاج</div>
                <div style={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.5 }}>{r.treatment}</div>
              </div>
            )}
            {r.follow_up_date && (
              <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 900, marginBottom: 8 }}>📅 موعد المراجعة: {new Date(r.follow_up_date).toLocaleDateString('ar-SY')}</div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(r)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️ تعديل</button>
              <button onClick={() => deleteRecord(r)} disabled={deleting === r.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{deleting === r.id ? '⏳' : '🗑️'}</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{editRecord ? '✏️ تعديل سجل' : '📋 سجل جديد'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveRecord}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>اسم المريض *</label>
                <input value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>الهاتف</label>
                  <input type="tel" value={form.patient_phone} onChange={e => setForm({ ...form, patient_phone: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>العمر</label>
                  <input type="number" value={form.patient_age} onChange={e => setForm({ ...form, patient_age: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>التشخيص *</label>
                <textarea value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} required style={{ ...inputStyle, height: 70, resize: 'none' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>العلاج</label>
                <textarea value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>موعد المراجعة</label>
                <input type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} />
              </div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ جارٍ الحفظ...' : (editRecord ? '💾 حفظ' : '➕ حفظ')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function navStyle(active) {
  return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' };
}

const btnStyle = (bg, color) => ({ flex: 1, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
