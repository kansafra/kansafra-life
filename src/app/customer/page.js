'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCustomer, logoutCustomer, updateCustomerSession } from '@/lib/customerAuth';
import NotificationToggle from '@/components/NotificationToggle';

export default function CustomerAccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const c = getCustomer();
    if (!c) { router.replace('/'); return; }
    setCustomer(c);
    setForm({ full_name: c.full_name || '', address: c.address || '', email: c.email || '' });
    load(c);
  }, [router]);

  async function load(c) {
    if (!supabase || !c || !c.phone) { setLoading(false); return; }
    const [ordRes, aptRes] = await Promise.all([
      supabase.from('orders').select('*').eq('customer_phone', c.phone).order('created_at', { ascending: false }).limit(20),
      supabase.from('appointments').select('*').eq('patient_phone', c.phone).order('appointment_date', { ascending: false }).limit(20),
    ]);
    setOrders(Array.isArray(ordRes.data) ? ordRes.data : []);
    setAppointments(Array.isArray(aptRes.data) ? aptRes.data : []);
    setLoading(false);
  }

  async function saveProfile() {
    if (!form.full_name || !form.full_name.trim()) { alert('الاسم مطلوب'); return; }
    try {
      if (customer.id && !customer.is_guest) {
        await supabase.from('customers').update({
          full_name: form.full_name.trim(),
          address: form.address ? form.address.trim() : null,
          email: form.email ? form.email.trim() : null,
        }).eq('id', customer.id);
      }
      updateCustomerSession({
        full_name: form.full_name.trim(),
        address: form.address ? form.address.trim() : null,
        email: form.email ? form.email.trim() : null,
      });
      setCustomer(Object.assign({}, customer, { full_name: form.full_name.trim(), address: form.address, email: form.email }));
      setEditing(false);
      alert('✅ تم حفظ التعديلات');
    } catch (e) {
      alert('تعذّر: ' + e.message);
    }
  }

  function handleLogout() {
    if (!confirm('تسجيل الخروج؟')) return;
    logoutCustomer();
    router.push('/');
  }

  if (!customer) {
    return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;
  }

  const isGuest = customer.is_guest === true;

  return (
    <div className="sect-page" style={{ paddingBottom: 100 }}>
      <div className="inv-header">
        <button className="inv-back" onClick={() => router.back()} type="button">→</button>
        <span className="inv-title">👤 حسابي</span>
        <span style={{ width: 40 }} />
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ padding: 20, background: isGuest ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #0f4d3a, #0a6b50)', borderRadius: 20, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              {isGuest ? '👤' : '🛍️'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{customer.full_name}</div>
              <div style={{ fontSize: 12, opacity: .85, direction: 'ltr', textAlign: 'right', marginTop: 2 }}>
                {customer.phone}
              </div>
              {isGuest && (
                <div style={{ fontSize: 10, marginTop: 4, background: 'rgba(255,255,255,.2)', padding: '2px 8px', borderRadius: 999, display: 'inline-block' }}>
                  👤 زائر — سجّل لتحفظ سجلك
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div style={{ textAlign: 'center', padding: 10, background: 'rgba(0,0,0,.15)', borderRadius: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{orders.length}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>طلب</div>
            </div>
            <div style={{ textAlign: 'center', padding: 10, background: 'rgba(0,0,0,.15)', borderRadius: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{appointments.length}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>موعد</div>
            </div>
            <div style={{ textAlign: 'center', padding: 10, background: 'rgba(0,0,0,.15)', borderRadius: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{customer.loyalty_points || 0}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>نقطة</div>
            </div>
          </div>
        </div>
      </div>

      {isGuest && (
        <div style={{ padding: '0 16px 16px' }}>
          <Link href="/register" style={{ display: 'block', padding: 14, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', borderRadius: 14, fontSize: 14, fontWeight: 900, textAlign: 'center', textDecoration: 'none' }}>
            ✨ أنشئ حساباً لحفظ سجلك
          </Link>
        </div>
      )}

      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>📋 معلوماتي</div>
        {!editing ? (
          <div className="debt-card" style={{ borderRightColor: '#0f4d3a' }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}><strong>الاسم:</strong> {customer.full_name}</div>
            <div style={{ fontSize: 13, marginBottom: 8, direction: 'ltr', textAlign: 'right' }}><strong>📞</strong> {customer.phone}</div>
            {customer.address && <div style={{ fontSize: 13, marginBottom: 8 }}><strong>📍</strong> {customer.address}</div>}
            {customer.email && <div style={{ fontSize: 13, marginBottom: 8, direction: 'ltr', textAlign: 'right' }}><strong>📧</strong> {customer.email}</div>}
            <button onClick={() => setEditing(true)} type="button" style={{ marginTop: 10, padding: '8px 16px', background: 'rgba(15,77,58,.1)', color: '#0f4d3a', border: '1px solid rgba(15,77,58,.2)', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
              ✏️ تعديل
            </button>
          </div>
        ) : (
          <div className="debt-card" style={{ borderRightColor: '#0f4d3a' }}>
            <div className="new-service-field" style={{ marginBottom: 10 }}>
              <label className="new-service-label">الاسم</label>
              <input className="new-service-input" value={form.full_name} onChange={(e) => setForm(Object.assign({}, form, { full_name: e.target.value }))} />
            </div>
            <div className="new-service-field" style={{ marginBottom: 10 }}>
              <label className="new-service-label">📍 العنوان</label>
              <input className="new-service-input" value={form.address} onChange={(e) => setForm(Object.assign({}, form, { address: e.target.value }))} />
            </div>
            <div className="new-service-field" style={{ marginBottom: 10 }}>
              <label className="new-service-label">📧 الإيميل</label>
              <input className="new-service-input" type="email" value={form.email} onChange={(e) => setForm(Object.assign({}, form, { email: e.target.value }))} style={{ direction: 'ltr' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="mng-btn primary" onClick={saveProfile} type="button" style={{ flex: 1 }}>✓ حفظ</button>
              <button className="mng-btn ghost" onClick={() => setEditing(false)} type="button">إلغاء</button>
            </div>
          </div>
        )}
      </div>

      {orders.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>🛍️ طلباتي ({orders.length})</div>
          {orders.slice(0, 5).map((o) => (
            <Link key={o.id} href={'/order/' + o.id} style={{ display: 'block', padding: 12, background: 'rgba(255,255,255,.03)', borderRadius: 12, marginBottom: 8, textDecoration: 'none', color: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 900 }}>{o.order_code}</div>
              <div style={{ fontSize: 11, color: 'var(--n-500)', marginTop: 4 }}>
                🏪 {o.provider_name} · {Number(o.total).toLocaleString()} {o.currency || 'SYP'}
              </div>
            </Link>
          ))}
        </div>
      )}

      {appointments.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>📅 مواعيدي ({appointments.length})</div>
          {appointments.slice(0, 5).map((a) => (
            <div key={a.id} style={{ padding: 12, background: 'rgba(255,255,255,.03)', borderRadius: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 900 }}>👨‍⚕️ {a.doctor_name}</div>
              <div style={{ fontSize: 11, color: 'var(--n-500)', marginTop: 4 }}>
                📅 {a.appointment_date} · ⏰ {a.appointment_time}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '0 16px 16px' }}>
        <NotificationToggle userKey={customer?.phone} userType="customer" />
      </div>

      <div style={{ padding: '0 16px' }}>
        <button onClick={handleLogout} type="button" style={{ width: '100%', padding: 14, background: 'rgba(220,38,38,.1)', color: '#f87171', border: '1px solid rgba(220,38,38,.3)', borderRadius: 14, fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
          🚪 تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
