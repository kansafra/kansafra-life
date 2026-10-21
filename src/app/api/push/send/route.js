import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:info@sanad.app';

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });
    }
    if (!vapidPublic || !vapidPrivate) {
      return NextResponse.json({ error: 'VAPID config missing' }, { status: 500 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const webpushModule = await import('web-push');
    const webpush = webpushModule.default || webpushModule;

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const body_data = await req.json();
    const { user_type, user_id, title, body, link, icon } = body_data;

    if (!user_type || !user_id || !title) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_type', user_type)
      .eq('user_id', user_id);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const payload = JSON.stringify({
      title,
      body: body || '',
      link: link || '/',
      icon: icon || '/icons/icon.svg',
    });

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(sub.subscription, payload).catch(async err => {
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
