'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SubscriptionPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) { setLoading(false); return; }
    const [p, s] = await Promise.all([
      supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('subscriptions').select('*').eq('entity_name', ent.display_name).maybeSingle(),
    ]);
    setPlans(Array.isArray(p.data) ? p.data : []);
    setCurrent(s.data || null);
    setLoading(false);
  }

  async function subscribe(plan) {
    if (!confirm(`الاشتراك في الباقة "${plan.name}" بمبلغ $${plan.price}؟`)) return;
    setProcessing(plan.id);
    const now = new Date();
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);

    const payload = {
      entity_name: entity.display_name,
      plan: plan.name,
      status: 'active',
      price: plan.price,
      currency: plan.currency,
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
      features: plan.features,
    };

    let err;
    if (current) {
      ({ error: err } = await supabase.from('subscriptions').update(payload).eq('id', current.id));
    } else {
      ({ error: err } = await supabase.from('subscriptions').insert(payload));
    }
    setProcessing(null);
    if (err) { alert('تعذّر التفعيل: ' + err.message); return; }
    alert('✅ تم تفعيل الباقة');
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  return (
    <div className="sect-page" style={{ paddingBottom: 40 }}>
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">💳 الاشتراك</span>
      </div>

      {current && (
        <div style={{ padding: '20px 20px 0' }}>
          <div className="debt-stat">
            <div className="debt-stat-val" style={{ fontSize: 20 }}>{current.plan}</div>
            <div className="debt-stat-lbl">الباقة الحالية</div>
            {current.expires_at && (
              <div style={{ fontSize: 11, color: 'var(--n-500)', marginTop: 8, fontWeight: 700 }}>
                تنتهي: {new Date(current.expires_at).toLocaleDateString('ar-EG')}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: '20px 20px 0', fontSize: 13, color: 'var(--n-600)', fontWeight: 700 }}>
        اختر الباقة المناسبة لاحتياجك:
      </div>

      <div className="plan-grid">
        {loading ? (
          <div className="sect-empty"><span className="em">⏳</span></div>
        ) : plans.length === 0 ? (
          <div className="sect-empty"><span className="em">💳</span><p>لا توجد باقات متاحة</p></div>
        ) : (
          plans.map((p) => {
            const isCurrent = current?.plan === p.name;
            return (
              <div key={p.id} className={`plan-card-lg ${p.is_featured ? 'featured' : ''}`}>
                <div className="plan-name-lg">{p.name}</div>
                {p.name_en && <div style={{ fontSize: 11, color: 'var(--n-400)', fontWeight: 600 }}>{p.name_en}</div>}
                <div className="plan-price-lg">
                  {p.price === 0 ? 'مجاناً' : `$${p.price}`}
                </div>
                <div className="plan-period">{p.period === 'monthly' ? 'شهرياً' : p.period}</div>
                {Array.isArray(p.features) && (
                  <ul className="plan-features">
                    {p.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                )}
                <button
                  className="plan-btn"
                  onClick={() => subscribe(p)}
                  disabled={isCurrent || processing === p.id}
                  type="button"
                  style={isCurrent ? { opacity: .5, cursor: 'not-allowed' } : {}}
                >
                  {processing === p.id ? '... جارٍ' : isCurrent ? '✓ الباقة الحالية' : `اشترك بـ ${p.name}`}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
