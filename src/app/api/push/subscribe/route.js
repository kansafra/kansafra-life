import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const body = await req.json();
    const { subscription, userInfo } = body;

    if (!subscription || !subscription.endpoint) {
      return Response.json({ error: 'اشتراك غير صالح' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

    const { error } = await supabase.from('push_subscriptions').upsert({
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh || '',
      auth: subscription.keys?.auth || '',
      user_type: userInfo.type || 'customer',
      user_id: userInfo.id || null,
      user_phone: userInfo.phone || null,
      user_agent: req.headers.get('user-agent') || null,
    }, { onConflict: 'endpoint' });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
