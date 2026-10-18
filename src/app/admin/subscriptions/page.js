'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const STATUS_CONFIG = {
  active: { label: 'نشط', color: '#10b981', bg: 'rgba(16,185,129,.12)', icon: '✅' },
  trial: { label: 'تجريبي', color: '#3b82f6', bg: 'rgba(59,130,246,.12)', icon: '🎁' },
  expired: { label: 'منتهي', color: '#ef4444', bg: 'rgba(239,68,68,.12)', icon: '❌' },
  cancelled: { label: 'ملغى', color: '#64748b', bg: 'rgba(100,116,139,.12)', icon: '🚫' },
  pending: { label: 'معلق', color: '#f59e0b', bg: 'rgba(245,158,11,.12)', icon: '⏳' },
};

export default function AdminSubscriptions() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [subs, setSubs] = useState([]);
  const [entities, setEntities] = useState({});
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [subsRes, plansRes] = await Promise.all([
        supabase.from('entity_subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('subscription_plans').select('*').order('sort_order'),
      ]);
      setSubs(Array.isArray(subsRes.data) ? subsRes.data : []);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);

      // جلب كل المتاجر
      const { data: entData } = await supabase.from('entities').select('id, display_name, phone, whatsapp, entity_type');
      const map = {};
      (entData || []).forEach(e => { map[e.id] = e; });
      setEntities(map);
    } catch (e) {
      console.error(e);
      toastError('تعذّر التحميل');
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = subs;
    if (filter === 'pending_renewals') {
      list = list.filter(s => s.requested_renewal === true);
    } else if (filter !== 'all') {
      list = list.filter(s => s.status === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s => {
        const ent = entities[s.entity_id];
        return (
          (ent?.display_name || '').toLowerCase().includes(q) ||
          (ent?.phone || '').includes(q) ||
          (s.plan_name || '').toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [subs, filter, search, entities]);

  const stats = useMemo(() => {
    const s = { total: subs.length, active: 0, expired: 0, pending_renewals: 0 };
    subs.forEach(x => {
      if (x.status === 'active') s.active++;
      if (x.status === 'expired') s.expired++;
      if (x.requested_renewal === true) s.pending_renewals++;
    });
    return s;
  }, [subs]);

  async function activate(sub, planId, months = 1) {
    if (!confirm(`تفعيل الاشتراك لمدة ${months} شهر؟`)) return;
    try {
      const plan = plans.find(p => p.id === planId) || plans.find(p => p.id === sub.plan_id) || plans[0];
      if (!plan) { toastError('لا توجد باقة'); return; }

      const now = new Date();
      const expires = new Date(now);
      expires.setMonth(expires.getMonth() + months);

      const { error } = await supabase.from('entity_subscriptions').update({
        status: 'active',
        plan_id: plan.id,
        plan_name: plan.name_en || plan.name,
        plan_price: plan.price,
        plan_period: plan.period || 'monthly',
        started_at: now.toISOString(),
        expires_at: expires.toISOString(),
        requested_renewal: false,
        requested_at: null,
        requested_plan_id: null,
        upgrade_request: null,
        activated_by: 'admin',
        activated_at: now.toISOString(),
      }).eq('id', sub.id);

      if (error) throw error;
      success(`✅ تم التفعيل حتى ${expires.toLocaleDateString('ar-EG')}`);
      load();
    } catch (e) {
      toastError('تعذّر التفعيل: ' + e.message);
    }
  }

  async function cancelSub(sub) {
    if (!confirm('إلغاء الاشتراك؟')) return;
    try {
      const { error } = await supabase.from('entity_subscriptions').update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      }).eq('id', sub.id);
      if (error) throw error;
      success('تم الإلغاء');
      load();
    } catch (e) {
      toastError('تعذّر: ' + e.message);
    }
  }

  function sendWhatsApp(sub, message) {
    const ent = entities[sub.entity_id];
    if (!ent?.phone) { toastError('لا يوجد هاتف'); return; }
    const clean = String(ent.phone).replace(/\D/g, '');
    const phone = clean.startsWith('0') ? '963' + clean.slice(1) : clean;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    success('جارٍ فتح WhatsApp');
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16 }}>
        <SkeletonList count={5} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f4d3a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '50%' }}>→</Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>💎 إدارة الاشتراكات</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{stats.total} اشتراك · {stats.pending_renewals} طلب تجديد</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>{stats.active}</div>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 4 }}>نشط</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#ef4444' }}>{stats.expired}</div>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 4 }}>منتهي</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius: 14, padding: 14, color: '#0f172a', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{stats.pending_renewals}</div>
          <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4 }}>طلب تجديد</div>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <input type="text" placeholder="🔍 ابحث بالمتجر / الهاتف / الباقة..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: '#fff', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { k: 'all', l: 'الكل', n: stats.total },
            { k: 'pending_renewals', l: '⏳ طلبات تجديد', n: stats.pending_renewals },
            { k: 'active', l: 'نشط', n: stats.active },
            { k: 'expired', l: 'منتهي', n: stats.expired },
          ].map((f) => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              padding: '8px 14px', background: filter === f.k ? '#0f4d3a' : '#fff', color: filter === f.k ? '#fff' : '#64748b',
              border: `1px solid ${filter === f.k ? '#0f4d3a' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11.5, fontWeight: 800,
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}>{f.l} ({f.n})</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="💎" title="لا توجد اشتراكات" description="ستظهر الاشتراكات هنا" />
        ) : (
          filtered.map((sub) => {
            const ent = entities[sub.entity_id] || {};
            const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.active;
            const isPending = sub.requested_renewal === true;
            const expiresIn = sub.expires_at ? Math.ceil((new Date(sub.expires_at) - new Date()) / 86400000) : null;

            return (
              <div key={sub.id} style={{ background: '#fff', border: isPending ? '2px solid #fbbf24' : '1px solid #e5e7eb', borderRadius: 16, padding: 14, marginBottom: 10, cursor: 'pointer' }} onClick={() => setSelected(sub)}>
                {isPending && (
                  <div style={{ background: 'rgba(251,191,36,.15)', color: '#92400e', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⏳ <span>طلب تجديد معلّق</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>🏪 {ent.display_name || '—'}</div>
                    <div style={{ fontSize: 11, color: '#64748b', direction: 'ltr', textAlign: 'right' }}>📞 {ent.phone || '—'}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0f4d3a', marginTop: 4 }}>💎 {sub.plan_name || 'Free'}</div>
                  </div>
                  <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 8, fontSize: 10.5, fontWeight: 900, whiteSpace: 'nowrap' }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                  <span>{expiresIn !== null ? (expiresIn > 0 ? `متبقي ${expiresIn} يوم` : `انتهى`) : '—'}</span>
                  <span style={{ direction: 'ltr' }}>{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('ar-EG') : '—'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <SubModal sub={selected} entity={entities[selected.entity_id] || {}} plans={plans} onClose={() => setSelected(null)} onActivate={activate} onCancel={cancelSub} onWhatsApp={sendWhatsApp} />
      )}
    </div>
  );
}

function SubModal({ sub, entity, plans, onClose, onActivate, onCancel, onWhatsApp }) {
  const [planId, setPlanId] = useState(sub.requested_plan_id || sub.plan_id || plans[0]?.id);
  const [months, setMonths] = useState(1);
  const [customMsg, setCustomMsg] = useState('');
  const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.active;

  function sendWA(msg) {
    const defaultMsg = `مرحباً ${entity.display_name || ''}\n\nبخصوص اشتراكك في منصة سند:\n\n${msg}\n\nفريق سند 🌿`;
    onWhatsApp(sub, customMsg || defaultMsg);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto', padding: '24px 20px 30px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: '#cbd5e1', borderRadius: 2, margin: '0 auto 20px' }} />

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{cfg.icon}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{entity.display_name}</div>
          <div style={{ fontSize: 12, color: '#64748b', direction: 'ltr' }}>📞 {entity.phone}</div>
          <div style={{ marginTop: 10 }}>
            <span style={{ background: cfg.bg, color: cfg.color, padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900 }}>{cfg.label}</span>
          </div>
        </div>

        {sub.requested_renewal && (
          <div style={{ background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.4)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#92400e', marginBottom: 6 }}>⏳ طلب تجديد معلّق</div>
            {sub.upgrade_request?.requested_plan && (
              <div style={{ fontSize: 11, color: '#78350f' }}>الباقة المطلوبة: {sub.upgrade_request.requested_plan}</div>
            )}
            {sub.requested_at && (
              <div style={{ fontSize: 11, color: '#78350f', marginTop: 4 }}>التاريخ: {new Date(sub.requested_at).toLocaleString('ar-EG')}</div>
            )}
          </div>
        )}

        <div style={{ background: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>⚙️ تفعيل الاشتراك</div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 6 }}>الباقة</label>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 8, fontFamily: 'inherit', fontSize: 13 }}>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name_en} - ${p.price}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 6 }}>المدة</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 3, 6, 12].map(m => (
                <button key={m} onClick={() => setMonths(m)} style={{
                  flex: 1, padding: 10, background: months === m ? '#0f4d3a' : '#fff',
                  color: months === m ? '#fff' : '#334155', border: `1px solid ${months === m ? '#0f4d3a' : '#e5e7eb'}`,
                  borderRadius: 8, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                }}>{m} شهر</button>
              ))}
            </div>
          </div>

          <button onClick={() => { onActivate(sub, planId, months); onClose(); }}
            style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(16,185,129,.3)' }}>
            ✓ تفعيل لمدة {months} شهر
          </button>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>📱 إرسال واتساب</div>
          <textarea value={customMsg} onChange={(e) => setCustomMsg(e.target.value)}
            placeholder="رسالة اختيارية (اتركها فارغة لاستخدام الافتراضية)" rows={2}
            style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 8, fontFamily: 'inherit', fontSize: 12, boxSizing: 'border-box', resize: 'vertical', marginBottom: 10 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={() => sendWA('تم تفعيل اشتراكك بنجاح ✅')} style={{ padding: 10, background: 'rgba(16,185,129,.15)', color: '#059669', border: '1px solid rgba(16,185,129,.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>✅ تأكيد التفعيل</button>
            <button onClick={() => sendWA('تم إلغاء اشتراكك ❌')} style={{ padding: 10, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>❌ إشعار الإلغاء</button>
          </div>
        </div>

        {sub.status !== 'cancelled' && (
          <button onClick={() => { onCancel(sub); onClose(); }}
            style={{ width: '100%', padding: 12, background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)', borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
            إلغاء الاشتراك
          </button>
        )}

        <button onClick={onClose} style={{ width: '100%', padding: 12, background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>إغلاق</button>
      </div>
    </div>
  );
}
