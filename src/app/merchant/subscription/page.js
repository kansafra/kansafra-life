'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const PLANS = [
  { key: 'free', name: 'مجانية', price: 0, period: 'للأبد', features: ['متجر أساسي', '10 منتجات', 'دعم بالبريد', 'ظهور في البحث'] },
  { key: 'silver', name: 'فضية', price: 5, period: 'شهرياً', features: ['100 منتج', 'تقارير متقدمة', 'دعم بالأولوية', 'دعوات وفاء', 'تحليلات أساسية'], featured: false },
  { key: 'gold', name: 'ذهبية', price: 15, period: 'شهرياً', features: ['منتجات غير محدودة', 'شارة التوثيق', 'إعلانات مجانية', 'تحليلات متقدمة', 'دعم 24/7'], featured: true },
  { key: 'platinum', name: 'بلاتينية', price: 40, period: 'شهرياً', features: ['كل ميزات الذهبية', 'مدير حساب مخصص', 'API خاص', 'White-Label', 'SLA مضمون'] },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const [entity, setEntity] = useState(null);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('sanad_entity') || 'null'); } catch {}
    if (!stored) { router.replace('/login'); return; }
    setEntity(stored);
    load(stored);
  }, [router]);

  async function load(ent) {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('subscriptions').select('*').eq('entity_name', ent.display_name).maybeSingle();
    setCurrent(data);
    setLoading(false);
  }

  async function subscribe(plan) {
    if (!confirm(`الاشتراك في الباقة ${plan.name} بمبلغ ${plan.price}$؟`)) return;
    const payload = {
      entity_name: entity.display_name,
      plan: plan.key,
      status: 'active',
      price: plan.price,
      currency: 'USD',
      features: plan.features,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    if (current) {
      await supabase.from('subscriptions').update(payload).eq('id', current.id);
    } else {
      await supabase.from('subscriptions').insert(payload);
    }
    alert('✅ تم تفعيل الاشتراك');
    load(entity);
  }

  if (!entity) return <div className="sect-empty" style={{ padding: 80 }}><span className="em">⏳</span></div>;

  const currentPlan = current?.plan || 'free';

  return (
    <div className="ent-page">
      <div className="inv-header">
        <Link href="/merchant" className="inv-back">→</Link>
        <span className="inv-title">💳 الاشتراك</span>
      </div>

      {current && (
        <div style={{ padding: '20px 20px 0' }}>
          <div className="debt-stat">
            <div className="debt-stat-val">{current.plan.toUpperCase()}</div>
            <div className="debt-stat-lbl">الباقة الحالية</div>
            {current.expires_at && (
              <div style={{ fontSize: 11, color: 'var(--n-500)', marginTop: 8, fontWeight: 700 }}>
                تنتهي: {new Date(current.expires_at).toLocaleDateString('ar-EG')}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="plan-grid">
        {PLANS.map((p) => (
          <div key={p.key} className={`plan-card-lg ${p.featured ? 'featured' : ''}`}>
            <div className="plan-name-lg">{p.name}</div>
            <div className="plan-price-lg">{p.price === 0 ? 'مجاناً' : `$${p.price}`}</div>
            <div className="plan-period">{p.period}</div>
            <ul className="plan-features">
              {p.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <button
              className="plan-btn"
              onClick={() => subscribe(p)}
              disabled={currentPlan === p.key}
              type="button"
              style={currentPlan === p.key ? { opacity: .5, cursor: 'not-allowed' } : {}}
            >
              {currentPlan === p.key ? '✓ الباقة الحالية' : `اشترك بـ ${p.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
