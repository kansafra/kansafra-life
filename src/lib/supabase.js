import { createClient } from '@supabase/supabase-js';

// قراءة المتغيرات من بيئة Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// التحقق من وجود المتغيرات لتجنب الخطأ
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key. Please check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
