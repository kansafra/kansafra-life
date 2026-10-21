'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const SOS_TYPES = [
  { key: 'medical', label: 'إسعاف طبي', icon: '🚑', color: '#ef4444' },
  { key: 'fire', label: 'حريق', icon: '🔥', color: '#f97316' },
  { key: 'security', label: 'أمن / شرطة', icon: '🚓', color: '#3b82f6' },
  { key: 'other', label: 'أخرى', icon: '🆘', color: '#8b5cf6' },
];

export default function SOSPage() {
  const { success, error: toastError } = useToast();
  const [tab, setTab] = useState('send');
  const [sending, setSending] = useState(false);
  const [gettingLoc, setGettingLoc] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const [form, setForm] = useState({ type: 'medical', description: '', phone: '', address: '' });
  const [location, setLocation] = useState(null);

  useEffect(() => {
    loadActiveAlerts();
    try {
      const customer = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      if (customer?.phone) {
        setForm(f => ({ ...f, phone: customer.phone, address: customer.address || '' }));
      }
    } catch {}

    const channel = supabase
      .channel('sos-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sos_requests' }, (payload) => {
        if (payload.new.status === 'active') {
          setActiveAlerts(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function loadActiveAlerts() {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('sos_requests')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(30);
      setActiveAlerts(data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingAlerts(false); }
  }

  async function getLocation() {
    if (!navigator.geolocation) {
      toastError('متصفحك لا يدعم تحديد الموقع');
      return;
    }
    setGettingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        success('✅ تم تحديد موقعك');
        setGettingLoc(false);
      },
      (err) => {
        toastError('تعذر تحديد الموقع: ' + err.message);
        setGettingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.phone.trim()) { toastError('رقم الهاتف مطلوب'); return; }
    if (!form.description.trim() && form.type === 'other') {
      toastError('يرجى وصف الحالة');
      return;
    }
    setSending(true);
    try {
      const customer = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      const payload = {
        type: form.type,
        description: form.description,
        phone: form.phone,
        address: form.address,
        lat: location?.lat || null,
        lng: location?.lng || null,
        user_name: customer?.name || null,
        status: 'active',
      };
      const { error } = await supabase.from('sos_requests').insert(payload);
      if (error) throw error;
      success('🚨 تم إرسال نداء الاستغاثة، سيساعدك أحد قريباً');
      setForm({ ...form, description: '' });
    } catch (err) {
      console.error(err);
      toastError('فشل الإرسال، حاول مرة أخرى');
    } finally { setSending(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fef2f2 0%, #f8fafc 30%)', paddingBottom: 40 }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ color: '#0f4d3a', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0, flex: 1 }}>🚨 الطوارئ</h1>
      </div>

      <div style={{ padding: '0 16px', maxWidth: 600, margin: '0 auto' }}>
        {/* Warning Banner */}
        <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2 }}>في حالة خطر حقيقي، اتصل بالطوارئ أولاً</div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>المنصة للدعم المجتمعي، وليست بديلاً عن الجهات الرسمية</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: 14, padding: 4, marginBottom: 20, border: '1px solid #e2e8f0' }}>
          <button onClick={() => setTab('send')} style={{ flex: 1, padding: 12, background: tab === 'send' ? '#ef4444' : 'transparent', color: tab === 'send' ? '#fff' : '#64748b', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            🆘 إرسال استغاثة
          </button>
          <button onClick={() => setTab('active')} style={{ flex: 1, padding: 12, background: tab === 'active' ? '#0f4d3a' : 'transparent', color: tab === 'active' ? '#fff' : '#64748b', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            📢 نشطة ({activeAlerts.length})
          </button>
        </div>

        {/* Send Tab */}
        {tab === 'send' && (
          <form onSubmit={handleSubmit}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginTop: 0, marginBottom: 12 }}>نوع الحالة</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {SOS_TYPES.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.key })}
                    style={{
                      padding: '14px 8px',
                      background: form.type === t.key ? `${t.color}15` : '#f8fafc',
                      border: form.type === t.key ? `2px solid ${t.color}` : '1px solid #e2e8f0',
                      borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}
                  >
                    <div style={{ fontSize: 24 }}>{t.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: form.type === t.key ? t.color : '#475569' }}>{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginTop: 0, marginBottom: 12 }}>تفاصيل الحالة</h2>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>وصف مختصر</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="اكتب وصفاً قصيراً للحالة..." style={{ ...inputStyle, height: 80, resize: 'none' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>رقم الهاتف للتواصل</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="09xxxxxxxx" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>العنوان (اختياري)</label>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="الحي، الشارع..." style={inputStyle} />
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', margin: 0 }}>📍 الموقع الجغرافي</h2>
                <button type="button" onClick={getLocation} disabled={gettingLoc} style={{ background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.3)', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: gettingLoc ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                  {gettingLoc ? '⏳ جارٍ التحديد...' : location ? '🔄 تحديث' : '📍 تحديد موقعي'}
                </button>
              </div>
              {location ? (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: 10, fontSize: 12, color: '#047857', fontWeight: 800 }}>
                  ✅ تم تحديد موقعك ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
                </div>
              ) : (
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                  لم يتم تحديد الموقع. المساعدة ستكون أسرع إذا حددت موقعك.
                </div>
              )}
            </div>

            <button type="submit" disabled={sending} style={{ width: '100%', padding: 18, background: sending ? '#94a3b8' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: sending ? 'wait' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(239,68,68,0.3)' }}>
              {sending ? '⏳ جارٍ الإرسال...' : '🚨 إرسال نداء الاستغاثة'}
            </button>
          </form>
        )}

        {/* Active Alerts Tab */}
        {tab === 'active' && (
          <div>
            {loadingAlerts ? (
              <div style={{ textAlign: 'center', padding: 40 }}>⏳</div>
            ) : activeAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 900 }}>لا توجد استغاثات نشطة حالياً</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>شكراً لتفقدك مجتمعك</div>
              </div>
            ) : (
              activeAlerts.map(alert => {
                const type = SOS_TYPES.find(t => t.key === alert.type) || SOS_TYPES[3];
                const mapLink = alert.lat && alert.lng
                  ? `https://www.google.com/maps?q=${alert.lat},${alert.lng}`
                  : null;
                const phone = (alert.phone || '').replace(/[^0-9]/g, '');
                const minsAgo = Math.floor((Date.now() - new Date(alert.created_at).getTime()) / 60000);

                return (
                  <div key={alert.id} style={{ background: '#fff', borderRadius: 16, padding: 16, border: `2px solid ${type.color}30`, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${type.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                        {type.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{type.label}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {alert.user_name || 'مستخدم'} · منذ {minsAgo} دقيقة
                        </div>
                      </div>
                      <div style={{ background: type.color, color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 900, animation: 'pulse 2s infinite' }}>
                        🔴 نشط
                      </div>
                    </div>

                    {alert.description && (
                      <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 10 }}>
                        {alert.description}
                      </div>
                    )}

                    {alert.address && (
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                        📍 {alert.address}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6 }}>
                      {phone && (
                        <a href={`tel:${phone}`} style={{ flex: 1, padding: 10, background: type.color, color: '#fff', borderRadius: 8, textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>
                          📞 اتصل
                        </a>
                      )}
                      {mapLink && (
                        <a href={mapLink} target="_blank" rel="noreferrer" style={{ flex: 1, padding: 10, background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8, textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900 }}>
                          🗺️ الموقع
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
