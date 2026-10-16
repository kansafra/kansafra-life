'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { subscribeEntity, getCurrentSubscription } from '@/lib/subscriptions';

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [currentSub, setCurrentSub] = useState(null);
  const [subscribing, setSubscribing] = useState(null);
  const [message, setMessage] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    load(s);
  }, []);

  async function load(s) {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    setPlans(Array.isArray(data) ? data : []);

    if (s?.id) {
      const sub = await getCurrentSubscription(s.id);
      setCurrentSub(sub);
    }
    setLoading(false);
  }

  async function handleSubscribe(plan) {
    if (!session) {
      router.push('/login');
      return;
    }
    setSubscribing(plan.id);
    setMessage(null);
    try {
      await subscribeEntity({
        entityId: session.id,
        planId: plan.id,
        period,
        paymentMethod: 'cash',
      });
      setMessage({
        type: 'success',
        text: `🎉 تم تفعيل باقة "${plan.name_en || plan.name}" بنجاح!`,
      });
      const sub = await getCurrentSubscription(session.id);
      setCurrentSub(sub);
      setTimeout(() => router.push('/merchant'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: 'تعذّر: ' + (err.message || 'خطأ') });
    } finally {
      setSubscribing(null);
    }
  }

  return (
    <div className="sect-page" style={{ paddingBottom: 100, minHeight: '100vh', background: 'linear-gradient(180deg, #0a1f16 0%, #061410 100%)' }}>
      <div className="inv-header" style={{ background: 'transparent', border: 'none' }}>
        <button className="inv-back" onClick={() => router.back()} type="button" style={{ color: '#fff', background: 'rgba(255,255,255,.1)' }}>→</button>
        <span className="inv-title" style={{ color: '#fff' }}>💎 الباقات</span>
        <span style={{ width: 40 }} />
      </div>

      <div style={{ textAlign: 'center', padding: '20px 24px 32px' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>💎</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 10 }}>
          اختر باقتك
        </h1>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto' }}>
          ابدأ مجاناً، وارتقِ عندما ينمو نشاطك.
        </p>
      </div>

      {/* الباقة الحالية */}
      {currentSub && (
        <div style={{
          margin: '0 16px 20px',
          padding: 16,
          background: 'rgba(34,197,94,.1)',
          border: '1px solid rgba(34,197,94,.3)',
          borderRadius: 16,
        }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginBottom: 4 }}>باقتك الحالية</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>
            ✅ {currentSub.plan_name?.toUpperCase()}
          </div>
          {currentSub.expires_at && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>
              تنتهي في {new Date(currentSub.expires_at).toLocaleDateString('ar-EG')}
            </div>
          )}
        </div>
      )}

      {message && (
        <div style={{
          margin: '0 16px 16px',
          padding: 12,
          background: message.type === 'success' ? 'rgba(34,197,94,.15)' : 'rgba(220,38,38,.15)',
          border: message.type === 'success' ? '1px solid rgba(34,197,94,.3)' : '1px solid rgba(220,38,38,.3)',
          borderRadius: 12,
          color: message.type === 'success' ? '#4ade80' : '#f87171',
          fontSize: 13,
          textAlign: 'center',
        }}>
          {message.text}
        </div>
      )}

      {/* مفتاح شهري/سنوي */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 16px 24px' }}>
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,.05)', borderRadius: 999, padding: 4 }}>
          <button
            onClick={() => setPeriod('monthly')}
            type="button"
            style={{
              padding: '8px 20px', borderRadius: 999, border: 'none',
              background: period === 'monthly' ? '#22c55e' : 'transparent',
              color: period === 'monthly' ? '#fff' : 'rgba(255,255,255,.6)',
              fontWeight: 900, fontSize: 12.5, cursor: 'pointer',
            }}
          >
            شهري
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            type="button"
            style={{
              padding: '8px 20px', borderRadius: 999, border: 'none',
              background: period === 'yearly' ? '#22c55e' : 'transparent',
              color: period === 'yearly' ? '#fff' : 'rgba(255,255,255,.6)',
              fontWeight: 900, fontSize: 12.5, cursor: 'pointer',
            }}
          >
            سنوي <span style={{ fontSize: 10 }}>-20%</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="sect-empty" style={{ color: '#fff' }}><span className="em">⏳</span></div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {plans.map((p) => {
            const displayPrice = period === 'yearly' && p.price_yearly > 0
              ? (p.price_yearly / 12).toFixed(1)
              : p.price;
            const features = Array.isArray(p.features) ? p.features : [];
            const isCurrent = currentSub?.plan_id === p.id;
            const isFree = Number(p.price) === 0;

            return (
              <div
                key={p.id}
                style={{
                  background: p.is_featured
                    ? `linear-gradient(135deg, ${p.color}44, ${p.color}22)`
                    : 'rgba(255,255,255,.03)',
                  border: isCurrent
                    ? '2px solid #22c55e'
                    : p.is_featured
                      ? `2px solid ${p.color}`
                      : '1px solid rgba(255,255,255,.1)',
                  borderRadius: 20,
                  padding: 24,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isCurrent && (
                  <div style={{
                    position: 'absolute', top: 16, left: 16,
                    background: '#22c55e', color: '#fff',
                    fontSize: 10, fontWeight: 900,
                    padding: '4px 10px', borderRadius: 999,
                  }}>
                    ✓ باقتك الحالية
                  </div>
                )}
                {p.is_featured && !isCurrent && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    background: '#fbbf24', color: '#000',
                    fontSize: 10, fontWeight: 900,
                    padding: '4px 10px', borderRadius: 999,
                  }}>
                    ⭐ مميزة
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 8 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: p.color + '33',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26,
                  }}>
                    {p.icon || '💎'}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>
                      {p.name_en || p.name}
                    </div>
                    {p.description && (
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
                        {p.description}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', direction: 'ltr' }}>
                    ${displayPrice}
                  </span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginInlineStart: 6 }}>
                    /شهر
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: 'rgba(255,255,255,.85)' }}>
                      <span style={{ color: '#22c55e', fontWeight: 900 }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(p)}
                  disabled={isCurrent || subscribing === p.id}
                  type="button"
                  style={{
                    width: '100%',
                    padding: 14,
                    background: isCurrent
                      ? 'rgba(34,197,94,.3)'
                      : subscribing === p.id
                        ? '#555'
                        : p.is_featured ? p.color : 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: isCurrent || subscribing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isCurrent
                    ? '✓ باقتك الحالية'
                    : subscribing === p.id
                      ? '... جارٍ التفعيل'
                      : isFree
                        ? '🚀 ابدأ مجاناً'
                        : '✨ اشترك الآن'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '40px 24px', fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.7 }}>
        💳 نقبل: شام كاش، تحويل بنكي، نقداً<br />
        📞 للاستفسار: +963 930 694 339
      </div>
    </div>
  );
}
