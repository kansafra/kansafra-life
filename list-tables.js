const fs = require('fs');
const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

const tables = [
  'entities','service_categories','products','services','orders',
  'customers','reviews','announcements','real_estate','lost_found',
  'expat_services','elderly_requests','auctions','auction_bids',
  'exchange_rates','memory_items','memory_stories','memory_places',
  'library_books','touristic_places','push_subscriptions',
  'admin_accounts','support_tickets','blood_donors','blood_requests',
  'oncall_shifts','transport_vehicles','municipal_services',
  'complaints','municipal_permits','charity_orgs','donations',
  'volunteers','sermons','circles','lessons','students','teachers',
  'classes','grades','appointments','doctor_schedules',
  'medical_records','prescriptions','job_postings','job_seekers',
  'employees','conversations','messages','coupons','debts',
  'payments','invoices','subscription_plans','entity_subscriptions',
  'app_settings','import_logs','audit_logs','communities','geography',
  'currency_rates','azkar','penalties','maintenance_logs',
  'emergency_contacts','customer_addresses','customer_notifications',
  'favorites','plans','payment_methods','documents','sports_matches',
  'sports_players','sports_standings'
];

(async () => {
  const existing = [];
  const missing = [];
  
  for (const t of tables) {
    const { error } = await sb.from(t).select('*', { count: 'exact', head: true });
    if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
      missing.push(t);
    } else {
      existing.push(t);
    }
  }
  
  console.log('✅ موجود:', existing.length);
  console.log('❌ غير موجود:', missing.length);
  console.log('');
  console.log('قائمة غير موجود:');
  missing.forEach(t => console.log('  -', t));
  
  process.exit(0);
})();
