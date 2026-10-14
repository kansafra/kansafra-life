import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pgjcmzvykolfzgdnzpdy.supabase.co";
const supabaseKey = "sb_publishable_3tmNgy2itxdei0SPWzcymQ_JgiUrQeI";

export const supabase = createClient(supabaseUrl, supabaseKey);
