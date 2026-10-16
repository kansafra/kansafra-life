'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { playSound } from '@/lib/notify';

export default function NotificationListener() {
  const lastIdRef = useRef(null);

  useEffect(() => {
    if (!supabase) return;

    const session = getSession();
    if (!session) return;

    let alive = true;

    // 1) نجيب آخر إشعار موجود
    async function init() {
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('recipient_entity', session.display_name)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.id) lastIdRef.current = data.id;
    }
    init();

    // 2) نستمع للتغييرات
    const channel = supabase
      .channel('notifications-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_entity=eq.${session.display_name}`,
        },
        (payload) => {
          if (!alive) return;
          const n = payload.new;
          if (!n) return;
          if (n.id === lastIdRef.current) return;
          lastIdRef.current = n.id;

          // شغّل الصوت
          playSound();

          // إشعار نظام
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(n.title || 'إشعار جديد', {
                body: n.body || '',
                icon: '/icon-192.svg',
                tag: 'sanad-' + n.id,
                dir: 'rtl',
              });
            } catch {}
          }
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
