'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function MerchantSubscription() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [sub, setSub] = useState(null);
  const [plan, setPlan] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stored = null;
    try { stored = getSession(); } catch (e) {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) { setLoading(false); return; }
    const [subRes, plansRes] = await Promise.all([
      supabase.from('entity_subscriptions')
        .select('*')
        .eq('entity_id', ent.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order'),
    ]);
    setSub(subRes.data || null);
    setAllPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
    if (subRes.data?.plan_id) {
      const p = (plansRes.data || []).find((x) => x.id === subRes.data.plan_id);
      setPlan(p || null);
    }
    setLoading(false);
  }

  const daysLeft = sub?.expires_at
    ? Math.ceil((new Date(sub.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpiringSoon = daysLeft !== null && daysLeft < 30;

  return (
    <div className="sect-page" style={{ paddingBottom: 100 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">💎 اشتراكي</span>
        <span style={{ width: 40 }} />
      </div>

      {loading ? (
        <div className="sect-empty"><span className="em">⏳</span></div>
      ) : (
        <div style={{ padding: 16 }}>
          {/* الباقة الحالية */}
          <div style={{
            background: plan
              ? `linear-gradient(135deg, ${plan.color}, ${plan.color}99)`
              : 'linear-gradient(135deg, #0f4d3a, #0a6b50)',
            borderRadius: 20,
            padding: 24,
            color: '#fff',
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: 11, opacity: .8, fontWeight: 700, marginBottom: 6 }}>
              باقتك الحالية
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 44 }}>{plan?.icon || '💎'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{plan?.name_en || 'Free'}</div>
                {plan?.description && (
                  <div style={{ fontSize: 12, opacity: .85, marginTop: 2 }}>{plan.description}</div>
                )}
              </div>
            </div>

            {/* حالة الاشتراك */}
            <div style={{
              padding: 12, background: 'rgba(0,0,0,.2)', borderRadius: 12,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
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
                  <div style={{
                    fontSize: 14, fontWeight: 900, marginTop: 2,
                    color: isExpiringSoon ? '#fbbf24' : '#fff',
                  }}>
                    {daysLeft > 36500 ? '∞ مدى الحياة' : `${daysLeft} يوم`}
                  </div>
                </div>
              )}
            </div>

            {isExpiringSoon && daysLeft > 0 && (
              <div style={{
                marginTop: 12, padding: 10,
                background: 'rgba(251,191,36,.2)',
                borderRadius: 10, fontSize: 11.5, fontWeight: 800,
              }}>
                ⚠️ اشتراكك على وشك الانتهاء — جدد الآن
              </div>
            )}
          </div>

          {/* ميزات باقتك */}
          {plan?.features && Array.isArray(plan.features) && plan.features.length > 0 && (
            <div className="debt-card" style={{ borderRightColor: plan.color || '#0f4d3a', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>✨ ميزاتك</div>
              {plan.features.map((f, i) => (
                <div key={i} style={{ fontSize: 12.5, color: 'var(--n-300)', padding: '6px 0', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#22c55e', fontWeight: 900 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* زر الترقية */}
          <Link
            href="/plans"
            style={{
              display: 'block',
              padding: 16,
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#000',
              borderRadius: 14,
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 900,
              textDecoration: 'none',
              marginBottom: 20,
            }}
          >
            ⬆️ ترقية الباقة
          </Link>

          {/* باقي الباقات */}
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>💎 باقي الباقات</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {allPlans.filter((p) => p.id !== plan?.id).map((p) => (
              <div key={p.id} className="debt-card" style={{ borderRightColor: p.color, margin: 0, padding: 14 }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{p.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{p.name_en}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: p.color, direction: 'ltr', marginTop: 6 }}>
                  ${p.price}
                  <span style={{ fontSize: 10, color: 'var(--n-500)' }}>/شهر</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--n-500)', marginTop: 4 }}>
                  {p.max_products} منتج · {p.max_orders} طلب
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
