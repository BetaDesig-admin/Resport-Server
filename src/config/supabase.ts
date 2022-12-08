
import * as supebase from "@supabase/supabase-js";
import * as dot from 'dotenv'

dot.config();
export const supabaseClient = supebase.createClient(process.env.SUPABASE_SERVER_URL!, process.env.SUPABASE_SERVER_KEY!, {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
});


export const supbaseName = process.env.SUPABASE_NAME || "";