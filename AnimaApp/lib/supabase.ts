import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://osyfrqqbdhuvbmpobtol.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zeWZycXFiZGh1dmJtcG9idG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDMzMzYsImV4cCI6MjA4ODk3OTMzNn0.B9f275Pt7lREBglZb8giApLBr9Oye937qAi3T0mLVeg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // importante en React Native
  },
});