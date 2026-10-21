'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const CATEGORIES = {
  general: { label: 'عام', icon: '🤝' },
  food: { label: 'غذاء', icon: '🍞' },
  medical: { label: 'طبي', icon: '🏥' },
  education: { label: 'تعليم', icon: '📚' },
  shelter: { label: 'مأوى', icon: '🏠' },
  emergency: { label: 'طوارئ', icon: '🚨' },
};

export default function CharitiesPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [pledgeForm, setPledgeForm] = useState({ donor_name: '', donor_phone: '', amount: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCampaigns();
    try {
      const cust = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      if (cust) setPledgeForm(f => ({ ...f, donor_name: cust.name || '', donor_phone: cust.phone || '' }));
    } catch {}
  }, []);

  async function loadCampaigns() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('donation_campaigns')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setCampaigns(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    let list = campaigns;
    if (categoryFilter !== 'all') list = list.filter(c => c.category === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.provider_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [campaigns, categoryFilter, search]);

  const stats = useMemo(() => {
    const totalRaised = campaigns.reduce((s, c) => s + Number(c.raised_amount || 0), 0);
    const totalTarget = campaigns.reduce((s, c) => s + Number(c.target_amount || 0), 0);
    return { count: campaigns.length, totalRaised, totalTarget };
  }, [campaigns]);

  async function submitPledge(e) {
    e.preventDefault();
    if (!pledgeForm.donor_name.trim() || !pledgeForm.donor_phone.trim()) { toastError('الاسم والهاتف مطلوبان'); return; }
    if (!pledgeForm.amount || Number(pledgeForm.amount) <= 0) { toastError('المبلغ مطلوب'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('donation_pledges').insert({
        campaign_id: selectedCampaign.id,
        donor_name: pledgeForm.donor_name.trim(),
        donor_phone: pledgeForm.donor_phone.trim(),
        amount: Number(pledgeForm.amount),
        message: pledgeForm.message.trim() || null,
        status: 'pending',
      });
      if (error) throw error;
      success('🎉 تم تسجيل تعهدك بالتبرع. سيتواصل معك المسؤول قريباً.');
      setSelectedCampaign(null);
      setPledgeForm({ donor_name: '', donor_phone: '', amount: '', message: '' });
    } catch (err) { console.error(err); toastError('فشل التسجيل'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '20px', color: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.back()} style={{ color: '#fff', background: 'rgba(255,255,255,.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🤝 الجمعيات الخيرية</h1>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{stats.count} حملة نشطة</div>
          </div>
        </div>
        <input type="search" placeholder="🔍 ابحث عن حملة..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit' }} />
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        {stats.totalTarget > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 16, padding: 20, color: '#fff', marginBottom: 16, boxShadow: '0 10px 30px rgba(16,185,129,0.15)' }}>
            <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 700, marginBottom: 6 }}>إجمالي التبرعات على المنصة</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{stats.totalRaised.toLocaleString()} <span style={{ fontSize: 13 }}>ل.س</span></div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>من أصل هدف {stats.totalTarget.toLocaleString()} ل.س</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setCategoryFilter('all')} style={chip(categoryFilter === 'all')}>الكل</button>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <button key={k} onClick={() => setCategoryFilter(k)} style={chip(categoryFilter === k)}>{v.icon} {v.label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🤝</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{campaigns.length === 0 ? 'لا توجد حملات نشطة حالياً' : 'لا نتائج'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.map(c => {
              const cat = CATEGORIES[c.category] || CATEGORIES.general;
              const percent = c.target_amount > 0 ? Math.round((c.raised_amount / c.target_amount) * 100) : 0;
              const phone = (c.phone || '').replace(/[^0-9]/g, '');
              return (
                <div key={c.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                  {c.image_url ? <img src={c.image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' }} /> : <div style={{ width: '100%', height: 140, background: 'linear-gradient(135deg, #f0fdf4, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>{cat.icon}</div>}
                  <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900, display: 'inline-block', marginBottom: 6, alignSelf: 'flex-start' }}>{cat.icon} {cat.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>🏪 {c.provider_name || '—'}</div>
                    {c.description && <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</div>}
                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: '#10b981', fontWeight: 900 }}>{Number(c.raised_amount || 0).toLocaleString()} ل.س</span>
                        <span style={{ color: '#64748b' }}>من {Number(c.target_amount || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(percent, 100)}%`, background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 3 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setSelectedCampaign(c)} style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🤝 تبرع</button>
                        {phone && <a href={`https://wa.me/${phone}?text=${encodeURIComponent('مرحباً، مهتم بالحملة: ' + c.title)}`} target="_blank" rel="noreferrer" style={{ padding: '10px 12px', background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>💬</a>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedCampaign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>🤝 تعهد بالتبرع</h2>
              <button onClick={() => setSelectedCampaign(null)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: '#475569' }}>
              <strong>{selectedCampaign.title}</strong>
              <div style={{ marginTop: 4, color: '#10b981', fontWeight: 900 }}>الهدف: {Number(selectedCampaign.target_amount).toLocaleString()} ل.س</div>
            </div>
            <form onSubmit={submitPledge}>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الاسم *</label><input value={pledgeForm.donor_name} onChange={e => setPledgeForm({ ...pledgeForm, donor_name: e.target.value })} required style={inputStyle} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>الهاتف *</label><input type="tel" value={pledgeForm.donor_phone} onChange={e => setPledgeForm({ ...pledgeForm, donor_phone: e.target.value })} required style={inputStyle} /></div>
              <div style={{ marginBottom: 12 }}><label style={labelStyle}>المبلغ (ل.س) *</label><input type="number" value={pledgeForm.amount} onChange={e => setPledgeForm({ ...pledgeForm, amount: e.target.value })} required style={inputStyle} /></div>
              <div style={{ marginBottom: 20 }}><label style={labelStyle}>رسالة (اختياري)</label><textarea value={pledgeForm.message} onChange={e => setPledgeForm({ ...pledgeForm, message: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} /></div>
              <button type="submit" disabled={submitting} style={{ width: '100%', padding: 14, background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {submitting ? '⏳ جارٍ التسجيل...' : '🤝 تأكيد التعهد'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function chip(active) {
  return { background: active ? '#0f4d3a' : '#fff', color: active ? '#fff' : '#64748b', border: active ? '1px solid #0f4d3a' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
