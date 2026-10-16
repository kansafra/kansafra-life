'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function BookingsPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let stored = null;
    try { stored = getSession(); } catch (e) {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) return;
    const { data } = await supabase.from('hotel_bookings').select('*').eq('entity_name', ent.display_name).order('check_in', { ascending: false });
    setBookings(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setMode('add');
    setForm({ room_type: '', guest_name: '', guest_phone: '', check_in: '', check_out: '', guests_count: 1, total_price: 0, currency: 'SYP', status: 'pending', notes: '' });
  }

  function openEdit(b) {
    setMode('edit');
    setEditing(b);
    setForm({ ...b });
  }

  async function save() {
    if (!form.guest_name?.trim() || !form.guest_phone?.trim()) {
      alert('اسم وهاتف الضيف مطلوبان');
      return;
    }
    if (!form.check_in || !form.check_out) { alert('التواريخ مطلوبة'); return; }
    if (form.check_out <= form.check_in) { alert('تاريخ المغادرة يجب أن يكون بعد الوصول'); return; }

    setSaving(true);
    const payload = {
      entity_name: entity.display_name,
      room_type: form.room_type?.trim() || null,
      guest_name: form.guest_name.trim(),
      guest_phone: form.guest_phone.trim(),
      check_in: form.check_in,
      check_out: form.check_out,
      guests_count: Number(form.guests_count) || 1,
      total_price: Number(form.total_price) || 0,
      currency: form.currency || 'SYP',
      status: form.status || 'pending',
      notes: form.notes?.trim() || null,
    };
    let err;
    if (mode === 'add') {
      ({ error: err } = await supabase.from('hotel_bookings').insert(payload));
    } else {
      ({ error: err } = await supabase.from('hotel_bookings').update(payload).eq('id', editing.id));
    }
    setSaving(false);
    if (err) { alert('تعذّر: ' + err.message); return; }
    setMode(null); setEditing(null);
    load(entity);
  }

  async function updateStatus(item, status) {
    await supabase.from('hotel_bookings').update({ status }).eq('id', item.id);
    load(entity);
  }

  async function del(item) {
    if (!confirm('حذف الحجز؟')) return;
    await supabase.from('hotel_bookings').delete().eq('id', item.id);
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  const STATUS_LABELS = {
    pending: { l: 'قيد المراجعة', c: '#f59e0b' },
    confirmed: { l: 'مؤكد', c: '#16a34a' },
    checked_in: { l: 'يوجد الفندق', c: '#0891b2' },
    checked_out: { l: 'غادر', c: '#6b7280' },
    cancelled: { l: 'ملغي', c: '#dc2626' },
  };

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">🏨 حجوزات الفنادق</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ حجز</button>
      </div>

      <div className="store-cat-scroll" style={{ paddingTop: 14 }}>
        {[
          { k: 'all', l: 'الكل' },
          { k: 'pending', l: 'قيد المراجعة' },
          { k: 'confirmed', l: 'مؤكد' },
          { k: 'checked_in', l: 'يوجد الفندق' },
          { k: 'checked_out', l: 'غادر' },
        ].map((f) => (
          <button key={f.k} className={`store-cat-chip ${filter === f.k ? 'active' : ''}`} onClick={() => setFilter(f.k)} type="button">
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">🏨</span><p>لا توجد حجوزات</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {filtered.map((b) => {
            const st = STATUS_LABELS[b.status] || STATUS_LABELS.pending;
            const nights = Math.max(1, Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000));
            return (
              <div key={b.id} className="debt-card" style={{ borderRightColor: st.c }}>
                <div className="debt-head">
                  <div>
                    <div className="debt-customer">🏨 {b.guest_name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--n-500)', direction: 'ltr', textAlign: 'right' }}>{b.guest_phone}</div>
                    {b.room_type && <div style={{ fontSize: 12, color: 'var(--n-500)', marginTop: 3 }}>🛏️ {b.room_type}</div>}
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 900, background: `${st.c}1a`, color: st.c }}>
                    {st.l}
                  </span>
                </div>

                <div className="debt-amounts">
                  <div className="debt-amount-item">
                    <div className="debt-amount-val" style={{ fontSize: 12 }}>{new Date(b.check_in).toLocaleDateString('ar-EG')}</div>
                    <div className="debt-amount-lbl">وصول</div>
                  </div>
                  <div className="debt-amount-item">
                    <div className="debt-amount-val" style={{ fontSize: 12 }}>{new Date(b.check_out).toLocaleDateString('ar-EG')}</div>
                    <div className="debt-amount-lbl">مغادرة</div>
                  </div>
                  <div className="debt-amount-item">
                    <div className="debt-amount-val" style={{ fontSize: 12 }}>{nights} ليلة</div>
                    <div className="debt-amount-lbl">المدة</div>
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--f-700)', direction: 'ltr', textAlign: 'right', marginTop: 6 }}>
                  {Number(b.total_price).toLocaleString()} {b.currency}
                </div>

                <div className="debt-actions">
                  {b.status === 'pending' && (
                    <>
                      <button className="debt-action pay" onClick={() => updateStatus(b, 'confirmed')} type="button">✓ تأكيد</button>
                      <button className="debt-action del" onClick={() => updateStatus(b, 'cancelled')} type="button">✕</button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <button className="debt-action pay" onClick={() => updateStatus(b, 'checked_in')} type="button">🏨 دخول</button>
                  )}
                  {b.status === 'checked_in' && (
                    <button className="debt-action pay" onClick={() => updateStatus(b, 'checked_out')} type="button">👋 مغادرة</button>
                  )}
                  <button className="debt-action edit" onClick={() => openEdit(b)} type="button">✏️</button>
                  <button className="debt-action del" onClick={() => del(b)} type="button">🗑️</button>
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
            <h3 className="mng-modal-title">{mode === 'add' ? '➕ حجز جديد' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">اسم الضيف *</label>
              <input className="new-service-input" value={form.guest_name || ''} onChange={(ev) => setForm({ ...form, guest_name: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">هاتف الضيف *</label>
              <input className="new-service-input" type="tel" value={form.guest_phone || ''} onChange={(ev) => setForm({ ...form, guest_phone: ev.target.value })} />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">نوع الغرفة</label>
              <input className="new-service-input" value={form.room_type || ''} onChange={(ev) => setForm({ ...form, room_type: ev.target.value })} placeholder="مفردة / مزدوجة / جناح..." />
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">تاريخ الوصول *</label>
                <input className="new-service-input" type="date" value={form.check_in || ''} onChange={(ev) => setForm({ ...form, check_in: ev.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">تاريخ المغادرة *</label>
                <input className="new-service-input" type="date" value={form.check_out || ''} onChange={(ev) => setForm({ ...form, check_out: ev.target.value })} />
              </div>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">عدد الضيوف</label>
                <input className="new-service-input" type="number" value={form.guests_count || 1} onChange={(ev) => setForm({ ...form, guests_count: ev.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">السعر الإجمالي</label>
                <input className="new-service-input" type="number" value={form.total_price || 0} onChange={(ev) => setForm({ ...form, total_price: ev.target.value })} />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الحالة</label>
              <select className="new-service-select" value={form.status || 'pending'} onChange={(ev) => setForm({ ...form, status: ev.target.value })}>
                <option value="pending">قيد المراجعة</option>
                <option value="confirmed">مؤكد</option>
                <option value="checked_in">يوجد الفندق</option>
                <option value="checked_out">غادر</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">ملاحظات</label>
              <textarea className="new-service-textarea" rows={2} value={form.notes || ''} onChange={(ev) => setForm({ ...form, notes: ev.target.value })} />
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => { setMode(null); setEditing(null); }} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} disabled={saving} type="button">{saving ? '...' : '✓ حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
