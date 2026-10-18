import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const body = await req.json();
    const { target_type, target_id, title, message, url, icon } = body;

    if (!title || !message) {
      return Response.json({ error: 'title و message مطلوبان' }, { status: 400 });
    }

    const webpush = (await import('web-push')).default;
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@sanad.app',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

    // فلترة الاشتراكات حسب الهدف
    let query = supabase.from('push_subscriptions').select('*');
    if (target_type === 'user' && target_id) query = query.eq('user_id', target_id);
    else if (target_type === 'phone' && target_id) query = query.eq('user_phone', target_id);
    else if (target_type === 'type' && target_id) query = query.eq('user_type', target_id);

    const { data: subs, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!subs || subs.length === 0) return Response.json({ ok: true, sent: 0 });

    const payload = JSON.stringify({
      title,
      body: message,
      url: url || '/',
      icon: icon || '/icons/icon-192.svg',
      tag: 'sanad-' + Date.now(),
    });

    let sent = 0, failed = 0;
    const toDelete = [];

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (e) {
        failed++;
        if (e.statusCode === 410 || e.statusCode === 404) toDelete.push(sub.id);
      }
    }

    // حذف الاشتراكات المنتهية
    for (const id of toDelete) {
      await supabase.from('push_subscriptions').delete().eq('id', id);
    }

    return Response.json({ ok: true, sent, failed, cleaned: toDelete.length });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
