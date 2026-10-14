import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pgjcmzvykolfzgdnzpdy.supabase.co";
const supabaseKey = "https://pgjcmzvykolfzgdnzpdy.supabase.co/rest/v1/";

export const supabase = createClient(supabaseUrl, supabaseKey);
