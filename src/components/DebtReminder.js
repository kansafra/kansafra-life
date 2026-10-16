'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function DebtReminder() {
  const busy = useRef(false);

  useEffect(() => {
    if (busy.current) return;
    busy.current = true;

    const timer = setTimeout(check, 5000);
    const interval = setInterval(check, 24 * 60 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      busy.current = false;
    };
  }, []);

  async function check() {
    try {
      const s = getSession();
      if (!s?.display_name || !supabase) return;

      // 1) الإعدادات
      const { data: settings } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['debt_reminder_enabled', 'debt_reminder_days']);
      const cfg = {};
      (settings || []).forEach((x) => { cfg[x.key] = x.value; });

      if (cfg.debt_reminder_enabled === 'false') return;

      const daysBefore = parseInt(cfg.debt_reminder_days) || 3;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threshold = new Date(today);
      threshold.setDate(threshold.getDate() + daysBefore);

      // 2) الديون المستحقة
      const { data: debts } = await supabase
        .from('debts')
        .select('*')
        .eq('entity_name', s.display_name)
        .eq('reminder_enabled', true)
        .not('due_date', 'is', null);

      if (!Array.isArray(debts)) return;

      const toRemind = debts.filter((d) => {
        if (Number(d.paid || 0) >= Number(d.amount)) return false;
        const due = new Date(d.due_date);
        due.setHours(0, 0, 0, 0);
        if (due > threshold) return false;

        // ما نكرر نفس اليوم
        if (d.last_reminder_at) {
          const last = new Date(d.last_reminder_at);
          last.setHours(0, 0, 0, 0);
          if (last.getTime() === today.getTime()) return false;
        }
        return true;
      });

      // 3) إشعار للتاجر
      for (const d of toRemind) {
        const remaining = Number(d.amount) - Number(d.paid || 0);
        const isOverdue = new Date(d.due_date) < today;
        try {
          await supabase.from('notifications').insert({
            recipient_entity: s.display_name,
            title: isOverdue ? '⚠️ دين متأخر' : '🔔 دين قريب الاستحقاق',
            body: `${d.customer_name} — المتبقي: ${remaining.toLocaleString()} ${d.currency}`,
            type: isOverdue ? 'error' : 'warning',
            target_url: '/merchant/debts',
          });
        } catch (e) {}
      }
    } catch (e) {
      console.warn('debt reminder check:', e);
    }
  }

  return null;
}
