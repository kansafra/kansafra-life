'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import ImageUploader from '@/components/ImageUploader';

export default function MunicipalPage() {
  const router = useRouter();
  const { success, error: tE } = useToast();
  const [services, setServices] = useState([]);
  const [tab, setTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [trackPhone, setTrackPhone] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('municipal_services').select('*').eq('is_active', true).order('sort_order');
      setServices(data || []);
    } catch (e) {}
    setLoading(false);
  }

  async function trackComplaints() {
    if (!trackPhone.trim()) { tE('أدخل رقم الهاتف'); return; }
    if (!supabase) return;
    const { data } = await supabase.from('complaints').select('*').eq('citizen_phone', trackPhone.trim()).order('created_at', { ascending: false });
    setComplaints(data || []);
    if (!data || data.length === 0) tE('لا توجد شكاوى مسجلة بهذا الرقم');
  }

  async function submitComplaint() {
    if (!form.citizen_name?.trim()) { tE('الاسم مطلوب'); return; }
    if (!form.citizen_phone?.trim()) { tE('الهاتف مطلوب'); return; }
    if (!form.title?.trim()) { tE('عنوان الشكوى مطلوب'); return; }
    if (!form.description?.trim()) { tE('الوصف مطلوب'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('complaints').insert({
        citizen_name: form.citizen_name.trim(),
        citizen_phone: form.citizen_phone.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category || 'general',
        location_text: form.location_text?.trim() || null,
        image_url: form.image_url || null,
        status: 'open',
      });
      if (error) throw error;
      success('✅ تم إرسال شكواك');
      setModal(null);
      setForm({});
    } catch (e) { tE('تعذّر: ' + e.message); }
    setSaving(false);
  }

  const statusMap = {
    open: { label: 'قيد المراجعة', color: '#f59e0b', icon: '⏳' },
    in_progress: { label: 'قيد المعالجة', color: '#3b82f6', icon: '⚙️' },
    resolved: { label: 'تم الحل', color: '#10b981', icon: '✅' },
    rejected: { label: 'مرفوض', color: '#ef4444', icon: '❌' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1e40af,#1e3a8a)', padding: '20px 20px 32px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, left: -40, width: 180, height: 180, background: 'rgba(251,191,36,.1)', borderRadius: '50%', filter: 'blur(40px)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.15)', borderRadius: '50%' }}>→</Link>
          <div style={{ fontSize: 40 }}>🏢</div>
        </div>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>بلدية كنصفرة</h1>
          <p style={{ fontSize: 13, opacity: 0.85 }}>خدمات بلدية إلكترونية على مدار الساعة</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '20px 16px 0', marginTop: -12, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <button onClick={() => { setForm({}); setModal('complaint'); }} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 8px', textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 28 }}>📝</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#1e40af' }}>تقديم شكوى</div>
          </button>
          <button onClick={() => setTab('track')} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 8px', textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 28 }}>🔍</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#1e40af' }}>تتبع شكوى</div>
          </button>
          <a href="tel:000" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 8px', textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 28 }}>📞</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#1e40af' }}>اتصل بنا</div>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { k: 'services', label: '📋 الخدمات', n: services.length },
            { k: 'track', label: '🔍 تتبع' },
            { k: 'info', label: 'ℹ️ معلومات' },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{ padding: '8px 14px', background: tab === t.k ? '#1e40af' : '#fff', color: tab === t.k ? '#fff' : '#64748b', border: `1px solid ${tab === t.k ? '#1e40af' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{t.label}{t.n !== undefined ? ` (${t.n})` : ''}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* Services */}
        {tab === 'services' && (
          loading ? <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>⏳</div> :
          services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>📋</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>لا توجد خدمات منشورة حالياً</div>
            </div>
          ) : services.map(s => (
            <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(30,64,175,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.icon || '📋'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{s.name}</div>
                  {s.category && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📂 {s.category}</div>}
                </div>
                {Number(s.fee) > 0 && <div style={{ textAlign: 'left' }}><div style={{ fontSize: 13, fontWeight: 900, color: '#1e40af' }}>{Number(s.fee).toLocaleString()}</div><div style={{ fontSize: 9, color: '#64748b' }}>SYP</div></div>}
              </div>
              {s.description && <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 8 }}>{s.description}</div>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {s.processing_days && <span style={{ background: '#f8fafc', color: '#64748b', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>⏱️ {s.processing_days} أيام</span>}
                {s.requirements && <span style={{ background: 'rgba(251,191,36,.1)', color: '#92400e', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>📎 وثائق مطلوبة</span>}
              </div>
              {s.requirements && (
                <div style={{ marginTop: 8, padding: 10, background: '#f8fafc', borderRadius: 8, fontSize: 11, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  <strong>المطلوب:</strong> {s.requirements}
                </div>
              )}
            </div>
          ))
        )}

        {/* Track */}
        {tab === 'track' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, marginBottom: 12 }}>🔍 تتبع شكواك</h3>
            <input type="tel" placeholder="رقم الهاتف المسجل" value={trackPhone} onChange={(e) => setTrackPhone(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }} />
            <button onClick={trackComplaints} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#1e40af,#1e3a8a)', color: '#fff', borderRadius: 12, fontWeight: 900, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>بحث</button>

            {complaints.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10 }}>📋 شكاويك ({complaints.length})</div>
                {complaints.map(c => {
                  const s = statusMap[c.status] || statusMap.open;
                  return (
                    <div key={c.id} style={{ background: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 900, flex: 1 }}>{c.title}</div>
                        <span style={{ background: `${s.color}20`, color: s.color, padding: '2px 8px', borderRadius: 6, fontSize: 9.5, fontWeight: 900 }}>{s.icon} {s.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{c.description}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>📅 {new Date(c.created_at).toLocaleDateString('ar-EG')}</div>
                      {c.response && <div style={{ marginTop: 8, padding: 8, background: 'rgba(16,185,129,.08)', borderRadius: 6, fontSize: 11, color: '#065f46' }}>💬 رد البلدية: {c.response}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Info */}
        {tab === 'info' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏢</div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1e40af', marginBottom: 12 }}>بلدية كنصفرة</h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.8, marginBottom: 20 }}>
              نسعى لتقديم أفضل الخدمات البلدية لمواطنينا الكرام. يمكنكم الآن تقديم طلباتكم وشكاويكم إلكترونياً ومتابعتها بسهولة.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>📞 الهاتف</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#1e40af', direction: 'ltr' }}>—</span>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>⏰ ساعات العمل</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#1e40af' }}>8 صباحاً — 3 عصراً</span>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>📍 الموقع</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#1e40af' }}>كنصفرة — المركز</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Complaint Modal */}
      {modal === 'complaint' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, margin: '0 auto', padding: '24px 20px 30px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>📝 تقديم شكوى</h3>

            <input type="text" placeholder="الاسم *" value={form.citizen_name || ''} onChange={(e) => setForm({ ...form, citizen_name: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <input type="tel" placeholder="رقم الهاتف *" value={form.citizen_phone || ''} onChange={(e) => setForm({ ...form, citizen_phone: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr', textAlign: 'right' }} />
            <input type="text" placeholder="عنوان الشكوى *" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <select value={form.category || 'general'} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }}>
              <option value="general">عام</option>
              <option value="roads">طرق وأرصفة</option>
              <option value="water">مياه</option>
              <option value="electricity">كهرباء</option>
              <option value="garbage">نظافة</option>
              <option value="building">مخالفات بناء</option>
              <option value="other">أخرى</option>
            </select>
            <textarea placeholder="وصف الشكوى *" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            <input type="text" placeholder="الموقع (اختياري)" value={form.location_text || ''} onChange={(e) => setForm({ ...form, location_text: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <div style={{ marginBottom: 16 }}>
              <ImageUploader label="📸 صورة (اختياري)" folder="complaints" value={form.image_url || ''} onUpload={(url) => setForm({ ...form, image_url: url })} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={submitComplaint} disabled={saving} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#1e40af,#1e3a8a)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '...' : '✓ إرسال'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
