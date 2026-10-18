'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';

export default function MerchantSubscription() {
  const router = useRouter();
  const { user, loading: userLoading, dataOwnerName } = useCurrentUser();
  const [sub, setSub] = useState(null);
  const [plan, setPlan] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      // فقط بعد التحميل الكامل
      router.replace('/login');
      return;
    }
    load();
  }, [user, userLoading]);

  async function load() {
    if (!supabase || !user) { setLoading(false); return; }
    try {
      const [subRes, plansRes] = await Promise.all([
        supabase.from('entity_subscriptions').select('*').eq('entity_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
      ]);
      setSub(subRes.data || null);
      setAllPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      if (subRes.data?.plan_id) {
        const p = (plansRes.data || []).find((x) => x.id === subRes.data.plan_id);
        setPlan(p || null);
      }
    } catch (e) {
      console.error('load error:', e);
    }
    setLoading(false);
  }

  async function requestRenewal(targetPlan = null) {
    const confirmed = confirm('سيتم فتح WhatsApp لإرسال طلب التجديد للإدارة. متابعة؟');
    if (!confirmed) return;
    setRequesting(true);
    try {
      // 1) جلب رقم الأدمن
      let adminWa = '963930694339';
      try {
        const { data: setting } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'admin_whatsapp')
          .maybeSingle();
        if (setting?.value) adminWa = String(setting.value).replace(/\D/g, '');
      } catch (e) { console.warn('admin fetch:', e); }

      // 2) مرجع فريد
      const now = new Date();
      const ref = 'SUB-' + now.toISOString().slice(0, 10).replace(/-/g, '') +
                  '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

      // 3) بيانات الباقات
      const currentPlanName = plan?.name_en || plan?.name || 'Free';
      const requestedPlan = targetPlan || plan;
      const requestedPlanName = requestedPlan?.name_en || requestedPlan?.name || currentPlanName;
      const requestedPrice = requestedPlan?.price || 0;

      // 4) التاريخ
      const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      const dateStr = now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

      const expiresStr = sub?.expires_at
        ? new Date(sub.expires_at).getDate() + ' ' + months[new Date(sub.expires_at).getMonth()] + ' ' + new Date(sub.expires_at).getFullYear()
        : '—';
      const daysLeft = sub?.expires_at
        ? Math.ceil((new Date(sub.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      // 5) بناء الرسالة
      const sep = '━━━━━━━━━━━━━━━━━━━━━━━━';
      const lines = [
        sep,
        '🔔 طلب تجديد اشتراك',
        'Subscription Renewal Request',
        sep,
        '',
        '📋 المرجع | Reference',
        ref,
        '',
        '📅 التاريخ | Date',
        dateStr + ' · ' + timeStr,
        '',
        sep,
        '🏪 بيانات المتجر',
        'Business Information',
        sep,
        '',
        'الاسم: ' + (user?.display_name || dataOwnerName || '—'),
        'الهاتف: ' + (user?.phone || '—'),
        '',
        sep,
        '💎 تفاصيل الاشتراك',
        'Subscription Details',
        sep,
        '',
        'الحالي: ' + currentPlanName,
        'المطلوب: ' + requestedPlanName,
        'السعر: $' + requestedPrice + ' / شهر',
        'ينتهي: ' + expiresStr,
        ...(daysLeft !== null ? ['متبقي: ' + daysLeft + ' يوم'] : []),
        '',
        sep,
        '✅ الإجراء المطلوب',
        sep,
        '',
        'تفعيل من لوحة الإدارة:',
        '/admin/subscriptions',
        '',
        sep,
        'منصة سند | Sanad Platform',
        sep,
      ];
      const message = lines.join('\n');

      // 6) حفظ في DB (best effort)
      try {
        await supabase.from('entity_subscriptions').update({
          requested_renewal: true,
          requested_at: now.toISOString(),
          requested_plan_id: requestedPlan?.id || null,
          upgrade_request: {
            reference: ref,
            current_plan: currentPlanName,
            requested_plan: requestedPlanName,
            requested_plan_id: requestedPlan?.id || null,
            requested_at: now.toISOString(),
            requested_by: user?.display_name || null,
          },
        }).eq('entity_id', user.id);
      } catch (e) {
        console.warn('DB save failed (نكمل):', e);
      }

      // 7) فتح WhatsApp
      const waUrl = 'https://wa.me/' + adminWa + '?text=' + encodeURIComponent(message);
      const wa = window.open(waUrl, '_blank');
      if (!wa) {
        alert('⚠️ المتصفح منع فتح النافذة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.');
      }

      // 8) تحديث الحالة
      setSub((prev) => prev ? { ...prev, requested_renewal: true } : prev);

    } catch (err) {
      alert('❌ تعذّر إرسال الطلب: ' + (err.message || 'خطأ غير متوقع'));
    } finally {
      setRequesting(false);
    }
  }

  const daysLeft = sub?.expires_at
    ? Math.ceil((new Date(sub.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysLeft !== null && daysLeft < 30;

  // ═══ تحميل ═══
  if (userLoading || (user && loading)) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0a1f16,#061410)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>جارٍ التحميل...</div>
        </div>
      </div>
    );
  }

  if (!user) return null; // سيتم التوجيه تلقائياً

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0a1f16,#061410)', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10, background: 'rgba(10,31,22,.95)', backdropFilter: 'blur(12px)' }}>
        <button
          onClick={() => router.push('/merchant')}
          style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          →
        </button>
        <span style={{ flex: 1, fontSize: 16, fontWeight: 900, color: '#fff' }}>💎 اشتراكي</span>
      </div>

      <div style={{ padding: 16 }}>
        {/* بانر التنبيه */}
        <div style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0f172a', padding: 14, borderRadius: 12, fontSize: 13, fontWeight: 800, textAlign: 'center', marginBottom: 16 }}>
          ⚠️ تفعيل الاشتراك يتم من قبل الإدارة فقط
        </div>

        {/* زر طلب التجديد */}
        {sub?.requested_renewal ? (
          <div style={{ background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.4)', padding: 14, borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#fbbf24', marginBottom: 16 }}>
            ⏳ طلبك قيد المراجعة من الإدارة
          </div>
        ) : (
          <button
            onClick={() => requestRenewal(plan)}
            disabled={requesting}
            type="button"
            style={{
              width: '100%',
              padding: 14,
              background: 'linear-gradient(135deg,#10b981,#059669)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 900,
              cursor: requesting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              marginBottom: 16,
              boxShadow: '0 4px 14px rgba(16,185,129,.3)',
            }}
          >
            {requesting ? '... جارٍ الإرسال' : '📩 طلب تجديد الاشتراك'}
          </button>
        )}

        {/* الباقة الحالية */}
        <div style={{
          background: plan?.color
            ? `linear-gradient(135deg, ${plan.color}, ${plan.color}99)`
            : 'linear-gradient(135deg, #0f4d3a, #0a6b50)',
          borderRadius: 20,
          padding: 24,
          color: '#fff',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, opacity: .8, fontWeight: 700, marginBottom: 6 }}>
            باقتك الحالية
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 44 }}>{plan?.icon || '💎'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{plan?.name_en || plan?.name || 'Free'}</div>
              {plan?.description && (
                <div style={{ fontSize: 12, opacity: .85, marginTop: 2 }}>{plan.description}</div>
              )}
            </div>
          </div>

          <div style={{ padding: 12, background: 'rgba(0,0,0,.2)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, opacity: .7 }}>الحالة</div>
              <div style={{ fontSize: 14, fontWeight: 900, marginTop: 2 }}>
                {sub?.status === 'active' ? '✅ نشط' :
                 sub?.status === 'trial' ? '🎁 تجريبي' :
                 sub?.status === 'expired' ? '❌ منتهي' : '—'}
              </div>
            </div>
            {daysLeft !== null && daysLeft >= 0 && (
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, opacity: .7 }}>ينتهي بعد</div>
                <div style={{ fontSize: 14, fontWeight: 900, marginTop: 2, color: isExpiringSoon ? '#fbbf24' : '#fff' }}>
                  {daysLeft > 36500 ? '∞ مدى الحياة' : `${daysLeft} يوم`}
                </div>
              </div>
            )}
          </div>

          {isExpiringSoon && daysLeft > 0 && (
            <div style={{ marginTop: 12, padding: 10, background: 'rgba(251,191,36,.2)', borderRadius: 10, fontSize: 11.5, fontWeight: 800 }}>
              ⚠️ اشتراكك على وشك الانتهاء — أرسل طلب تجديد الآن
            </div>
          )}
        </div>

        {/* ميزات الباقة */}
        {plan?.features && Array.isArray(plan.features) && plan.features.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 16, padding: 16, marginBottom: 20, border: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 12 }}>✨ ميزاتك</div>
            {plan.features.map((f, i) => (
              <div key={i} style={{ fontSize: 12.5, color: 'rgba(255,255,255,.75)', padding: '6px 0', display: 'flex', gap: 8 }}>
                <span style={{ color: '#22c55e', fontWeight: 900 }}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        )}

        {/* باقي الباقات */}
        {allPlans.length > 0 && (
          <>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 12 }}>💎 باقي الباقات</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {allPlans.filter((p) => p.id !== plan?.id).map((p) => (
                <div key={p.id} style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${p.color || '#0f4d3a'}40`, borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{p.icon || '💎'}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{p.name_en}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: p.color || '#fbbf24', direction: 'ltr', marginTop: 6 }}>
                    ${p.price}
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,.5)' }}>/شهر</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>
                    {p.max_products} منتج · {p.max_orders} طلب
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
