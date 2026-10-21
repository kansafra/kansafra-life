'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const JOB_TYPES = [
  { key: 'full_time', label: 'دوام كامل', icon: '💼' },
  { key: 'part_time', label: 'دوام جزئي', icon: '⏰' },
  { key: 'remote', label: 'عن بعد', icon: '🏠' },
  { key: 'freelance', label: 'عمل حر', icon: '🎯' },
  { key: 'contract', label: 'عقد', icon: '📄' },
];

export default function MerchantNewJobPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    job_type: 'full_time',
    salary_min: '',
    salary_max: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }

    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) {
      supabase.from('entities').select('id, phone').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => {
        if (data) {
          setEntityId(data.id);
          if (data.phone && !form.phone) setForm(f => ({ ...f, phone: data.phone }));
        }
      });
    }
  }, [user, userLoading, dataOwnerName, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { toastError('عنوان الوظيفة مطلوب'); return; }
    if (!form.description.trim()) { toastError('وصف الوظيفة مطلوب'); return; }
    if (!form.phone && !form.email) { toastError('أدخل هاتف أو بريد للتواصل'); return; }

    setSaving(true);
    try {
      const payload = {
        entity_id: entityId,
        provider_name: dataOwnerName,
        title: form.title.trim(),
        company: form.company.trim() || dataOwnerName,
        description: form.description.trim(),
        location: form.location.trim(),
        job_type: form.job_type,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        currency: 'SYP',
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        is_active: true,
      };

      const { error } = await supabase.from('jobs').insert(payload);
      if (error) throw error;

      success('🎉 تم نشر الوظيفة بنجاح!');
      router.push('/merchant/jobs');
    } catch (err) {
      console.error(err);
      toastError('فشل النشر: ' + (err.message || 'حاول مجدداً'));
    } finally {
      setSaving(false);
    }
  }

  if (userLoading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>➕ نشر وظيفة جديدة</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        
        {/* المعلومات الأساسية */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginTop: 0, marginBottom: 16 }}>📋 المعلومات الأساسية</h2>
          
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>عنوان الوظيفة *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} placeholder="مثال: مبرمج ويب، مندوب مبيعات..." />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>اسم الشركة / المتجر</label>
            <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={inputStyle} placeholder={dataOwnerName || 'اسم الشركة'} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>نوع الوظيفة *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {JOB_TYPES.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setForm({ ...form, job_type: t.key })}
                  style={{
                    padding: 10,
                    background: form.job_type === t.key ? 'rgba(16,185,129,0.1)' : '#f8fafc',
                    color: form.job_type === t.key ? '#059669' : '#475569',
                    border: form.job_type === t.key ? '2px solid #10b981' : '1px solid #e2e8f0',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>الموقع / المدينة</label>
            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inputStyle} placeholder="مثال: كنصفرة، إدلب" />
          </div>

          <div>
            <label style={labelStyle}>الوصف *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required style={{ ...inputStyle, height: 120, resize: 'none' }} placeholder="المهام، المتطلبات، الشروط..." />
          </div>
        </div>

        {/* الراتب */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginTop: 0, marginBottom: 16 }}>💵 الراتب (اختياري)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>من (ل.س)</label>
              <input type="number" value={form.salary_min} onChange={e => setForm({ ...form, salary_min: e.target.value })} style={inputStyle} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>إلى (ل.س)</label>
              <input type="number" value={form.salary_max} onChange={e => setForm({ ...form, salary_max: e.target.value })} style={inputStyle} placeholder="0" />
            </div>
          </div>
        </div>

        {/* التواصل */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginTop: 0, marginBottom: 16 }}>📞 بيانات التواصل</h2>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>أدخل طريقة واحدة على الأقل للتواصل</div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>رقم الهاتف</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="09xxxxxxxx" />
          </div>
          <div>
            <label style={labelStyle}>البريد الإلكتروني</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="hr@example.com" />
          </div>
        </div>

        <button type="submit" disabled={saving} style={{ width: '100%', padding: 16, background: saving ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
          {saving ? '⏳ جارٍ النشر...' : '✓ نشر الوظيفة'}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
