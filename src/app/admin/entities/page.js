'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { sendNotification } from '@/lib/notify';

const TYPE_LABELS = {
  merchant:'🏪 متجر', doctor:'👨‍⚕️ طبيب', pharmacy:'💊 صيدلية',
  school:'🏫 مدرسة', mosque:'🕌 جامع', municipality:'🏢 بلدية',
  council:'🏛️ مجلس', charity:'🤝 جمعية', sports:'⚽ نادي',
  memory:'📸 ذاكرة', office:'📁 مكتب', restaurant:'🍽️ مطعم',
  transport:'🚗 مواصلات',
};

export default function AdminEntities() {
  const router = useRouter();
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_admin') || 'null'); } catch {}
    if (!stored) { router.replace('/admin/login'); return; }
    load();
  }, [router]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('entities').select('*').order('created_at', { ascending: false });
    setEntities(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function approveEntity(ent) {
    const planChoice = prompt(
      'اختر الباقة لـ "' + ent.display_name + '":\n\n' +
      '1 = free (مجاني)\n' +
      '2 = silver ($5/شهر)\n' +
      '3 = gold ($15/شهر)\n' +
      '4 = platinum ($40/شهر)\n\n' +
      'اكتب الرقم:',
      '1'
    );
    
    const planMap = { '1': 'free', '2': 'silver', '3': 'gold', '4': 'platinum' };
    const planName = planMap[planChoice] || 'free';

    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('id, price')
      .eq('name', planName)
      .maybeSingle();

    const { error } = await supabase
      .from('entities')
      .update({
        is_active: true,
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', ent.id);

    if (error) { alert('تعذّر: ' + error.message); return; }

    if (plan?.id) {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await supabase.from('entity_subscriptions').insert({
        entity_id: ent.id,
        plan_id: plan.id,
        plan_name: planName,
        plan_price: plan.price || 0,
        plan_period: 'monthly',
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        reminder_sent: false,
        expired_notified: false,
      });

      await supabase.from('entities').update({
        subscription_plan: planName,
        subscription_expires: expiresAt.toISOString(),
      }).eq('id', ent.id);

      await sendNotification({
        recipient: ent.display_name,
        title: '🎉 تم تفعيل حسابك',
        body: 'حسابك معتمد! باقتك: ' + planName.toUpperCase() + ' — تنتهي يوجد ' + expiresAt.toLocaleDateString('ar-EG'),
        type: 'success',
        targetUrl: '/login',
      });
    }

    setEntities((arr) => arr.map((e) => e.id === ent.id 
      ? Object.assign({}, e, { is_active: true, approval_status: 'approved', subscription_plan: planName })
      : e));
  }

  async function rejectEntity(ent) {
    const reason = prompt('سبب الرفض (اختياري):');
    const { error } = await supabase
      .from('entities')
      .update({
        is_active: false,
        approval_status: 'rejected',
        rejection_reason: reason || null,
      })
      .eq('id', ent.id);
    if (!error) {
      setEntities((arr) => arr.map((e) => e.id === ent.id 
        ? Object.assign({}, e, { is_active: false, approval_status: 'rejected' })
        : e));
    }
  }

  async function toggleActive(ent) {
    const { error } = await supabase.from('entities').update({ is_active: !ent.is_active }).eq('id', ent.id);
    if (!error) setEntities((arr) => arr.map((e) => e.id === ent.id ? { ...e, is_active: !e.is_active } : e));
  }

  async function del(ent) {
    if (!confirm(`حذف "${ent.display_name}" نهائياً؟`)) return;
    const { error } = await supabase.from('entities').delete().eq('id', ent.id);
    if (!error) setEntities((arr) => arr.filter((e) => e.id !== ent.id));
  }

  const types = ['all', ...new Set(entities.map((e) => e.entity_type))];

  const filtered = entities.filter((e) => {
    if (filter === 'pending') return e.approval_status === 'pending';
    if (filter === 'approved') return e.approval_status === 'approved' || !e.approval_status;
    if (filter !== 'all' && filter !== 'approved' && filter !== 'pending' && e.entity_type !== filter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (e.display_name || '').toLowerCase().includes(q)
        || (e.username || '').toLowerCase().includes(q)
        || (e.phone || '').toLowerCase().includes(q);
  });

  return (
    <div className="admin-page">
      <div className="admin-sub-header">
        <Link href="/admin" className="admin-sub-back">→</Link>
        <span className="admin-sub-title">إدارة الكيانات</span>
        <span className="admin-sub-count">{entities.length}</span>
      </div>

      <div className="admin-search">
        <input type="text" placeholder="ابحث بالاسم أو المستخدم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="admin-filters">
        {entities.filter((e) => e.approval_status === 'pending').length > 0 && (
          <button className={`admin-filter ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')} type="button" style={{ background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.4)' }}>
            ⏳ قيد المراجعة ({entities.filter((e) => e.approval_status === 'pending').length})
          </button>
        )}
        <button className={`admin-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} type="button">
          الكل ({entities.length})
        </button>
        {types.filter((t) => t !== 'all').map((t) => (
          <button key={t} className={`admin-filter ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)} type="button">
            {TYPE_LABELS[t] || t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span><p>جارٍ التحميل...</p></div>
      ) : filtered.length === 0 ? (
        <div className="sect-empty"><span className="em">🏢</span><p>لا توجد نتائج</p></div>
      ) : (
        <div className="admin-items">
          {filtered.map((e) => (
            <div key={e.id} className="admin-item">
              <div className="admin-item-icon">{TYPE_LABELS[e.entity_type]?.split(' ')[0] || '🏢'}</div>
              <div className="admin-item-body">
                <div className="admin-item-title">{e.display_name}</div>
                <div className="admin-item-meta">
                  <span>@{e.username}</span>
                  {e.phone && <span>{e.phone}</span>}
                  <span className={`admin-badge ${e.is_active ? 'active' : 'danger'}`}>
                    {e.is_active ? 'نشط' : 'موقوف'}
                  </span>
                </div>
              </div>
              <div className="admin-item-actions">
                <button className="admin-act-btn ok" onClick={() => toggleActive(e)} type="button" title={e.is_active ? 'إيقاف' : 'تفعيل'}>
                  {e.is_active ? '⏸' : '▶'}
                </button>
                <button className="admin-act-btn del" onClick={() => del(e)} type="button" title="حذف">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
