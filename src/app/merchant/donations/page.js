'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/Toast';

const CATEGORIES = [
  { key: 'general', label: 'عام', icon: '🤝' },
  { key: 'food', label: 'غذاء', icon: '🍞' },
  { key: 'medical', label: 'طبي', icon: '🏥' },
  { key: 'education', label: 'تعليم', icon: '📚' },
  { key: 'shelter', label: 'مأوى', icon: '🏠' },
  { key: 'emergency', label: 'طوارئ', icon: '🚨' },
];

export default function MerchantDonationsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();

  const [entityId, setEntityId] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', target_amount: '', category: 'general', image_url: '', phone: '', whatsapp: '', deadline: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [viewingPledges, setViewingPledges] = useState(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !dataOwnerName) { setLoading(false); return; }
    const stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null');
    if (stored?.parent_entity_id) setEntityId(stored.parent_entity_id);
    else if (dataOwnerName) supabase.from('entities').select('id, phone').eq('display_name', dataOwnerName).maybeSingle().then(({ data }) => { if (data) { setEntityId(data.id); if (data.phone) setForm(f => ({ ...f, phone: data.phone })); } });
    loadAll();
  }, [user, userLoading, dataOwnerName]);

  async function loadAll() {
    if (!supabase || !dataOwnerName) return;
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        supabase.from('donation_campaigns').select('*').eq('provider_name', dataOwnerName).order('created_at', { ascending: false }),
        supabase.from('donation_pledges').select('*').order('created_at', { ascending: false }),
      ]);
      setCampaigns(cRes.data || []);
      setPledges(pRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setForm({ title: '', description: '', target_amount: '', category: 'general', image_url: '', phone: '', whatsapp: '', deadline: '' });
    setEditCampaign(null);
    setShowForm(true);
  }

  function openEdit(c) {
    setForm({
      title: c.title || '', description: c.description || '',
      target_amount: String(c.target_amount || ''), category: c.category || 'general',
      image_url: c.image_url || '', phone: c.phone || '',
      whatsapp: c.whatsapp || '', deadline: c.deadline || '',
    });
    setEditCampaign(c);
    setShowForm(true);
  }

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toastError('حجم الصورة أقل من 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const name = `campaigns/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('sanad-files').upload(name, file);
      if (error) throw error;
      const { data: url } = await supabase.storage.from('sanad-files').getPublicUrl(name);
      setForm({ ...form, image_url: url.publicUrl });
      success('✅ تم رفع الصورة');
    } catch (err) { toastError('فشل الرفع'); }
    finally { setUploading(false); }
  }

  async function saveCampaign(e) {
    e.preventDefault();
    if (!form.title.trim()) { toastError('عنوان الحملة مطلوب'); return; }
    if (!form.target_amount || Number(form.target_amount) <= 0) { toastError('الهدف المالي مطلوب'); return; }
    setSaving(true);
    try {
      const payload = {
        entity_id: entityId, provider_name: dataOwnerName,
        title: form.title.trim(), description: form.description.trim() || null,
        target_amount: Number(form.target_amount),
        category: form.category, image_url: form.image_url || null,
        phone: form.phone.trim() || null, whatsapp: form.whatsapp.trim() || null,
        deadline: form.deadline || null, is_active: true,
      };
      if (editCampaign) {
        const { error } = await supabase.from('donation_campaigns').update(payload).eq('id', editCampaign.id);
        if (error) throw error;
        success('✅ تم التحديث');
      } else {
        const { error } = await supabase.from('donation_campaigns').insert(payload);
        if (error) throw error;
        success('🎉 تم إنشاء الحملة');
      }
      setShowForm(false);
      loadAll();
    } catch (err) { console.error(err); toastError('فشل الحفظ'); }
    finally { setSaving(false); }
  }

  async function deleteCampaign(c) {
    if (!confirm(`حذف الحملة "${c.title}"؟`)) return;
    const { error } = await supabase.from('donation_campaigns').delete().eq('id', c.id);
    if (!error) { success('🗑️ تم الحذف'); setCampaigns(prev => prev.filter(x => x.id !== c.id)); }
  }

  async function updatePledgeStatus(pledgeId, status) {
    const updates = { status };
    if (status === 'confirmed') {
      const pledge = pledges.find(p => p.id === pledgeId);
      if (pledge) {
        const campaign = campaigns.find(c => c.id === pledge.campaign_id);
        if (campaign) {
          await supabase.from('donation_campaigns').update({
            raised_amount: Number(campaign.raised_amount || 0) + Number(pledge.amount)
          }).eq('id', campaign.id);
        }
      }
    }
    const { error } = await supabase.from('donation_pledges').update(updates).eq('id', pledgeId);
    if (!error) {
      success(status === 'confirmed' ? '✅ تم التأكيد' : '❌ تم الرفض');
      loadAll();
    }
  }

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter(c => c.is_active).length,
    totalRaised: campaigns.reduce((s, c) => s + Number(c.raised_amount || 0), 0),
    pendingPledges: pledges.filter(p => p.status === 'pending').length,
  }), [campaigns, pledges]);

  function getCampaignTitle(id) { return campaigns.find(c => c.id === id)?.title || '—'; }

  if (userLoading || loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <div style={{ background: '#0f4d3a', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/merchant" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }}><h1 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>🤝 التبرعات</h1></div>
          <button onClick={openAdd} style={{ background: '#fbbf24', color: '#0f4d3a', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ حملة</button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveTab('campaigns')} style={{ background: activeTab === 'campaigns' ? '#fff' : 'rgba(255,255,255,0.1)', color: activeTab === 'campaigns' ? '#0f4d3a' : '#fff', border: 'none', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>حملاتي</button>
          <button onClick={() => setActiveTab('pledges')} style={{ background: activeTab === 'pledges' ? '#fff' : 'rgba(255,255,255,0.1)', color: activeTab === 'pledges' ? '#0f4d3a' : '#fff', border: 'none', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>تعهدات ({stats.pendingPledges})</button>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="الحملات" value={stats.total} color="#0f4d3a" />
          <StatBox label="تم جمع" value={stats.totalRaised.toLocaleString()} color="#10b981" />
          <StatBox label="تعهدات معلقة" value={stats.pendingPledges} color="#f59e0b" />
        </div>

        {activeTab === 'campaigns' && (
          <>
            {campaigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
                <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>لا توجد حملات بعد</div>
                <button onClick={openAdd} style={{ background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>+ أنشئ حملة</button>
              </div>
            ) : campaigns.map(c => {
              const cat = CATEGORIES.find(x => x.key === c.category) || CATEGORIES[0];
              const percent = c.target_amount > 0 ? Math.round((c.raised_amount / c.target_amount) * 100) : 0;
              return (
                <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>{c.image_url ? <img src={c.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{cat.icon}</div>}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{c.title}</div>
                      <div style={{ fontSize: 10.5, color: '#64748b' }}>{cat.icon} {cat.label} · الهدف: {Number(c.target_amount).toLocaleString()} ل.س</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: '#10b981', fontWeight: 900 }}>{Number(c.raised_amount || 0).toLocaleString()} ل.س</span>
                    <span style={{ color: '#64748b' }}>{percent}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(percent, 100)}%`, background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 3 }} /></div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(c)} style={btnStyle('rgba(14,165,233,0.1)', '#0284c7')}>✏️ تعديل</button>
                    <button onClick={() => setViewingPledges(c.id)} style={btnStyle('rgba(139,92,246,0.1)', '#8b5cf6')}>📋 التعهدات ({pledges.filter(p => p.campaign_id === c.id).length})</button>
                    <button onClick={() => deleteCampaign(c)} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {activeTab === 'pledges' && (
          <>
            {pledges.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 900 }}>لا توجد تعهدات</div>
              </div>
            ) : pledges.map(p => {
              const statusMap = {
                pending: { label: 'معلق', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                confirmed: { label: 'مؤكد', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                rejected: { label: 'مرفوض', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
              };
              const st = statusMap[p.status] || statusMap.pending;
              return (
                <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>👤 {p.donor_name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📱 {p.donor_phone}</div>
                      <div style={{ fontSize: 11, color: '#8b5cf6', marginTop: 2 }}>📋 {getCampaignTitle(p.campaign_id)}</div>
                    </div>
                    <div style={{ background: st.bg, color: st.color, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>{st.label}</div>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 16, fontWeight: 900, color: '#10b981', textAlign: 'center' }}>{Number(p.amount).toLocaleString()} ل.س</div>
                  {p.message && <div style={{ fontSize: 11.5, color: '#475569', fontStyle: 'italic', marginBottom: 8 }}>"{p.message}"</div>}
                  {p.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => updatePledgeStatus(p.id, 'confirmed')} style={btnStyle('rgba(16,185,129,0.1)', '#10b981')}>✅ تأكيد</button>
                      <button onClick={() => updatePledgeStatus(p.id, 'rejected')} style={btnStyle('rgba(239,68,68,0.1)', '#ef4444')}>❌ رفض</button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {viewingPledges && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>📋 تعهدات: {getCampaignTitle(viewingPledges)}</h2>
              <button onClick={() => setViewingPledges(null)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            {pledges.filter(p => p.campaign_id === viewingPledges).map(p => (
              <div key={p.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <strong>{p.donor_name}</strong>
                  <strong style={{ color: '#10b981' }}>{Number(p.amount).toLocaleString()} ل.س</strong>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{p.donor_phone} · {p.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 20px' }}>{editCampaign ? '✏️ تعديل حملة' : '🤝 حملة جديدة'}</h2>
            <form onSubmit={saveCampaign}>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>عنوان الحملة *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الوصف</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 70, resize: 'none' }} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الهدف المالي (ل.س) *</label><input type="number" value={form.target_amount} onChange={e => setForm({ ...form, target_amount: e.target.value })} required style={inputStyle} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الفئة</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>{CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>صورة (اختياري)</label><label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}><input type="file" accept="image/*" onChange={uploadImage} style={{ display: 'none' }} disabled={uploading} />{form.image_url ? <div style={{ width: '100%', height: 120, borderRadius: 10, overflow: 'hidden' }}><img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div> : <div style={{ width: '100%', height: 80, background: '#f8fafc', borderRadius: 10, border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#64748b' }}>{uploading ? '⏳' : '📸 اختر صورة'}</div>}</label></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div><label style={labelStyle}>الهاتف</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>واتساب</label><input type="tel" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: 20 }}><label style={labelStyle}>آخر موعد</label><input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} style={inputStyle} /></div>
              <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: 14, background: (saving || uploading) ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: (saving || uploading) ? 'wait' : 'pointer', fontFamily: 'inherit' }}>{saving ? '⏳ جارٍ الحفظ...' : (editCampaign ? '💾 حفظ' : '➕ إنشاء')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return <div style={{ background: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 16, fontWeight: 900, color, marginBottom: 2 }}>{value}</div><div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div></div>;
}

const btnStyle = (bg, color) => ({ flex: 1, minWidth: 60, padding: 10, background: bg, color, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' });
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
