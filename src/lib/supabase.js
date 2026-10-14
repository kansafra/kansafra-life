import { createClient } from "@supabase/supabase-js";

// تنظيف القيم من المسافات والأحرف المخفية
const clean = (v) => (v || '').trim().replace(/[\s\u200B-\u200D\uFEFF]/g, '');

const supabaseUrl = clean(
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL_KEY
);

const supabaseKey = clean(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;
