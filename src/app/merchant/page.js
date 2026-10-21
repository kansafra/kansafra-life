'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { getEntityConfig } from '@/lib/entityConfig';
import { SkeletonList } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

export default function MerchantDashboard() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user, loading: userLoading, isOwner, isEmployee, isSectionAdmin, hasPermission, dataOwnerName, sectionType } = useCurrentUser();
  
  const [entityData, setEntityData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showDebts, setShowDebts] = useState(false);

  const [settingsForm, setSettingsForm] = useState({ display_name: '', phone: '', address: '', description: '', logo_url: '' });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '', role: 'sales' });

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/login'); return; }
    loadData();
    if (dataOwnerName) {
      const channel = supabase
        .channel('merchant-realtime-' + dataOwnerName)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
          if (payload.new.provider_name === dataOwnerName || isSectionAdmin) {
            success('🔔 لديك طلب جديد!');
            loadData();
          }
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [user, userLoading, dataOwnerName]);

  async function loadData() {
    if (!supabase || !dataOwnerName) { setLoading(false); return; }
    try {
      const { data: ent } = await supabase.from('entities').select('*').eq('display_name', dataOwnerName).maybeSingle();
      if (ent) {
        setEntityData(ent);
        setSettingsForm({
          display_name: ent.display_name || '',
          phone: ent.phone || '',
          address: ent.address || '',
          description: ent.description || '',
          logo_url: ent.logo_url || ''
        });
      }
      let oq = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
      let pq = supabase.from('products').select('id', { count: 'exact', head: true });
      let cq = supabase.from('customers').select('id', { count: 'exact', head: true });
      let dq = supabase.from('debts').select('*').order('created_at', { ascending: false });
      if (!isSectionAdmin) {
        oq = oq.eq('provider_name', dataOwnerName);
        pq = pq.eq('provider_name', dataOwnerName);
        cq = cq.eq('entity_name', dataOwnerName);
        dq = dq.eq('entity_name', dataOwnerName);
      }
      const [o, p, c, d, s] = await Promise.all([
        oq, pq, cq, dq,
        supabase.from('entity_subscriptions').select('*').eq('entity_id', user?.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);
      setOrders(o.data || []);
      setProducts({ count: p.count || 0 });
      setCustomers({ count: c.count || 0 });
      setDebts(d.data || []);
      setSub(s.data || null);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    if (!entityData?.id) return;
    const { error } = await supabase.from('entities').update({
      display_name: settingsForm.display_name,
      phone: settingsForm.phone,
      address: settingsForm.address,
      description: settingsForm.description
    }).eq('id', entityData.id);
    if (error) toastError('فشل تحديث البيانات');
    else { success('✅ تم تحديث بيانات المتجر'); setShowSettings(false); loadData(); }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !entityData?.id) return;
    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${entityData.id}-${Date.now()}.${fileExt}`;
      const { error: upErr } = await supabase.storage.from('sanad-files').upload(fileName, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('sanad-files').getPublicUrl(fileName);
      await supabase.from('entities').update({ logo_url: urlData.publicUrl }).eq('id', entityData.id);
      setSettingsForm({ ...settingsForm, logo_url: urlData.publicUrl });
      setEntityData({ ...entityData, logo_url: urlData.publicUrl });
      success('✅ تم رفع اللوجو');
    } catch (err) { toastError('حدث خطأ أثناء رفع الصورة'); }
    finally { setUploadingLogo(false); }
  }

  async function handleAddCustomer(e) {
    e.preventDefault();
    const { error } = await supabase.from('customers').insert({
      name: newCustomer.name, phone: newCustomer.phone, entity_name: dataOwnerName
    });
    if (error) toastError('فشل إضافة العميل');
    else { success('✅ تمت إضافة العميل'); setShowAddCustomer(false); setNewCustomer({ name: '', phone: '' }); loadData(); }
  }

  async function handleAddEmployee(e) {
    e.preventDefault();
    const { error } = await supabase.from('employees').insert({
      full_name: newEmployee.name, phone: newEmployee.phone, role: newEmployee.role, entity_name: dataOwnerName
    });
    if (error) toastError('فشل إضافة الموظف');
    else { success('✅ تمت إضافة الموظف'); setShowAddEmployee(false); setNewEmployee({ name: '', phone: '', role: 'sales' }); }
  }

  const stats = useMemo(() => {
    const done = orders.filter(o => o.status === 'done');
    const newOrders = orders.filter(o => o.status === 'new').length;
    const revenue = done.reduce((s, o) => s + Number(o.total || 0), 0);
    const totalDebts = debts.reduce((s, d) => s + (Number(d.amount || 0) - Number(d.paid || 0)), 0);
    return { revenue, newOrders, pending: orders.filter(o => ['new', 'preparing', 'delivering'].includes(o.status)).length, totalDebts };
  }, [orders, debts]);

  const config = getEntityConfig(sectionType || user?.entity_type || 'merchant');
  const recentOrders = orders.slice(0, 3);
  const activeDebts = debts.filter(d => (Number(d.amount) - Number(d.paid)) > 0);

  if (userLoading || (user && loading)) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16 }}>
        <div style={{ background: '#0f4d3a', borderRadius: 20, padding: 24, marginBottom: 16, height: 140 }} />
        <SkeletonList count={3} />
      </div>
    );
  }
  if (!user) return null;

  const daysLeft = sub?.expires_at ? Math.ceil((new Date(sub.expires_at) - new Date()) / 86400000) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft < 30 && daysLeft > 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f4d3a, #075640)', padding: '24px 20px', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700, marginBottom: 4 }}>
              {isEmployee ? `👤 ${user.full_name}` : isSectionAdmin ? '🏢 مدير قسم' : '👑 مالك'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>{dataOwnerName || user.display_name}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{config.label} · {config.tagline}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => setShowSettings(true)} style={iconBtnStyle} title="إعدادات المتجر">⚙️</button>
            {entityData?.logo_url ? (
              <img src={entityData.logo_url} alt="logo" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
            ) : (
              <div style={{ fontSize: 36 }}>{config.icon}</div>
            )}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 16, padding: 16, backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>إجمالي الإيرادات</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.revenue.toLocaleString()} <span style={{ fontSize: 12, opacity: 0.8 }}>SYP</span></div>
          </div>
          <div style={{ textAlign: 'left' }}>
             <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>إجمالي الديون</div>
             <div style={{ fontSize: 20, fontWeight: 900, color: stats.totalDebts > 0 ? '#fca5a5' : '#6ee7b7' }}>{stats.totalDebts.toLocaleString()} <span style={{ fontSize: 12 }}>SYP</span></div>
          </div>
        </div>
      </div>

      {isExpiringSoon && (
        <div style={{ margin: '16px 16px 0', background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.4)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#92400e' }}>اشتراكك ينتهي بعد {daysLeft} يوم</div>
            <Link href="/merchant/subscription" style={{ fontSize: 11, color: '#92400e', fontWeight: 700 }}>جدد الآن ←</Link>
          </div>
        </div>
      )}

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <Link href="/merchant/orders" style={kpiCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 22 }}>🛍️</div>
            {stats.pending > 0 && <span style={badgeStyle}>{stats.pending} معلق</span>}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{orders.length}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>الطلبات</div>
        </Link>
        <Link href="/merchant/products" style={kpiCardStyle}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>📦</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{products.count}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>المنتجات</div>
        </Link>
        <Link href="/merchant/customers" style={kpiCardStyle}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>👥</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{customers.count}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>العملاء</div>
        </Link>
        <Link href="/merchant/jobs" style={kpiCardStyle}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>💼</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>0</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>الوظائف</div>
        </Link>
        <Link href="/merchant/invoices" style={kpiCardStyle}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>🧾</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>الفواتير</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>إدارة الفواتير</div>
        </Link>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>⚡ إدارة سريعة</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <button onClick={() => setShowAddCustomer(true)} style={actionBtnStyle}>
            <div style={{ fontSize: 22 }}>👤</div>
            <div style={{ fontSize: 10, fontWeight: 800 }}>عميل جديد</div>
          </button>
          <button onClick={() => setShowAddEmployee(true)} style={actionBtnStyle}>
            <div style={{ fontSize: 22 }}>🧑‍💼</div>
            <div style={{ fontSize: 10, fontWeight: 800 }}>موظف جديد</div>
          </button>
          <button onClick={() => setShowDebts(true)} style={actionBtnStyle}>
            <div style={{ fontSize: 22 }}>💰</div>
            <div style={{ fontSize: 10, fontWeight: 800 }}>تذكير الديون</div>
          </button>
          <Link href="/merchant/invoices" style={{ ...actionBtnStyle, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: 22 }}>📄</div>
            <div style={{ fontSize: 10, fontWeight: 800 }}>الفواتير</div>
          </Link>
        </div>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>📂 جميع الأقسام</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {config.quickActions?.map((a) => (
            <Link key={a.href} href={a.href} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>{a.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#334155', lineHeight: 1.2 }}>{a.title}</div>
            </Link>
          ))}
        </div>
      </div>

      {recentOrders.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>🛍️ آخر الطلبات</div>
            <Link href="/merchant/orders" style={{ fontSize: 11, color: '#0f4d3a', fontWeight: 900, textDecoration: 'none' }}>عرض الكل ←</Link>
          </div>
          {recentOrders.map((o) => (
             <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, border: '1px solid #e5e7eb' }}>
               <div>
                 <div style={{ fontSize: 12, fontWeight: 900, fontFamily: 'monospace' }}>#{o.order_code}</div>
                 <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>👤 {o.customer_name}</div>
               </div>
               <div style={{ textAlign: 'left' }}>
                 <div style={{ fontSize: 13, fontWeight: 900, color: '#0f4d3a' }}>{Number(o.total || 0).toLocaleString()}</div>
                 <div style={{ fontSize: 9.5, color: '#f59e0b', fontWeight: 800, marginTop: 2 }}>● {o.status}</div>
               </div>
             </div>
          ))}
        </div>
      )}

      {showSettings && (
        <Modal title="⚙️ إعدادات المتجر" onClose={() => setShowSettings(false)}>
          <form onSubmit={handleSaveSettings}>
            <div style={{ marginBottom: 12, textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: 16, background: '#f1f5f9', margin: '0 auto 8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {settingsForm.logo_url ? <img src={settingsForm.logo_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 40, lineHeight: '80px', textAlign: 'center' }}>🏪</div>}
              </div>
              <label style={{ fontSize: 12, color: '#0ea5e9', fontWeight: 900, cursor: 'pointer' }}>
                {uploadingLogo ? '⏳ جارٍ الرفع...' : '📸 تغيير اللوجو'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploadingLogo} />
              </label>
            </div>
            <Input label="اسم المتجر" value={settingsForm.display_name} onChange={e => setSettingsForm({...settingsForm, display_name: e.target.value})} required />
            <Input label="رقم الهاتف" value={settingsForm.phone} onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})} />
            <Input label="العنوان" value={settingsForm.address} onChange={e => setSettingsForm({...settingsForm, address: e.target.value})} />
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>الوصف</label>
              <textarea value={settingsForm.description} onChange={e => setSettingsForm({...settingsForm, description: e.target.value})} style={{ ...inputStyle, height: 80, resize: 'none' }} />
            </div>
            <button type="submit" style={primaryBtnStyle}>حفظ التغييرات</button>
          </form>
        </Modal>
      )}

      {showAddCustomer && (
        <Modal title="👤 إضافة عميل جديد" onClose={() => setShowAddCustomer(false)}>
          <form onSubmit={handleAddCustomer}>
            <Input label="اسم العميل" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} required />
            <Input label="رقم الهاتف" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} required />
            <button type="submit" style={primaryBtnStyle}>إضافة العميل</button>
          </form>
        </Modal>
      )}

      {showAddEmployee && (
        <Modal title="🧑‍💼 إضافة موظف جديد" onClose={() => setShowAddEmployee(false)}>
          <form onSubmit={handleAddEmployee}>
            <Input label="اسم الموظف" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} required />
            <Input label="رقم الهاتف" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} required />
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>الدور / الصلاحية</label>
              <select value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value})} style={inputStyle}>
                <option value="sales">مبيعات</option>
                <option value="manager">مدير فرع</option>
                <option value="delivery">دليفري</option>
              </select>
            </div>
            <button type="submit" style={primaryBtnStyle}>إضافة الموظف</button>
          </form>
        </Modal>
      )}

      {showDebts && (
        <Modal title="💰 تذكير الديون" onClose={() => setShowDebts(false)}>
          {activeDebts.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>لا توجد ديون مستحقة. 🎉</div>
          ) : (
            activeDebts.map(d => {
              const remain = Number(d.amount) - Number(d.paid);
              const waLink = `https://wa.me/${(d.phone||'').replace(/[^0-9]/g,'')}?text=${encodeURIComponent(`مرحباً ${d.customer_name || 'عزيزي'}،\nنذكرك بدين مستحق لمتجرنا بقيمة ${remain} ل.س.\nشكراً لتعاملك معنا 🙏`)}`;
              return (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', padding: '10px 0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900 }}>{d.customer_name || 'عميل'}</div>
                    <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 800 }}>متبقي: {remain} ل.س</div>
                  </div>
                  <a href={waLink} target="_blank" rel="noreferrer" style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366', padding: '6px 12px', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 900, border: '1px solid rgba(37,211,102,0.3)' }}>💬 تذكير</a>
                </div>
              );
            })
          )}
        </Modal>
      )}

    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} {...props} />
    </div>
  );
}

const iconBtnStyle = { width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const kpiCardStyle = { background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit' };
const actionBtnStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit' };
const badgeStyle = { background: 'rgba(245,158,11,.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#f8fafc' };
const primaryBtnStyle = { width: '100%', padding: 14, background: '#0f4d3a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: 'pointer', marginTop: 8 };
