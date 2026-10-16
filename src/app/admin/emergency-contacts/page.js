'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { key: 'medical',  label: 'طبي',       icon: '🚑' },
  { key: 'fire',     label: 'حريق',      icon: '🔥' },
  { key: 'security', label: 'أمني',      icon: '🚔' },
  { key: 'civil',    label: 'دفاع مدني', icon: '🛡️' },
  { key: 'service',  label: 'خدمي',      icon: '🔧' },
  { key: 'env',      label: 'بيئي',      icon: '🌿' },
];

export default function AdminEmergencyContacts() {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('emergency_contacts').select('*').order('sort_order');
    setContacts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openEdit(c) {
    setEditing(c.id || 'new');
    setForm({ ...c });
  }

  function openNew(cat) {
    setEditing('new');
    setForm({
      category: cat?.key || 'medical',
      name_ar: cat?.label || '',
      icon: cat?.icon || '🚨',
      color: '#dc2626',
      phone: '',
      whatsapp: '',
      message_template: 'استغاثة عاجلة\nالاسم: {name}\nالهاتف: {phone}\nالموقع: {location}\nالوصف: {description}',
      include_location: true,
      sort_order: 0,
      is_active: true,
    });
  }

  async function save() {
    if (!form.category || !form.name_ar) { alert('التصنيف والاسم إلزاميان'); return; }
    const payload = {
      category: form.category,
      name_ar: form.name_ar,
      name_en: form.name_en || null,
      phone: form.phone?.trim() || null,
      whatsapp: form.whatsapp?.trim() || null,
      message_template: form.message_template || null,
      include_location: form.include_location !== false,
      icon: form.icon || '🚨',
      color: form.color || '#dc2626',
      sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active !== false,
      updated_at: new Date().toISOString(),
    };
    let err;
    if (editing === 'new') {
      ({ error: err } = await supabase.from('emergency_contacts').insert(payload));
    } else {
      ({ error: err } = await supabase.from('emergency_contacts').update(payload).eq('id', editing));
    }
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    setEditing(null);
    load();
  }

  async function del(c) {
    if (!confirm('حذف "' + c.name_ar + '"؟')) return;
    const { error } = await supabase.from('emergency_contacts').delete().eq('id', c.id);
    if (error) { alert('تعذّر الحذف'); return; }
    load();
  }

  const existing = new Set(contacts.map((c) => c.category));
  const missing = CATEGORIES.filter((c) => !existing.has(c.key));

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">أرقام الطوارئ</span>
        <span className="admin-sub-count">{contacts.length}</span>
      </div>

      {missing.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(251,191,36,.1)', borderBottom: '1px solid rgba(251,191,36,.2)' }}>
          <div style={{ fontSize: 11, color: 'rgba(251,191,36,.9)', fontWeight: 800, marginBottom: 8 }}>
            ⚠️ أضف أرقام للتصنيفات الناقصة:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {missing.map((c) => (
              <button key={c.key} className="admin-filter" onClick={() => openNew(c)} type="button">
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: 16 }}>
        <button className="mng-btn primary" onClick={() => openNew(null)} type="button" style={{ width: '100%', marginBottom: 12 }}>
          + إضافة جهة جديدة
        </button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : contacts.length === 0 ? (
        <div className="sect-empty"><span className="em">📞</span><p>لا توجد جهات — أضف أرقام الطوارئ</p></div>
      ) : (
        <div className="admin-items">
          {contacts.map((c) => (
            <div key={c.id} className="admin-item">
              <div className="admin-item-icon" style={{ background: (c.color || '#dc2626') + '22', borderColor: (c.color || '#dc2626') + '55', color: c.color || '#dc2626' }}>
                {c.icon || '🚨'}
              </div>
              <div className="admin-item-body">
                <div className="admin-item-title">
                  {c.name_ar}
                  {!c.is_active && <span className="admin-badge info" style={{ marginInlineStart: 8 }}>معطّل</span>}
                </div>
                <div className="admin-item-meta">
                  {c.phone && <span>📞 {c.phone}</span>}
                  {c.whatsapp && <span>💬 {c.whatsapp}</span>}
                </div>
              </div>
              <div className="admin-item-actions" style={{ flexDirection: 'column', gap: 4 }}>
                <button className="admin-act-btn" onClick={() => openEdit(c)} type="button" title="تعديل">✏️</button>
                <button className="admin-act-btn del" onClick={() => del(c)} type="button" title="حذف">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="mng-modal-bg" onClick={() => setEditing(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">{editing === 'new' ? '➕ جهة جديدة' : '✏️ تعديل'}</h3>

            <div className="new-service-field">
              <label className="new-service-label">التصنيف *</label>
              <select className="new-service-select" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الاسم *</label>
              <input className="new-service-input" value={form.name_ar || ''} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} placeholder="مثال: الإسعاف" />
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">أيقونة</label>
                <input className="new-service-input" value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🚨" maxLength={4} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">اللون</label>
                <input className="new-service-input" type="color" value={form.color || '#dc2626'} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">رقم الهاتف</label>
              <input className="new-service-input" type="tel" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+963..." />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">رقم الواتساب</label>
              <input className="new-service-input" type="tel" value={form.whatsapp || ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="963xxxxxxxxx" />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>
                بدون + وبدون مسافات. مثال: 963930694339
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">قالب الرسالة</label>
              <textarea
                className="new-service-input"
                style={{ minHeight: 100, fontFamily: 'inherit' }}
                value={form.message_template || ''}
                onChange={(e) => setForm({ ...form, message_template: e.target.value })}
              />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>
                المتغيرات: {'{name}'} {'{phone}'} {'{location}'} {'{description}'}
              </div>
            </div>

            <div className="new-service-field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={form.include_location !== false} onChange={(e) => setForm({ ...form, include_location: e.target.checked })} id="inc_loc" />
              <label htmlFor="inc_loc" style={{ margin: 0, cursor: 'pointer' }}>تضمين الموقع تلقائياً يوجد الرسالة</label>
            </div>

            <div className="new-service-field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} id="is_act" />
              <label htmlFor="is_act" style={{ margin: 0, cursor: 'pointer' }}>مُفعّل</label>
            </div>

            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setEditing(null)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} type="button">✓ حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
