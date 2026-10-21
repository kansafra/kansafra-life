import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pgjcmzvykolfzgdnzpdy.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_3tmNgy2itxdei0SPWzcymQ_JgiUrQeI";

export const supabase = createClient(supabaseUrl, supabaseKey);
