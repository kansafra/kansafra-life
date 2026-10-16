'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { daysRemaining, isExpiringSoon } from '@/lib/subscriptions';
import { sendNotification } from '@/lib/notify';

export default function SubscriptionReminder() {
  useEffect(() => {
    const session = getSession();
    if (!session?.id || !supabase) return;

    let alive = true;

    async function check() {
      try {
        const { data: sub } = await supabase
          .from('entity_subscriptions')
          .select('*')
          .eq('entity_id', session.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!sub || !alive) return;

        // تذكير قبل 7 أيام
        if (isExpiringSoon(sub.expires_at, 7) && !sub.reminder_sent) {
          const days = daysRemaining(sub.expires_at);
          await sendNotification({
            recipient: session.display_name,
            title: '⚠️ اشتراكك على وشك الانتهاء',
            body: `باقي ${days} يوم على انتهاء باقة ${sub.plan_name}. جدد الآن للاستمرار.`,
            type: 'warning',
            targetUrl: '/plans',
          });
          // نعلّم التذكير مرسل
          await supabase
            .from('entity_subscriptions')
            .update({ reminder_sent: true })
            .eq('id', sub.id);
        }

        // تحويل للـ Free بعد الانتهاء
        if (sub.expires_at && new Date(sub.expires_at).getTime() < Date.now() && sub.plan_name !== 'free' && !sub.expired_notified) {
          const { data: freeplan } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('name', 'free')
            .maybeSingle();

          if (freeplan?.id) {
            await supabase.from('entity_subscriptions').update({
              status: 'expired',
              expired_notified: true,
            }).eq('id', sub.id);

            await supabase.from('entity_subscriptions').insert({
              entity_id: session.id,
              plan_id: freeplan.id,
              plan_name: 'free',
              plan_price: 0,
              plan_period: 'monthly',
              status: 'active',
              started_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 100 * 365 * 86400000).toISOString(),
              expired_notified: true,
            });

            await supabase.from('entities').update({
              subscription_plan: 'free',
              subscription_expires: null,
            }).eq('id', session.id);

            await sendNotification({
              recipient: session.display_name,
              title: '📦 تم تحويلك للباقة المجانية',
              body: 'انتهت باقتك المدفوعة، تم تحويلك تلقائياً للباقة المجانية.',
              type: 'info',
              targetUrl: '/plans',
            });
          }
        }
      } catch (e) {
        console.warn('subscription check:', e);
      }
    }

    check();
    const timer = setInterval(check, 60 * 60 * 1000); // كل ساعة
    return () => { alive = false; clearInterval(timer); };
  }, []);

  return null;
}
