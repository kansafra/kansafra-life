// ═══════════════════════════════════════════════
// نظام الاشتراكات — سند
// ═══════════════════════════════════════════════
import { supabase } from './supabase';

function computeExpiry(period = 'monthly', from = new Date()) {
  const d = new Date(from);
  if (period === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export async function subscribeEntity({ entityId, planId, period = 'monthly', paymentMethod = 'cash' }) {
  if (!supabase) throw new Error('قاعدة البيانات غير متصلة');
  if (!entityId || !planId) throw new Error('معاملات ناقصة');

  const { data: plan, error: planErr } = await supabase
    .from('subscription_plans').select('*').eq('id', planId).single();
  if (planErr || !plan) throw new Error('الباقة غير موجودة');

  await supabase
    .from('entity_subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('entity_id', entityId)
    .eq('status', 'active');

  const startedAt = new Date().toISOString();
  const expiresAt = computeExpiry(period);
  const price = period === 'yearly' && plan.price_yearly > 0
    ? Number(plan.price_yearly)
    : Number(plan.price || 0);

  const { data: newSub, error: subErr } = await supabase
    .from('entity_subscriptions')
    .insert({
      entity_id: entityId,
      plan_id: planId,
      plan_name: plan.name,
      plan_price: price,
      plan_period: period,
      status: 'active',
      started_at: startedAt,
      expires_at: expiresAt,
      auto_renew: false,
      payment_method: paymentMethod,
      amount_paid: price,
      currency: plan.currency || 'USD',
      reminder_sent: false,
      expired_notified: false,
    })
    .select('*').single();

  if (subErr) throw subErr;

  await supabase.from('entities').update({
    subscription_plan: plan.name,
    subscription_expires: expiresAt,
  }).eq('id', entityId);

  return newSub;
}

export async function getCurrentSubscription(entityId) {
  if (!supabase || !entityId) return null;
  const { data } = await supabase
    .from('entity_subscriptions')
    .select('*')
    .eq('entity_id', entityId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export function daysRemaining(expiresAt) {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
}

export function isExpiringSoon(expiresAt, threshold = 7) {
  const days = daysRemaining(expiresAt);
  return days !== null && days >= 0 && days <= threshold;
}

export function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}
