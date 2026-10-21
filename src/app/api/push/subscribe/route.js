import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_type, user_id, subscription, user_agent } = body;

    if (!user_type || !user_id || !subscription?.endpoint) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const { error } = await supabase.from('push_subscriptions').upsert({
      user_type,
      user_id,
      endpoint: subscription.endpoint,
      subscription,
      user_agent: user_agent || null,
      last_used: new Date().toISOString(),
    }, { onConflict: 'endpoint' });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[push/subscribe]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
