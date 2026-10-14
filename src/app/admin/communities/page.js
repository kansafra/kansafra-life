'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminCommunities() {
  const router = useRouter();
  const [items, setItems] = useState([]);
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
    if (!supabase) return;
    const { data } = await supabase.from('communities').select('*').order('created_at', { ascending: false });
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setEditing({ _new: true });
    setForm({ name: '', slug: '', country: '', governorate: '', district: '', lat: '', lng: '', description: '' });
  }

  function openEdit(c) {
    setEditing(c);
    setForm({
      name: c.name, slug: c.slug, country: c.country || '', governorate: c.governorate || '',
      district: c.district || '', lat: c.lat || '', lng: c.lng || '', description: c.description || '',
    });
  }

  async function save() {
    if (!form.name?.trim() || !form.slug?.trim()) { alert('الاسم والمعرف مطلوبان'); return; }
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      country: form.country.trim() || null,
      governorate: form.governorate.trim() || null,
      district: form.district.trim() || null,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      description: form.description.trim() || null,
    };
    let err;
    if (editing._new) {
      ({ error: err } = await supabase.from('communities').insert(payload));
    } else {
      ({ error: err } = await supabase.from('communities').update(payload).eq('id', editing.id));
    }
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    setEditing(null);
    load();
  }

  async function del(c) {
    if (!confirm(`حذف بلدة "${c.name}"؟`)) return;
    await supabase.from('communities').delete().eq('id', c.id);
    load();
  }

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">🏘️ إدارة البلدات</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ إضافة</button>
      </div>

      <div style={{ padding: '14px 20px 0', fontSize: 12, color: 'rgba(255,255,255,.45)', fontWeight: 600, lineHeight: 1.6 }}>
        كل بلدة = منصة مستقلة بحد ذاتها (Multi-Tenant)
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : items.length === 0 ? (
        <div className="sect-empty"><span className="em">🏘️</span><p>لا توجد بلدات</p></div>
      ) : (
        <div className="admin-items">
          {items.map((c) => (
            <div key={c.id} className="admin-item">
              <div className="admin-item-icon">🏘️</div>
              <div className="admin-item-body">
                <div className="admin-item-title">{c.name}</div>
                <div className="admin-item-meta">
                  <span>@{c.slug}</span>
                  {c.district && <span>📍 {c.district}</span>}
                  {c.governorate && <span>{c.governorate}</span>}
                  <span className={`admin-badge ${c.is_active ? 'active' : 'danger'}`}>
                    {c.is_active ? 'نشطة' : 'موقوفة'}
                  </span>
                </div>
              </div>
              <div className="admin-item-actions">
                <button className="admin-act-btn" onClick={() => openEdit(c)} type="button">✏️</button>
                <button className="admin-act-btn del" onClick={() => del(c)} type="button">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="mng-modal-bg" onClick={() => setEditing(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#101010' }}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title" style={{ color: '#fff' }}>
              {editing._new ? '➕ بلدة جديدة' : '✏️ تعديل البلد'}
            </h3>
            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>الاسم *</label>
              <input className="new-service-input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>المعرف (slug) *</label>
              <input className="new-service-input" placeholder="kansafra" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>الدولة</label>
                <input className="new-service-input" value={form.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>المحافظة</label>
                <input className="new-service-input" value={form.governorate || ''} onChange={(e) => setForm({ ...form, governorate: e.target.value })} />
              </div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>المنطقة</label>
              <input className="new-service-input" value={form.district || ''} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>Latitude</label>
                <input className="new-service-input" type="number" step="any" value={form.lat || ''} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>Longitude</label>
                <input className="new-service-input" type="number" step="any" value={form.lng || ''} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
              </div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>وصف</label>
              <textarea className="new-service-textarea" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
