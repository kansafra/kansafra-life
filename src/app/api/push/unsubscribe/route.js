import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) return Response.json({ error: 'endpoint مطلوب' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
