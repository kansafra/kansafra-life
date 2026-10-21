import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:info@sanad.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req) {
  try {
    const { user_type, user_id, title, body, link, icon } = await req.json();

    if (!user_type || !user_id || !title) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_type', user_type)
      .eq('user_id', user_id);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0, message: 'لا اشتراكات' });
    }

    const payload = JSON.stringify({
      title,
      body: body || '',
      link: link || '/',
      icon: icon || '/icons/icon.svg',
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(sub.subscription, payload).catch(async (err) => {
          // إذا كان الاشتراك منتهياً، احذفه
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
          throw err;
        })
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    return NextResponse.json({ sent, total: subs.length });
  } catch (err) {
    console.error('[push/send]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
