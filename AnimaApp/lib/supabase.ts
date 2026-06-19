import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Credenciales de Supabase.
 *
 * Se leen de variables de entorno EXPO_PUBLIC_* (inyectadas en build por Expo)
 * para poder rotar credenciales y separar entornos dev/prod sin tocar código.
 * Los valores de respaldo mantienen la app funcionando si aún no existe `.env`.
 *
 * Nota: la anon key es pública por diseño (viaja en cualquier cliente). La
 * seguridad real de los datos depende de las políticas RLS del proyecto.
 */
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://osyfrqqbdhuvbmpobtol.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zeWZycXFiZGh1dmJtcG9idG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDMzMzYsImV4cCI6MjA4ODk3OTMzNn0.B9f275Pt7lREBglZb8giApLBr9Oye937qAi3T0mLVeg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // importante en React Native
  },
});
