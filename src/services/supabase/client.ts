import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ycnbcsxlnjhdnwvmufgj.supabase.co';
const supabaseAnonKey = 'sb_publishable_ht6SFSxZW1HmGWU7q7hrEw_zVGUgV6q';

// Cliente externo com persistência de sessão própria (storageKey separado
// para não colidir com o cliente do Lovable Cloud).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'sb-external-auth',
    persistSession: true,
    autoRefreshToken: true,
  },
});
