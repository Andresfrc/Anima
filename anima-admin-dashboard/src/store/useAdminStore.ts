import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// ---- Types ----
export interface AdminProfile {
  id: string;
  email: string;
  username?: string;
  role?: string;
}

export interface AnalyticsData {
  weeklyMood: { name: string; muyTriste: number; triste: number; neutral: number; mejor: number; animado: number }[];
  activeRoutes: { name: string; value: number; color: string }[];
  overviewStats: {
    totalUsers: string;
    moodLogs: string;
    activitiesCount: string;
    pendingAdmins: number;
  };
}

export interface ActivityDefinition {
  id: string;
  title: string;
  route: string;
  duration: string;
  description: string;
  icon: string;
  color: string;
}

export interface AppSetting {
  key: string;
  value: Record<string, unknown>;
}

export interface AdminStore {
  // Admin profile
  adminProfile: AdminProfile | null;
  fetchAdminProfile: () => Promise<void>;
  clearProfile: () => void;

  // Analytics
  analytics: AnalyticsData | null;
  isLoadingAnalytics: boolean;
  fetchAnalytics: () => Promise<void>;

  // CMS
  activities: ActivityDefinition[];
  isLoadingActivities: boolean;
  fetchActivities: () => Promise<void>;
  addActivity: (activity: Omit<ActivityDefinition, 'id'>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  updateActivity: (id: string, updated: Partial<ActivityDefinition>) => Promise<void>;

  // App Settings
  appSettings: AppSetting[];
  isLoadingSettings: boolean;
  fetchAppSettings: () => Promise<void>;
  updateAppSetting: (key: string, value: Record<string, unknown>) => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({

  // ── Admin Profile ─────────────────────────────────────────────────────────
  adminProfile: null,
  fetchAdminProfile: async () => {
    console.log('[ADMIN] Cargando perfil...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { console.warn('[ADMIN] No hay usuario autenticado'); return; }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar')
      .eq('id', user.id)
      .single();

    if (error) console.error('[ADMIN] Error cargando perfil:', error.message);
    else console.log('[ADMIN] Perfil cargado:', data);

    set({
      adminProfile: {
        id:       user.id,
        email:    user.email ?? '',
        username: data?.username ?? undefined,
        role:     'admin',
      }
    });
  },
  clearProfile: () => { console.log('[ADMIN] Perfil limpiado'); set({ adminProfile: null }); },

  // ── Analytics ─────────────────────────────────────────────────────────────
  analytics: null,
  isLoadingAnalytics: false,
  fetchAnalytics: async () => {
    console.log('[ANALYTICS] Iniciando fetch de analytics...');
    set({ isLoadingAnalytics: true });

    try {
      const [
        { count: totalUsers },
        { count: moodLogsCount },
        { count: activitiesCount },
        { data: moodData, error: moodError },
        { data: routeData, error: routeError },
        { count: pendingAdmins },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('mood_logs').select('*', { count: 'exact', head: true }),
        supabase.from('activities').select('*', { count: 'exact', head: true }),
        supabase.from('mood_logs')
          .select('mood, created_at')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true }),
        supabase.from('user_progress').select('current_plan'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'pending'),
      ]);

      console.log('[ANALYTICS] totalUsers:', totalUsers, '| moodLogs:', moodLogsCount, '| activities:', activitiesCount, '| pending:', pendingAdmins);
      if (moodError) console.error('[ANALYTICS] Error mood_logs:', moodError.message);
      if (routeError) console.error('[ANALYTICS] Error user_progress:', routeError.message);

      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { name: dayNames[d.getDay()], dateStr: d.toISOString().split('T')[0], muyTriste: 0, triste: 0, neutral: 0, mejor: 0, animado: 0 };
      });

      (moodData ?? []).forEach((log) => {
        const dayStr = log.created_at?.substring(0, 10);
        const dayEntry = last7Days.find(d => d.dateStr === dayStr);
        if (dayEntry) {
          const key = log.mood as keyof typeof dayEntry;
          if (key in dayEntry) (dayEntry[key] as number)++;
        }
      });

      const ROUTE_COLORS: Record<string, string> = {
        renacer: '#4ADE80', autocompasion: '#F472B6', balance: '#60A5FA',
        descubrimiento: '#FBBF24', soledad: '#A78BFA', ansiedad: '#F87171', inseguridad: '#34D399',
      };

      const routeCounts: Record<string, number> = {};
      (routeData ?? []).forEach((row) => {
        if (row.current_plan) routeCounts[row.current_plan] = (routeCounts[row.current_plan] || 0) + 1;
      });

