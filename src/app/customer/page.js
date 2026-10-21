'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const STATUS_MAP = {
  pending: { label: 'قيد المراجعة', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  confirmed: { label: 'تم القبول', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  preparing: { label: 'قيد التجهيز', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  delivering: { label: 'في الطريق', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  shipped: { label: 'في الطريق', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  done: { label: 'تم التوصيل', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  delivered: { label: 'تم التوصيل', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  cancelled: { label: 'ملغي', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

export default function CustomerAccountPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sanad_customer') || 'null');
      if (!stored?.id) {
        router.replace('/login?next=/customer');
        return;
      }
      setCustomer(stored);
      setForm({ name: stored.name || '', phone: stored.phone || '', address: stored.address || '' });
      loadOrders(stored);
    } catch {
      router.replace('/login?next=/customer');
    }
  }, [router]);

  async function loadOrders(cust) {
    if (!supabase) { setLoading(false); return; }
    try {
      let query = supabase.from('orders').select('*');
      
      // محاولة البحث بـ customer_id أولاً، وإن لم يوجد نستخدم phone
      const { data: byId } = await query.eq('customer_id', cust.id).order('created_at', { ascending: false });
      
      if (byId && byId.length > 0) {
        setOrders(byId);
      } else if (cust.phone) {
        const { data: byPhone } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_phone', cust.phone)
          .order('created_at', { ascending: false });
        setOrders(byPhone || []);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const total = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const active = orders.filter(o => ['pending', 'confirmed', 'preparing', 'delivering', 'shipped'].includes(o.status)).length;
    return {
      count: orders.length,
      total,
      active,
      currency: orders[0]?.currency || 'SYP',
    };
  }, [orders]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toastError('الاسم والهاتف مطلوبان');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ name: form.name, phone: form.phone, address: form.address })
        .eq('id', customer.id);
      
      if (error) throw error;
      
      const updated = { ...customer, name: form.name, phone: form.phone, address: form.address };
      setCustomer(updated);
      localStorage.setItem('sanad_customer', JSON.stringify(updated));
      success('✅ تم حفظ التغييرات');
      setEditing(false);
    } catch (err) {
      console.error(err);
      toastError('فشل حفظ التغييرات');
    } finally { setSaving(false); }
  }

  function handleLogout() {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    localStorage.removeItem('sanad_customer');
    document.cookie = 'sanad_admin=; path=/; max-age=0';
    document.cookie = 'sanad_entity=; path=/; max-age=0';
    document.cookie = 'sanad_customer=; path=/; max-age=0';
    success('👋 تم تسجيل الخروج');
    setTimeout(() => router.replace('/'), 300);
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>⏳</div>;
  if (!customer) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '24px 20px 40px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.2)', color: '#fff', border: '1px solid rgba(239,68,68,0.4)', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            🚪 خروج
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>
            {(customer.name || '؟').charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.name || 'بدون اسم'}</div>
            <div style={{ fontSize: 13, opacity: 0.8, fontFamily: 'monospace' }}>📱 {customer.phone}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: -24 }}>
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatCard icon="🛒" label="الطلبات" value={stats.count} color="#0f4d3a" />
          <StatCard icon="💰" label="المشتريات" value={stats.total.toLocaleString()} color="#10b981" suffix={stats.currency} />
          <StatCard icon="🚚" label="نشطة" value={stats.active} color="#f59e0b" />
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={() => setEditing(true)}
          style={{ width: '100%', padding: 14, background: '#fff', color: '#0f4d3a', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          ✏️ تعديل الملف الشخصي
        </button>

        {/* Orders Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>📦 طلباتي</h2>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800 }}>{orders.length} طلب</span>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#64748b', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>لا توجد طلبات بعد</div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>ابدأ التسوق واستكشف المتاجر</div>
            <Link href="/stores" style={{ display: 'inline-block', background: '#0f4d3a', color: '#fff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>
              تصفح المتاجر
            </Link>
          </div>
        ) : (
          orders.map(order => {
            const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
            const isExpanded = expandedOrder === order.id;
            const items = Array.isArray(order.items) ? order.items : [];
            
            return (
              <div key={order.id} style={{ background: '#fff', borderRadius: 16, marginBottom: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: 14, cursor: 'pointer' }} onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'monospace', color: '#0f172a' }}>
                      #{order.order_code || order.id.slice(0, 8)}
                    </div>
                    <div style={{ background: status.bg, color: status.color, padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>
                      {status.label}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                    🏪 {order.provider_name || 'متجر'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0f4d3a' }}>
                      {Number(order.total || 0).toLocaleString()} <span style={{ fontSize: 10, color: '#64748b' }}>{order.currency || 'SYP'}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                    {items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                        {item.image ? (
                          <img src={item.image} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#1e293b' }}>{item.title}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.qty} × {Number(item.price || 0).toLocaleString()} {order.currency}</div>
                        </div>
                      </div>
                    ))}
                    
                    {order.notes && (
                      <div style={{ padding: 10, background: 'rgba(251,191,36,0.1)', borderRadius: 8, fontSize: 11, color: '#92400e', marginTop: 8, border: '1px solid rgba(251,191,36,0.3)' }}>
                        <strong>📝 ملاحظات:</strong> {order.notes}
                      </div>
                    )}

                    {order.driver_name && ['shipped', 'delivering'].includes(order.status) && (
                      <div style={{ padding: 10, background: 'rgba(14,165,233,0.1)', borderRadius: 8, fontSize: 11, color: '#0284c7', marginTop: 8, border: '1px solid rgba(14,165,233,0.3)' }}>
                        🚚 <strong>{order.driver_name}</strong> في الطريق إليك
                        {order.driver_phone && (
                          <a href={`tel:${order.driver_phone}`} style={{ display: 'inline-block', marginRight: 8, color: '#0284c7', fontWeight: 900, textDecoration: 'underline' }}>📞 اتصل</a>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                      {order.master_order_id && (
                        <Link href={`/order/${order.master_order_id}`} style={{ flex: 1, padding: 10, background: 'rgba(14,165,233,0.1)', color: '#0284c7', borderRadius: 8, textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900, border: '1px solid rgba(14,165,233,0.3)' }}>
                          🔍 تتبع الطلب
                        </Link>
                      )}
                      {order.provider_phone && (
                        <a href={`https://wa.me/${order.provider_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('بخصوص طلبي #' + (order.order_code || ''))}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: 10, background: 'rgba(37,211,102,0.1)', color: '#25D366', borderRadius: 8, textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 900, border: '1px solid rgba(37,211,102,0.3)' }}>
                          💬 المتجر
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        <div style={{ height: 20 }} />
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>✏️ تعديل الملف الشخصي</h2>
              <button onClick={() => setEditing(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>الاسم الكامل</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} placeholder="اسمك" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>رقم الهاتف</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required style={inputStyle} placeholder="09xxxxxxxx" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>العنوان</label>
                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ ...inputStyle, height: 70, resize: 'none' }} placeholder="الحي، الشارع..." />
              </div>
              <button type="submit" disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ التغييرات'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, suffix }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color, marginBottom: 2 }}>
        {value}{suffix && <span style={{ fontSize: 9, color: '#94a3b8', marginRight: 2 }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800 }}>{label}</div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
