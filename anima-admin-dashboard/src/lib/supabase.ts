import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export function clearAdminAuthState() {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem('anima-admin-auth-token');
  window.localStorage.removeItem('sb-osyfrqqbdhuvbmpobtol-auth-token');
  document.cookie = 'anima_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'anima-admin-auth-token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