      const activeRoutes = Object.entries(routeCounts).map(([plan, value]) => ({
        name: plan.charAt(0).toUpperCase() + plan.slice(1),
        value,
        color: ROUTE_COLORS[plan] || '#94A3B8',
      }));

      console.log('[ANALYTICS] weeklyMood procesado:', last7Days);
      console.log('[ANALYTICS] activeRoutes procesado:', activeRoutes);

      set({
        analytics: {
          weeklyMood: last7Days,
          activeRoutes,
          overviewStats: {
            totalUsers:      (totalUsers ?? 0).toLocaleString(),
            moodLogs:        (moodLogsCount ?? 0).toLocaleString(),
            activitiesCount: (activitiesCount ?? 0).toLocaleString(),
            pendingAdmins:   pendingAdmins ?? 0,
          },
        },
        isLoadingAnalytics: false,
      });

      console.log('[ANALYTICS] ✅ Analytics cargados correctamente');
    } catch (err) {
      console.error('[ANALYTICS] ❌ Error fatal:', err);
      set({ isLoadingAnalytics: false });
    }
  },

  // ── CMS Activities ────────────────────────────────────────────────────────
  activities: [],
  isLoadingActivities: false,

  fetchActivities: async () => {
    console.log('[CMS] Cargando actividades desde Supabase...');
    set({ isLoadingActivities: true });

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[CMS] ❌ Error cargando actividades:', error.message, '| code:', error.code);
      set({ isLoadingActivities: false });
      return;
    }

    console.log('[CMS] ✅ Actividades cargadas:', data?.length ?? 0, 'registros');
    console.log('[CMS] Data:', JSON.stringify(data?.slice(0, 2))); // muestra primeras 2
    set({ activities: data ?? [], isLoadingActivities: false });
  },

  addActivity: async (activityData) => {
    const newId = Math.random().toString(36).substring(2, 9);
    const newActivity: ActivityDefinition = { id: newId, ...activityData };

    console.log('[CMS] Agregando actividad:', newActivity.title);
    set((state) => ({ activities: [...state.activities, newActivity] }));

    const { error } = await supabase.from('activities').insert({
      id:          newActivity.id,
      title:       newActivity.title,
      route:       newActivity.route,
      duration:    newActivity.duration,
      description: newActivity.description,
      icon:        newActivity.icon,
      color:       newActivity.color,
    });

    if (error) {
      console.error('[CMS] ❌ Error agregando actividad:', error.message, '| code:', error.code);
      set((state) => ({ activities: state.activities.filter(a => a.id !== newId) }));
      throw error;
    }

    console.log('[CMS] ✅ Actividad guardada en Supabase:', newActivity.title);
  },

  deleteActivity: async (id) => {
    console.log('[CMS] Eliminando actividad id:', id);
    const previous = get().activities;
    set((state) => ({ activities: state.activities.filter(a => a.id !== id) }));

    const { error } = await supabase.from('activities').delete().eq('id', id);

    if (error) {
      console.error('[CMS] ❌ Error eliminando actividad:', error.message);
      set({ activities: previous });
      throw error;
    }

    console.log('[CMS] ✅ Actividad eliminada:', id);
  },

  updateActivity: async (id, updated) => {
    console.log('[CMS] Actualizando actividad id:', id, '| datos:', updated);
    const previous = get().activities;
    set((state) => ({
      activities: state.activities.map(a => a.id === id ? { ...a, ...updated } : a)
    }));

    const { error } = await supabase
      .from('activities')
      .update({ ...updated, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[CMS] ❌ Error actualizando actividad:', error.message, '| code:', error.code);
      set({ activities: previous });
      throw error;
    }

    console.log('[CMS] ✅ Actividad actualizada:', id);
  },

  // ── App Settings ──────────────────────────────────────────────────────────
  appSettings: [],
  isLoadingSettings: false,

  fetchAppSettings: async () => {
    console.log('[SETTINGS] Cargando app_settings...');
    set({ isLoadingSettings: true });

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .order('key', { ascending: true });

    if (error) {
      console.error('[SETTINGS] ❌ Error cargando settings:', error.message, '| code:', error.code);
      set({ isLoadingSettings: false });
      return;
    }

    console.log('[SETTINGS] ✅ Settings cargados:', data?.length ?? 0, 'registros');
    set({ appSettings: data ?? [], isLoadingSettings: false });
  },

  updateAppSetting: async (key, value) => {
    console.log('[SETTINGS] Guardando setting:', key, '=', value);
    set((state) => ({
      appSettings: state.appSettings.map(s => s.key === key ? { ...s, value } : s)
    }));

    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      console.error('[SETTINGS] ❌ Error guardando setting:', key, '|', error.message);
      throw error;
    }

    console.log('[SETTINGS] ✅ Setting guardado:', key);
  },
}));