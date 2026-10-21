'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

export default function PrescriptionsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ patient_name: '', patient_phone: '', medicines: '', instructions: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) {
      supabase.from('entities').select('id').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) setEntityId(data.id); });
    }
    loadAll();
  }, [user, userLoading, dataOwnerName]);

  async function loadAll() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('prescriptions').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false });
      setItems(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ patient_name: '', patient_phone: '', medicines: '', instructions: '', notes: '' });
    setEditItem(null);
    setShowForm(true);
  }

  function openEdit(r) {
    setForm({
      patient_name: r.patient_name || '', patient_phone: r.patient_phone || '',
      medicines: r.medicines || '', instructions: r.instructions || '', notes: r.notes || '',
    });
    setEditItem(r);
    setShowForm(true);
  }

  async function savePrescription(e) {
    e.preventDefault();
    if (!form.patient_name.trim()) { toastError('اسم المريض مطلوب'); return; }
    if (!form.medicines.trim()) { toastError('الأدوية مطلوبة'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        patient_name: form.patient_name.trim(), patient_phone: form.patient_phone.trim() || null,
        medicines: form.medicines.trim(), instructions: form.instructions.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editItem) {
        const { error } = await supabase.from('prescriptions').update(payload).eq('id', editItem.id);
        if (error) throw error;
        success('✅ تم التعديل');
      } else {
        const { error } = await supabase.from('prescriptions').insert(payload);
        if (error) throw error;
        success('🎉 تم حفظ الوصفة');
      }
      setShowForm(false);
      loadAll();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function deleteItem(r) {
    if (!confirm(`حذف وصفة "${r.patient_name}"؟`)) return;
    setDeleting(r.id);
    const { error } = await supabase.from('prescriptions').delete().eq('id', r.id);
    if (!error) { success('🗑️ تم الحذف'); setItems(prev => prev.filter(x => x.id !== r.id)); }
    setDeleting(null);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(r => (r.patient_name || '').toLowerCase().includes(q) || (r.patient_phone || '').includes(q));
  }, [items, search]);

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>💊 الوصفات</h1>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{dataOwnerName}</div>
          </div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ جديد</button>
        </div>
        <input type="search" placeholder="🔍 ابحث بالمريض..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <Link href="/merchant/doctor_schedules" style={navStyle(false)}>📅 الجدول</Link>
        <Link href="/merchant/medical_records" style={navStyle(false)}>📋 السجلات</Link>
        <Link href="/merchant/prescriptions" style={navStyle(true)}>💊 الوصفات</Link>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{items.length === 0 ? 'لا توجد وصفات' : 'لا نتائج'}</div>
            {items.length === 0 && (
              <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أضف وصفة</button>
            )}
          </div>
        ) : filtered.map(r => (
          <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>👤 {r.patient_name}</div>
                {r.patient_phone && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📱 {r.patient_phone}</div>}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString('ar-SY')}</div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#d97706', fontWeight: 900, marginBottom: 2 }}>💊 الأدوية</div>
              <div style={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.medicines}</div>
            </div>
            {r.instructions && (
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 8 }}>
                <strong>📝 تعليمات:</strong> {r.instructions}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(r)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️ تعديل</button>
              <button onClick={() => deleteItem(r)} disabled={deleting === r.id} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>{deleting === r.id ? '⏳' : '🗑️'}</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{editItem ? '✏️ تعديل' : '💊 وصفة جديدة'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={savePrescription}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>اسم المريض *</label>
                <input value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>هاتف المريض</label>
                <input type="tel" value={form.patient_phone} onChange={e => setForm({ ...form, patient_phone: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>الأدوية *</label>
                <textarea value={form.medicines} onChange={e => setForm({ ...form, medicines: e.target.value })} required style={{ ...inputStyle, height: 100, resize: 'none' }} placeholder="1. باراسيتامول 500mg - 3 مرات يومياً&#10;2. مضاد حيوي - مرتين يومياً" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>تعليمات</label>
                <textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} placeholder="بعد الأكل، مع كوب ماء..." />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} />
              </div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ جارٍ الحفظ...' : (editItem ? '💾 حفظ' : '➕ حفظ')}
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
