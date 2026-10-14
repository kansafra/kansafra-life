'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminPlans() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('subscription_plans').select('*').order('sort_order');
    setPlans(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setEditing({ _new: true });
    setForm({
      name: '', name_en: '', price: 0, currency: 'USD', period: 'monthly',
      max_products: 10, max_orders: 100, is_featured: false, sort_order: 0,
      features: '', is_active: true,
    });
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      ...p,
      features: Array.isArray(p.features) ? p.features.join('\n') : '',
    });
  }

  async function save() {
    if (!form.name?.trim()) { alert('الاسم مطلوب'); return; }
    const payload = {
      name: form.name.trim(),
      name_en: form.name_en?.trim() || null,
      price: Number(form.price) || 0,
      currency: form.currency || 'USD',
      period: form.period || 'monthly',
      max_products: Number(form.max_products) || 0,
      max_orders: Number(form.max_orders) || 0,
      is_featured: form.is_featured === true || form.is_featured === 'true',
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active === true || form.is_active === 'true',
      features: String(form.features || '').split('\n').filter(Boolean),
    };
    let err;
    if (editing._new) {
      ({ error: err } = await supabase.from('subscription_plans').insert(payload));
    } else {
      ({ error: err } = await supabase.from('subscription_plans').update(payload).eq('id', editing.id));
    }
    if (err) { alert('تعذّر الحفظ: ' + err.message); return; }
    setEditing(null);
    load();
  }

  async function del(p) {
    if (!confirm(`حذف الباقة "${p.name}"؟`)) return;
    await supabase.from('subscription_plans').delete().eq('id', p.id);
    setDeleting(null);
    load();
  }

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">💳 باقات الاشتراك</span>
        <button className="mng-add-btn" onClick={openAdd} type="button">+ باقة</button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : plans.length === 0 ? (
        <div className="sect-empty"><span className="em">💳</span><p>لا توجد باقات</p></div>
      ) : (
        <div style={{ padding: 20 }}>
          {plans.map((p) => (
            <div key={p.id} className="plan-card" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
              <div className="plan-head">
                <div>
                  <div className="plan-title" style={{ color: '#fff' }}>
                    {p.is_featured && '⭐ '}{p.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{p.name_en || ''}</div>
                </div>
                <div className="plan-total" style={{ color: '#e8b923' }}>
                  {p.price === 0 ? 'مجاناً' : `$${p.price}`}
                  <span style={{ fontSize: 11, opacity: .6, marginRight: 4 }}>/{p.period}</span>
                </div>
              </div>
              <div className="plan-summary">
                <div>
                  <div className="plan-sum-item">منتجات</div>
                  <div className="plan-sum-val">{p.max_products}</div>
                </div>
                <div>
                  <div className="plan-sum-item">طلبات/شهر</div>
                  <div className="plan-sum-val">{p.max_orders}</div>
                </div>
              </div>
              {Array.isArray(p.features) && p.features.length > 0 && (
                <ul style={{ paddingRight: 18, fontSize: 12, color: 'rgba(255,255,255,.6)', margin: '8px 0 12px', lineHeight: 1.8 }}>
                  {p.features.slice(0, 4).map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}
              <div className="admin-form-actions" style={{ marginTop: 0 }}>
                <button className="mng-btn ghost" onClick={() => openEdit(p)} type="button">✏️ تعديل</button>
                <button className="mng-btn del" onClick={() => setDeleting(p)} type="button">🗑️ حذف</button>
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
              {editing._new ? '➕ باقة جديدة' : '✏️ تعديل الباقة'}
            </h3>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>الاسم *</label>
                <input className="new-service-input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>English</label>
                <input className="new-service-input" value={form.name_en || ''} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </div>
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>السعر</label>
                <input className="new-service-input" type="number" value={form.price || 0} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>العملة</label>
                <select className="new-service-select" value={form.currency || 'USD'} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  <option value="USD">USD</option>
                  <option value="SYP">SYP</option>
                  <option value="TRY">TRY</option>
                </select>
              </div>
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>الحد الأقصى للمنتجات</label>
                <input className="new-service-input" type="number" value={form.max_products || 0} onChange={(e) => setForm({ ...form, max_products: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>الحد الأقصى للطلبات/شهر</label>
                <input className="new-service-input" type="number" value={form.max_orders || 0} onChange={(e) => setForm({ ...form, max_orders: e.target.value })} />
              </div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>الميزات (سطر لكل ميزة)</label>
              <textarea className="new-service-textarea" rows={5} value={form.features || ''} onChange={(e) => setForm({ ...form, features: e.target.value })} />
            </div>
            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>الترتيب</label>
                <input className="new-service-input" type="number" value={form.sort_order || 0} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>
              <div className="new-service-field">
                <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>الحالة</label>
                <select className="new-service-select" value={String(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
                  <option value="true">نشطة</option>
                  <option value="false">موقوفة</option>
                </select>
              </div>
            </div>
            <div className="new-service-field">
              <label className="new-service-label" style={{ color: 'rgba(255,255,255,.6)' }}>مميزة؟</label>
              <select className="new-service-select" value={String(form.is_featured)} onChange={(e) => setForm({ ...form, is_featured: e.target.value })}>
                <option value="false">لا</option>
                <option value="true">نعم (⭐ الأكثر شيوعاً)</option>
              </select>
            </div>
            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setEditing(null)} type="button">إلغاء</button>
              <button className="mng-btn primary" onClick={save} type="button">✓ حفظ</button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="mng-modal-bg" onClick={() => setDeleting(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#101010', textAlign: 'center' }}>
            <div className="mng-modal-handle" />
            <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
            <h3 className="mng-modal-title" style={{ color: '#fff' }}>حذف الباقة؟</h3>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 13, marginBottom: 20 }}>{deleting.name}</p>
            <div className="admin-form-actions">
              <button className="mng-btn ghost" onClick={() => setDeleting(null)} type="button">إلغاء</button>
              <button className="mng-btn del" onClick={() => del(deleting)} type="button">✓ حذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
