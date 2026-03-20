import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ycnbcsxlnjhdnwvmufgj.supabase.co';
const supabaseAnonKey = 'sb_publishable_ht6SFSxZW1HmGWU7q7hrEw_zVGUgV6q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
