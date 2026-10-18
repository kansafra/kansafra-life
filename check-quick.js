const fs = require('fs');
const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

const essential = ['entities', 'products', 'services', 'orders', 'reviews'];

(async () => {
  for (const t of essential) {
    const { error } = await sb.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ ${t}: ${error.message}`);
    } else {
      console.log(`✅ ${t}: يعمل`);
    }
  }
  process.exit(0);
})();
