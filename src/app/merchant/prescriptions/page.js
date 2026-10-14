'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function genRef() {
  return 'RX-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 9000 + 1000);
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [meds, setMeds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const { data } = await supabase.from('prescriptions').select('*').eq('doctor_name', ent.display_name).order('created_at', { ascending: false });
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setForm({ patient_name: '', patient_phone: '', diagnosis: '', notes: '' });
    setMeds([{ name: '', dose: '', frequency: '', duration: '' }]);
  }

  function openEdit(p) {
    setMode('edit');
    setEditing(p);
    setForm({ patient_name: p.patient_name, patient_phone: p.patient_phone || '', diagnosis: p.diagnosis || '', notes: p.notes || '' });
    setMeds(Array.isArray(p.medications) ? p.medications : [{ name: '', dose: '', frequency: '', duration: '' }]);
  }

  function addMed() { setMeds([...meds, { name: '', dose: '', frequency: '', duration: '' }]); }
  function removeMed(i) { setMeds(meds.filter((_, idx) => idx !== i)); }
  function updateMed(i, k, v) {
    const next = [...meds];
    next[i][k] = v;
    setMeds(next);
  }

  async function save() {
    if (!form.patient_name?.trim()) { alert('اسم المريض مطلوب'); return; }
    const validMeds = meds.filter((m) => m.name.trim());
    if (!validMeds.length) { alert('أضف دواءً واحداً على الأقل'); return; }

    setSaving(true);
    const payload = {
      doctor_name: entity.display_name,
      patient_name: form.patient_name.trim(),
      patient_phone: form.patient_phone?.trim() || null,
      diagnosis: form.diagnosis?.trim() || null,
      medications: validMeds,
      notes: form.notes?.trim() || null,
      qr_code: editing?.qr_code || genRef(),
    };
    let err;
    if (mode === 'add') {
      ({ error: err } = await supabase.from('prescriptions').insert(payload));
    } else {
      ({ error: err } = await supabase.from('prescriptions').update(payload).eq('id', editing.id));
    }
    setSaving(false);
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    setMode(null); setEditing(null);
    load(entity);
  }

  function printRx(p) {
    const w = window.open('', '_blank');
    const meds = Array.isArray(p.medications) ? p.medications : [];
    w.document.write(`
      <!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>وصفة ${p.qr_code}</title>
      <style>
        body{font-family:Cairo,Arial;padding:20px;color:#111}
        .head{border-bottom:3px solid #0e8a66;padding-bottom:12px;margin-bottom:20px;display:flex;justify-content:space-between}
        h1{margin:0;color:#0e8a66}
        .row{display:flex;justify-content:space-between;margin:6px 0;font-size:13px}
        table{width:100%;border-collapse:collapse;margin-top:14px}
        th,td{border-bottom:1px solid #ddd;padding:8px;text-align:right;font-size:13px}
        th{background:#f0f9f5;color:#0e8a66}
        .qr{margin-top:20px;text-align:center}
      </style></head><body>
      <div class="head">
        <div><h1>${p.doctor_name}</h1><div style="font-size:12px;color:#666">وصفة طبية</div></div>
        <div style="text-align:left;font-family:monospace;font-size:12px">
          <div>${p.qr_code}</div>
          <div>${new Date(p.issued_at || p.created_at).toLocaleDateString('ar-EG')}</div>
        </div>
      </div>
      <div class="row"><strong>المريض:</strong> ${p.patient_name}</div>
      ${p.patient_phone ? `<div class="row"><strong>الهاتف:</strong> ${p.patient_phone}</div>` : ''}
      ${p.diagnosis ? `<div class="row"><strong>التشخيص:</strong> ${p.diagnosis}</div>` : ''}
      <table>
        <thead><tr><th>الدواء</th><th>الجرعة</th><th>التكرار</th><th>المدة</th></tr></thead>
        <tbody>${meds.map((m) => `<tr><td>${m.name}</td><td>${m.dose || '-'}</td><td>${m.frequency || '-'}</td><td>${m.duration || '-'}</td></tr>`).join('')}</tbody>
      </table>
      ${p.notes ? `<div style="margin-top:14px;font-size:13px"><strong>ملاحظات:</strong> ${p.notes}</div>` : ''}
      <div class="qr">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(p.qr_code)}" />
        <div style="font-size:11px;color:#666;margin-top:6px">امسح للتحقق</div>
      </div>
      <script>window.onload=()=>setTimeout(()=>{window.print();window.close()},400)</script>
      </body></html>
    `);
    w.document.close();
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">💊 الوصفات الطبية</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ وصفة</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : items.length === 0 ? (
        <div className="sect-empty"><span className="em">💊</span><p>لا توجد وصفات</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {items.map((p) => {
            const meds = Array.isArray(p.medications) ? p.medications : [];
            return (
              <div key={p.id} className="debt-card" style={{ borderRightColor: '#0e8a66' }}>
                <div className="debt-head">
                  <div>
                    <div className="debt-customer">👤 {p.patient_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--n-500)', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>{p.qr_code}</div>
                  </div>
                </div>
                {p.diagnosis && (
                  <div style={{ fontSize: 12, color: 'var(--n-600)', marginTop: 8, fontWeight: 700 }}>
                    🔍 {p.diagnosis}
                  </div>
                )}
                <div style={{ marginTop: 8, padding: 10, background: 'var(--c-50)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--f-700)', marginBottom: 6 }}>
                    💊 {meds.length} دواء
                  </div>
                  {meds.slice(0, 3).map((m, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--n-700)', marginBottom: 2 }}>
                      • {m.name} {m.dose && `— ${m.dose}`}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--n-400)', marginTop: 8 }}>
                  {new Date(p.issued_at || p.created_at).toLocaleDateString('ar-EG')}
                </div>
                <div className="debt-actions">
                  <button className="debt-action edit" onClick={() => openEdit(p)} type="button">✏️ تعديل</button>
                  <button className="debt-action pay" onClick={() => printRx(p)} type="button">🖨️ طباعة</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode && (
        <div className="mng-modal-bg" onClick={() => { setMode(null); setEditing(null); }}>
          <div className="mng-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{mode === 'add' ? '➕ وصفة جديدة' : '✏️ تعديل الوصفة'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">اسم المريض *</label>
              <input className="new-service-input" value={form.patient_name || ''} onChange={(ev) => setForm({ ...form, patient_name: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">هاتف المريض</label>
              <input className="new-service-input" type="tel" value={form.patient_phone || ''} onChange={(ev) => setForm({ ...form, patient_phone: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">التشخيص</label>
              <input className="new-service-input" value={form.diagnosis || ''} onChange={(ev) => setForm({ ...form, diagnosis: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الأدوية</label>
              {meds.map((m, i) => (
                <div key={i} style={{ padding: 10, background: 'var(--c-50)', borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800 }}>دواء #{i + 1}</span>
                    {meds.length > 1 && (
                      <button type="button" onClick={() => removeMed(i)} style={{ background: 'transparent', border: 'none', color: '#dc2626', fontWeight: 900, cursor: 'pointer', fontSize: 14 }}>✕</button>
                    )}
                  </div>
                  <input className="new-service-input" placeholder="اسم الدواء" value={m.name} onChange={(ev) => updateMed(i, 'name', ev.target.value)} style={{ marginBottom: 6 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    <input className="new-service-input" placeholder="الجرعة" value={m.dose} onChange={(ev) => updateMed(i, 'dose', ev.target.value)} style={{ fontSize: 12 }} />
                    <input className="new-service-input" placeholder="التكرار" value={m.frequency} onChange={(ev) => updateMed(i, 'frequency', ev.target.value)} style={{ fontSize: 12 }} />
                    <input className="new-service-input" placeholder="المدة" value={m.duration} onChange={(ev) => updateMed(i, 'duration', ev.target.value)} style={{ fontSize: 12 }} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addMed} className="mng-btn ghost" style={{ width: '100%', marginTop: 4 }}>+ دواء آخر</button>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">ملاحظات</label>
              <textarea className="new-service-textarea" rows={2} value={form.notes || ''} onChange={(ev) => setForm({ ...form, notes: ev.target.value })} />
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => { setMode(null); setEditing(null); }} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} disabled={saving} type="button">
                {saving ? '...' : mode === 'add' ? '✓ إصدار' : '✓ حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
