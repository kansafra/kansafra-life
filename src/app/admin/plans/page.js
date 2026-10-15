'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const COLOR_OPTIONS = ['#0f4d3a', '#0891b2', '#7c3aed', '#f59e0b', '#dc2626', '#059669', '#8b5cf6'];
const ICON_OPTIONS = ['💎', '⭐', '👑', '🚀', '🥉', '🥈', '🥇', '💠'];

const emptyPlan = {
  name: '',
  name_en: '',
  price: 0,
  price_yearly: 0,
  currency: 'USD',
  period: 'monthly',
  features: [],
  max_products: 10,
  max_orders: 100,
  max_users: 1,
  max_storage_mb: 100,
  is_featured: false,
  is_active: true,
  sort_order: 0,
  color: '#0f4d3a',
  icon: '💎',
  badge: '',
  description: '',
  trial_days: 0,
};

export default function AdminPlans() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPlan);
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order');
    setPlans(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openNew() {
    setEditing('new');
    setForm({ ...emptyPlan, sort_order: plans.length + 1 });
    setFeaturesText('');
  }

  function openEdit(p) {
    setEditing(p.id);
    setForm({ ...p });
    const feats = Array.isArray(p.features) ? p.features : [];
    setFeaturesText(feats.join('\n'));
  }

  async function save() {
    if (!form.name?.trim()) { alert('اسم الباقة إلزامي'); return; }
    if (!form.price && form.price !== 0) { alert('السعر إلزامي'); return; }

    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim().toLowerCase(),
      name_en: form.name_en?.trim() || form.name.trim(),
      price: parseFloat(form.price) || 0,
      price_yearly: parseFloat(form.price_yearly) || 0,
      currency: form.currency || 'USD',
      period: form.period || 'monthly',
      features,
      max_products: parseInt(form.max_products) || 10,
      max_orders: parseInt(form.max_orders) || 100,
      max_users: parseInt(form.max_users) || 1,
      max_storage_mb: parseInt(form.max_storage_mb) || 100,
      is_featured: form.is_featured === true,
      is_active: form.is_active !== false,
      sort_order: parseInt(form.sort_order) || 0,
      color: form.color || '#0f4d3a',
      icon: form.icon || '💎',
      badge: form.badge?.trim() || null,
      description: form.description?.trim() || null,
      trial_days: parseInt(form.trial_days) || 0,
    };

    let err;
    if (editing === 'new') {
      ({ error: err } = await supabase.from('subscription_plans').insert(payload));
    } else {
      ({ error: err } = await supabase.from('subscription_plans').update(payload).eq('id', editing));
    }
    if (err) { alert('تعذّر: ' + err.message); return; }
    setEditing(null);
    load();
  }

  async function del(p) {
    if (!confirm(`حذف باقة "${p.name}" نهائياً؟`)) return;
    const { error } = await supabase.from('subscription_plans').delete().eq('id', p.id);
    if (error) { alert('تعذّر: ' + error.message); return; }
    load();
  }

  async function toggleActive(p) {
    await supabase.from('subscription_plans').update({ is_active: !p.is_active }).eq('id', p.id);
    load();
  }

  async function toggleFeatured(p) {
    await supabase.from('subscription_plans').update({ is_featured: !p.is_featured }).eq('id', p.id);
    load();
  }

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">إدارة الباقات</span>
        <span className="admin-sub-count">{plans.length}</span>
      </div>

      <div style={{ padding: 16 }}>
        <button className="mng-btn primary" onClick={openNew} type="button" style={{ width: '100%' }}>
          + إضافة باقة جديدة
        </button>
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : plans.length === 0 ? (
        <div className="sect-empty"><span className="em">💎</span><p>لا توجد باقات</p></div>
      ) : (
        <div style={{ padding: 16 }}>
          {plans.map((p) => (
            <div
              key={p.id}
              className="debt-card"
              style={{
                borderRightColor: p.color || '#0f4d3a',
                marginBottom: 12,
                padding: 16,
                opacity: p.is_active !== false ? 1 : 0.5,
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: (p.color || '#0f4d3a') + '22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  {p.icon || '💎'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>
                    {p.name_en || p.name}
                    {p.is_featured && <span style={{ marginInlineStart: 8, fontSize: 11, color: '#fbbf24' }}>⭐ مميزة</span>}
                  </div>
                  {p.description && (
                    <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 3 }}>{p.description}</div>
                  )}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: p.color || '#0f4d3a', direction: 'ltr' }}>
                    ${p.price}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--n-500)', fontWeight: 700 }}>
                    / {p.period === 'monthly' ? 'شهر' : p.period}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--n-500)', flexWrap: 'wrap', marginBottom: 10 }}>
                <span>📦 {p.max_products} منتج</span>
                <span>🛒 {p.max_orders} طلب</span>
                <span>👥 {p.max_users} مستخدم</span>
                {p.trial_days > 0 && <span>🎁 {p.trial_days} يوم تجريبي</span>}
              </div>

              {p.features && Array.isArray(p.features) && p.features.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--n-400)', lineHeight: 1.7, marginBottom: 10 }}>
                  {p.features.slice(0, 3).map((f, i) => (
                    <div key={i}>✓ {f}</div>
                  ))}
                  {p.features.length > 3 && (
                    <div style={{ color: 'var(--n-500)', fontStyle: 'italic' }}>
                      + {p.features.length - 3} ميزات أخرى
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="debt-action"
                  onClick={() => toggleActive(p)}
                  type="button"
                  title={p.is_active !== false ? 'إخفاء' : 'إظهار'}
                  style={{ flex: 1 }}
                >
                  {p.is_active !== false ? '👁️' : '🚫'}
                </button>
                <button
                  className="debt-action"
                  onClick={() => toggleFeatured(p)}
                  type="button"
                  title={p.is_featured ? 'إلغاء التمييز' : 'تمييز'}
                  style={{ flex: 1 }}
                >
                  {p.is_featured ? '⭐' : '☆'}
                </button>
                <button
                  className="debt-action edit"
                  onClick={() => openEdit(p)}
                  type="button"
                  style={{ flex: 1 }}
                >
                  ✏️
                </button>
                <button
                  className="debt-action del"
                  onClick={() => del(p)}
                  type="button"
                  style={{ flex: 1 }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="mng-modal-bg" onClick={() => setEditing(null)}>
          <div className="mng-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="mng-modal-handle" />
            <h3 className="mng-modal-title">
              {editing === 'new' ? '➕ باقة جديدة' : '✏️ تعديل الباقة'}
            </h3>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">الاسم (عربي) *</label>
                <input
                  className="new-service-input"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: ذهبية"
                />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">الاسم (إنجليزي)</label>
                <input
                  className="new-service-input"
                  value={form.name_en || ''}
                  onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                  placeholder="Gold"
                />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">وصف مختصر</label>
              <input
                className="new-service-input"
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="مثال: مثالية للمتاجر المتوسطة"
              />
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">السعر الشهري *</label>
                <input
                  className="new-service-input"
                  type="number"
                  step="any"
                  value={form.price || 0}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">السعر السنوي</label>
                <input
                  className="new-service-input"
                  type="number"
                  step="any"
                  value={form.price_yearly || 0}
                  onChange={(e) => setForm({ ...form, price_yearly: e.target.value })}
                />
              </div>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">العملة</label>
                <select
                  className="new-service-select"
                  value={form.currency || 'USD'}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  <option value="USD">دولار</option>
                  <option value="SYP">ليرة سورية</option>
                  <option value="TRY">ليرة تركية</option>
                  <option value="SAR">ريال سعودي</option>
                  <option value="AED">درهم إماراتي</option>
                  <option value="EUR">يورو</option>
                </select>
              </div>
              <div className="new-service-field">
                <label className="new-service-label">الفترة</label>
                <select
                  className="new-service-select"
                  value={form.period || 'monthly'}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                >
                  <option value="monthly">شهري</option>
                  <option value="yearly">سنوي</option>
                </select>
              </div>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">📦 عدد المنتجات</label>
                <input
                  className="new-service-input"
                  type="number"
                  value={form.max_products || 0}
                  onChange={(e) => setForm({ ...form, max_products: e.target.value })}
                />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">🛒 عدد الطلبات</label>
                <input
                  className="new-service-input"
                  type="number"
                  value={form.max_orders || 0}
                  onChange={(e) => setForm({ ...form, max_orders: e.target.value })}
                />
              </div>
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">👥 عدد المستخدمين</label>
                <input
                  className="new-service-input"
                  type="number"
                  value={form.max_users || 1}
                  onChange={(e) => setForm({ ...form, max_users: e.target.value })}
                />
              </div>
              <div className="new-service-field">
                <label className="new-service-label">💾 مساحة التخزين (MB)</label>
                <input
                  className="new-service-input"
                  type="number"
                  value={form.max_storage_mb || 100}
                  onChange={(e) => setForm({ ...form, max_storage_mb: e.target.value })}
                />
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">🎁 أيام تجريبية</label>
              <input
                className="new-service-input"
                type="number"
                value={form.trial_days || 0}
                onChange={(e) => setForm({ ...form, trial_days: e.target.value })}
              />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">✨ الميزات (كل سطر = ميزة)</label>
              <textarea
                className="new-service-input"
                style={{ minHeight: 120, fontFamily: 'inherit' }}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder="10 منتجات&#10;100 طلب/شهر&#10;دعم البريد"
              />
            </div>

            <div className="new-prod-row">
              <div className="new-service-field">
                <label className="new-service-label">🎨 اللون</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: c,
                        border: form.color === c ? '3px solid #fff' : '2px solid transparent',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="new-service-field">
                <label className="new-service-label">💎 الأيقونة</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ICON_OPTIONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setForm({ ...form, icon: i })}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: form.icon === i ? 'rgba(15,77,58,.3)' : 'rgba(255,255,255,.05)',
                        border: form.icon === i ? '2px solid #0f4d3a' : '2px solid transparent',
                        cursor: 'pointer',
                        fontSize: 18,
                      }}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="new-service-field">
              <label className="new-service-label">🏷️ شارة (اختياري)</label>
              <input
                className="new-service-input"
                value={form.badge || ''}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="مثال: الأكثر شيوعاً"
              />
            </div>

            <div className="new-service-field">
              <label className="new-service-label">الترتيب</label>
              <input
                className="new-service-input"
                type="number"
                value={form.sort_order || 0}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />
            </div>

            <div className="new-service-field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={form.is_featured === true}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                id="feat_plan"
              />
              <label htmlFor="feat_plan" style={{ margin: 0, cursor: 'pointer' }}>⭐ باقة مميزة</label>
            </div>

            <div className="new-service-field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={form.is_active !== false}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                id="act_plan"
              />
              <label htmlFor="act_plan" style={{ margin: 0, cursor: 'pointer' }}>✅ مُفعّلة</label>
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
