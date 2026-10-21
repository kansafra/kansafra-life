'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function BloodPage() {
  const { success, error: toastError } = useToast();
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  // Request form
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ blood_type: '', patient_name: '', phone: '', hospital: '', city: '', notes: '', urgency: 'normal' });
  const [sending, setSending] = useState(false);

  // Donor form
  const [donorForm, setDonorForm] = useState({ name: '', phone: '', blood_type: '', city: '', notes: '' });
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadRequests();
    try {
      const customer = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      if (customer?.phone) {
        setRequestForm(f => ({ ...f, phone: customer.phone }));
        setDonorForm(f => ({ ...f, name: customer.name || '', phone: customer.phone }));
      }
    } catch {}

    const channel = supabase
      .channel('blood-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blood_requests' }, (payload) => {
        if (payload.new.status === 'active') {
          success('🩸 طلب دم جديد');
          setRequests(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function loadRequests() {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);
      setRequests(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleRequestSubmit(e) {
    e.preventDefault();
    if (!requestForm.blood_type) { toastError('اختر زمرة الدم'); return; }
    if (!requestForm.phone.trim()) { toastError('رقم الهاتف مطلوب'); return; }
    setSending(true);
    try {
      const { error } = await supabase.from('blood_requests').insert({
        ...requestForm,
        status: 'active',
      });
      if (error) throw error;
      success('🩸 تم نشر طلب الدم، سيصل للمتبرعين');
      setShowRequestForm(false);
      setRequestForm({ blood_type: '', patient_name: '', phone: '', hospital: '', city: '', notes: '', urgency: 'normal' });
    } catch (err) {
      console.error(err);
      toastError('فشل النشر');
    } finally { setSending(false); }
  }

  async function handleDonorSubmit(e) {
    e.preventDefault();
    if (!donorForm.name.trim() || !donorForm.phone.trim() || !donorForm.blood_type) {
      toastError('الاسم والهاتف وزمرة الدم مطلوبة');
      return;
    }
    setRegistering(true);
    try {
      // تحقق من عدم التكرار
      const { data: existing } = await supabase
        .from('blood_donors')
        .select('id')
        .eq('phone', donorForm.phone.replace(/[^0-9]/g, ''))
        .maybeSingle();

      if (existing) {
        toastError('أنت مسجل كمتبرع مسبقاً');
        setRegistering(false);
        return;
      }

      const { error } = await supabase.from('blood_donors').insert({
        name: donorForm.name,
        phone: donorForm.phone.replace(/[^0-9]/g, ''),
        blood_type: donorForm.blood_type,
        city: donorForm.city,
        notes: donorForm.notes,
        is_available: true,
      });
      if (error) throw error;
      success('💚 شكراً لتسجيلك كمتبرع!');
      setDonorForm({ name: '', phone: '', blood_type: '', city: '', notes: '' });
    } catch (err) {
      console.error(err);
      toastError('فشل التسجيل');
    } finally { setRegistering(false); }
  }

  const filtered = useMemo(() => {
    if (filterType === 'all') return requests;
    return requests.filter(r => r.blood_type === filterType);
  }, [requests, filterType]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fef2f2 0%, #f8fafc 25%)', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', padding: '24px 20px', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, flex: 1 }}>🩸 بنك الدم المجتمعي</h1>
        </div>
        <p style={{ fontSize: 12, opacity: 0.9, margin: 0 }}>تبرعك قد ينقذ حياة إنسان</p>
      </div>

      <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: 14, padding: 4, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <button onClick={() => setTab('requests')} style={{ flex: 1, padding: 12, background: tab === 'requests' ? '#dc2626' : 'transparent', color: tab === 'requests' ? '#fff' : '#64748b', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            📋 الطلبات ({requests.length})
          </button>
          <button onClick={() => setTab('donate')} style={{ flex: 1, padding: 12, background: tab === 'donate' ? '#10b981' : 'transparent', color: tab === 'donate' ? '#fff' : '#64748b', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            💚 أنا متبرع
          </button>
        </div>

        {/* Requests Tab */}
        {tab === 'requests' && (
          <>
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setShowRequestForm(true)} style={{ flex: 1, padding: 14, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
                🩸 طلب دم جديد
              </button>
            </div>

            {/* Filter by type */}
            <div style={{ marginBottom: 16, overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setFilterType('all')} style={filterBtnStyle(filterType === 'all', '#0f4d3a')}>الكل</button>
                {BLOOD_TYPES.map(type => (
                  <button key={type} onClick={() => setFilterType(type)} style={filterBtnStyle(filterType === type, '#dc2626')}>{type}</button>
                ))}
              </div>
            </div>

            {/* Requests List */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🩸</div>
                <div style={{ fontSize: 15, fontWeight: 900 }}>لا توجد طلبات {filterType !== 'all' ? `من زمرة ${filterType}` : 'نشطة'}</div>
              </div>
            ) : (
              filtered.map(req => {
                const phone = (req.phone || '').replace(/[^0-9]/g, '');
                const waLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(`مرحباً، رأيت طلب الدم على منصة سند. هل ما زلت بحاجة للتبرع؟`)}` : null;
                const isUrgent = req.urgency === 'urgent';
                const minsAgo = Math.floor((Date.now() - new Date(req.created_at).getTime()) / 60000);

                return (
                  <div key={req.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, border: isUrgent ? '2px solid #dc2626' : '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, flexShrink: 0 }}>
                        {req.blood_type}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
                            {req.patient_name || 'مريض يحتاج تبرع'}
                          </div>
                          {isUrgent && (
                            <span style={{ background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900, animation: 'blink 1.5s infinite' }}>
                              ⚡ عاجل
                            </span>
                          )}
                        </div>
                        {req.hospital && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>🏥 {req.hospital}</div>}
                        {req.city && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>📍 {req.city}</div>}
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>منذ {minsAgo} دقيقة</div>
                      </div>
                    </div>

                    {req.notes && (
                      <div style={{ background: '#fef2f2', padding: 10, borderRadius: 8, fontSize: 12, color: '#7f1d1d', lineHeight: 1.6, marginBottom: 10, border: '1px solid #fecaca' }}>
                        {req.notes}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6 }}>
                      {phone && (
                        <a href={`tel:${phone}`} style={{ flex: 1, padding: 12, background: '#dc2626', color: '#fff', borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>
                          📞 اتصل
                        </a>
                      )}
                      {waLink && (
                        <a href={waLink} target="_blank" rel="noreferrer" style={{ flex: 1, padding: 12, background: '#25D366', color: '#fff', borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>
                          💬 واتساب
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Donor Tab */}
        {tab === 'donate' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>💚</div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 6px' }}>كن بطلاً في حياة إنسان</h2>
              <p style={{ fontSize: 12, opacity: 0.9, margin: 0 }}>سجّل كمتبرع ليصلك إشعار عند حاجة زمرتك</p>
            </div>

            <form onSubmit={handleDonorSubmit}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>الاسم الكامل *</label>
                  <input type="text" value={donorForm.name} onChange={e => setDonorForm({ ...donorForm, name: e.target.value })} placeholder="اسمك الكامل" style={inputStyle} required />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>رقم الهاتف *</label>
                  <input type="tel" value={donorForm.phone} onChange={e => setDonorForm({ ...donorForm, phone: e.target.value })} placeholder="09xxxxxxxx" style={inputStyle} required />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>زمرة الدم *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 4 }}>
                    {BLOOD_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDonorForm({ ...donorForm, blood_type: type })}
                        style={{
                          padding: 12,
                          background: donorForm.blood_type === type ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : '#f8fafc',
                          color: donorForm.blood_type === type ? '#fff' : '#1e293b',
                          border: donorForm.blood_type === type ? '2px solid #dc2626' : '1px solid #e2e8f0',
                          borderRadius: 10, fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>المدينة</label>
                  <input type="text" value={donorForm.city} onChange={e => setDonorForm({ ...donorForm, city: e.target.value })} placeholder="مثال: كنصفرة" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>ملاحظات (اختياري)</label>
                  <textarea value={donorForm.notes} onChange={e => setDonorForm({ ...donorForm, notes: e.target.value })} placeholder="أي معلومات صحية مهمة..." style={{ ...inputStyle, height: 60, resize: 'none' }} />
                </div>
              </div>

              <button type="submit" disabled={registering} style={{ width: '100%', padding: 16, background: registering ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: registering ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
                {registering ? '⏳ جارٍ التسجيل...' : '💚 تسجيل كمتبرع'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>🩸 طلب دم جديد</h2>
              <button onClick={() => setShowRequestForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleRequestSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>زمرة الدم المطلوبة *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 4 }}>
                  {BLOOD_TYPES.map(type => (
                    <button key={type} type="button" onClick={() => setRequestForm({ ...requestForm, blood_type: type })} style={{ padding: 10, background: requestForm.blood_type === type ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : '#f8fafc', color: requestForm.blood_type === type ? '#fff' : '#1e293b', border: requestForm.blood_type === type ? '2px solid #dc2626' : '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{type}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>اسم المريض</label>
                <input value={requestForm.patient_name} onChange={e => setRequestForm({ ...requestForm, patient_name: e.target.value })} style={inputStyle} placeholder="اسم المريض" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>رقم الهاتف *</label>
                <input type="tel" value={requestForm.phone} onChange={e => setRequestForm({ ...requestForm, phone: e.target.value })} required style={inputStyle} placeholder="09xxxxxxxx" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>المستشفى</label>
                <input value={requestForm.hospital} onChange={e => setRequestForm({ ...requestForm, hospital: e.target.value })} style={inputStyle} placeholder="اسم المستشفى" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>المدينة</label>
                <input value={requestForm.city} onChange={e => setRequestForm({ ...requestForm, city: e.target.value })} style={inputStyle} placeholder="المدينة" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>ملاحظات</label>
                <textarea value={requestForm.notes} onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'none' }} placeholder="تفاصيل إضافية..." />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: requestForm.urgency === 'urgent' ? 'rgba(220,38,38,0.1)' : '#f8fafc', border: `1px solid ${requestForm.urgency === 'urgent' ? '#dc2626' : '#e2e8f0'}`, borderRadius: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={requestForm.urgency === 'urgent'} onChange={e => setRequestForm({ ...requestForm, urgency: e.target.checked ? 'urgent' : 'normal' })} style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 13, fontWeight: 900, color: requestForm.urgency === 'urgent' ? '#dc2626' : '#1e293b' }}>⚡ حالة عاجلة</span>
                </label>
              </div>
              <button type="submit" disabled={sending} style={{ width: '100%', padding: 14, background: sending ? '#94a3b8' : 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 15, cursor: sending ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {sending ? '⏳ جارٍ النشر...' : '🩸 نشر الطلب'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    </div>
  );
}

function filterBtnStyle(active, color) {
  return {
    background: active ? color : '#fff',
    color: active ? '#fff' : '#64748b',
    border: active ? `1px solid ${color}` : '1px solid #e2e8f0',
    padding: '8px 14px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  };
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
