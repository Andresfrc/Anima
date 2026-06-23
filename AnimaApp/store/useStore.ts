/**
 * useStore.ts — Store global de la aplicación con Zustand + persistencia.
 *
 * CAMBIOS DE AUDITORÍA:
 * 1. MoodType ahora se importa de constants/theme.ts (fuente única de verdad)
 * 2. Se eliminó BOT_RESPONSES y getBotResponse() → movido a services/ChatEngine.ts
 * 3. Se limpiaron los datos mock del estado inicial (moodHistory ahora empieza vacío)
 * 4. Las actividades se movieron a constants/activities.ts (datos estáticos ≠ estado)
 *
 * CAMBIOS DE RECOMPENSAS:
 * 5. Se centralizó el desbloqueo de recompensas en handleLevelUp() (antes duplicado
 *    4 veces: saveMoodEntry, addJournalEntry, addCompletedActivity, addXP).
 * 6. Se agregó syncProgressToSupabase() que persiste xp, streak, unlocked_titles,
 *    unlocked_rewards, active_title, active_sound y active_lumi_variant en `user_progress`.
 * 7. Se agregó loadProgressFromSupabase() para traer el progreso guardado al iniciar sesión.
 *
 * FIX CRÍTICO (XP no se guardaba en Diario Estelar y similares):
 * 8. syncProgressToSupabase() vivía adentro de handleLevelUp(), así que el XP solo
 *    se guardaba en Supabase cuando la acción hacía subir de nivel al usuario. Si no
 *    subía de nivel (el caso más común — ej. una sola estrella del Diario Estelar),
 *    el XP subía en pantalla y en AsyncStorage local, pero nunca llegaba al servidor.
 *    Luego, loadProgressFromSupabase() pisaba ese XP local nuevo con el valor viejo
 *    del servidor. Ahora handleLevelUp() SOLO desbloquea recompensas, y cada acción
 *    que otorga XP (saveMoodEntry, addJournalEntry, addCompletedActivity, addXP)
 *    llama a syncProgressToSupabase() de forma incondicional, suba o no de nivel.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SoundService } from '../utils/SoundService';
import { NotificationService } from '../utils/NotificationService';
import { getBotResponse } from '../services/ChatEngine';
import { MoodType } from '../constants/theme';
import { DEFAULT_ACTIVITIES } from '../constants/activities';
import { XP_EVENTS, getCurrentLevel, RouteLevel } from '../constants/progressionSystem';
import { getStreak } from '../utils/streak';
import { supabase } from '../lib/supabase';

// Re-export MoodType desde la fuente única para compatibilidad con imports existentes
export { MoodType } from '../constants/theme';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface MoodEntry {
  id: string;
  mood: MoodType;
  date: string;
  label: string;
  note?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient?: [string, string];
  duration: string;
}

export interface JournalEntry {
  id: string;
  text: string;
  x: number;
  y: number;
  date: string;
}

interface AppState {
  // Auth
  isAuthenticated: boolean;
  userId: string | null;
  userName: string;
  userEmail: string;
  profileAvatar: string | null;
  showSplash: boolean;
  notificationsEnabled: boolean;
  // País fijado manualmente para las líneas de crisis del SOS (null = autodetectar)
  crisisRegion: string | null;
  setCrisisRegion: (region: string | null) => void;

  // Hydration — true cuando el store terminó de leerse desde AsyncStorage
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;

  // Debug
  mockLateNight: boolean;
  setMockLateNight: (val: boolean) => void;
  
  // UI State
  _scrollToMood?: boolean;
  
  // Plan (Emotional Route)
  currentPlan: string | null;
  recommendedPlan: string | null;
  
  // Mood
  currentMood: MoodType | null;
  moodHistory: MoodEntry[];
  weeklyMoodData: number[];
  
  // Chat
  messages: ChatMessage[];
  isTyping: boolean;
  
  // Journal (Gratitude)
  journalEntries: JournalEntry[];
  
  // Activities
  activities: Activity[];
  recentActivities: {
    title: string; time: string; detail: string; icon?: string; color?: string }[];

  // Supabase Sync (NUEVO)
  microCompleted: any[];
  energyCompleted: any[]; 
  
  
  // Progression
  userXP: number;
  lastActiveDate: string | null;
  currentStreak: number;
  pendingLevelUp: RouteLevel | null;
  activeTitle: string | null;
  unlockedTitles: string[];
  activeSound: string | null;
  activeLumiVariant: string | null;
  unlockedRewards: string[];
  
  // Actions
  login: (userId: string, email: string, name: string) => void;
  updateUser: (name: string) => void;
  setProfileAvatar: (avatarId: string | null) => void;
  logout: () => void;
  hideSplash: () => void;
  toggleNotifications: (enabled: boolean) => void;
  setPlan: (planId: string) => void;
  setRecommendedPlan: (planId: string | null) => void;
  setMood: (mood: MoodType) => void;
  saveMoodEntry: (note?: string) => void;
  removeMoodEntry: (id: string) => void;
  sendMessage: (text: string) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  removeJournalEntry: (id: string) => void;
  updateJournalEntry: (id: string, text: string) => void;
  addCompletedActivity: (title: string, type: string) => void;
  addXP: (amount: number) => void;
  clearLevelUp: () => void;
  setActiveTitle: (titleId: string | null) => void;
  setActiveSound: (soundId: string | null) => void;
  setActiveLumiVariant: (variantId: string | null) => void;
  loadProgressFromSupabase: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      // ── Sincroniza progreso + recompensas con Supabase (en background) ──────
      const syncProgressToSupabase = () => {
        const s = get();
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return;
          supabase
            .from('user_progress')
            .upsert(
              {
                user_id: user.id,
                xp: s.userXP,
                current_streak: s.currentStreak,
                last_active_date: s.lastActiveDate,
                current_plan: s.currentPlan,
                unlocked_titles: s.unlockedTitles,
                unlocked_rewards: s.unlockedRewards,
                active_title: s.activeTitle,
                active_sound: s.activeSound,
                active_lumi_variant: s.activeLumiVariant,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            )
            .then(({ error }) => {
              if (error) console.log('Error guardando progreso/recompensas:', error);
            });
        });
      };

      // ── Maneja un level-up: SOLO desbloquea recompensa (no sincroniza) ──────
      // El sync corre siempre desde quien llama a esta función (ver nota arriba).
      const handleLevelUp = (newLevel: RouteLevel) => {
        set({ pendingLevelUp: newLevel });
        if (newLevel.reward) {
          const rewards = get().unlockedRewards || [];
          if (!rewards.includes(newLevel.reward.id)) {
            set({ unlockedRewards: [...rewards, newLevel.reward.id] });
          }
          if (newLevel.reward.type === 'title') {
            const titles = get().unlockedTitles || [];
            if (!titles.includes(newLevel.reward.id)) {
              set({ unlockedTitles: [...titles, newLevel.reward.id] });
            }
          }
        }
      };

      return {
        // Hydration
        _hasHydrated: false,
        setHasHydrated: (val: boolean) => set({ _hasHydrated: val }),

        // Debug
        mockLateNight: false,
        setMockLateNight: (val: boolean) => set({ mockLateNight: val }),

        // UI State
        _scrollToMood: false,

        // Auth
        isAuthenticated: false,
        userName: '',
        userEmail: '',
        profileAvatar: null,
        showSplash: true,
        notificationsEnabled: true,
        crisisRegion: null,

        // Plan
        currentPlan: null,
        recommendedPlan: null,

        // Mood — FIX: Estado inicial limpio, sin datos mock
        currentMood: null,
        moodHistory: [],
        weeklyMoodData: [0, 0, 0, 0, 0, 0, 0],

        // Chat
        messages: [],
        isTyping: false,

        // Journal
        journalEntries: [],

        // Activities — Datos estáticos importados desde constants
        activities: DEFAULT_ACTIVITIES,
        recentActivities: [],
        microCompleted: [],
        energyCompleted: [],

        // Progression
        userXP: 0,
        lastActiveDate: null,
        currentStreak: 0,
        pendingLevelUp: null,
        activeTitle: null,
        unlockedTitles: [],
        activeSound: null,
        activeLumiVariant: null,
        unlockedRewards: [],

        // Actions
        login: (userId,email, name) => set({ isAuthenticated: true, userId,   userEmail: email, userName: name || 'Usuario' }),
        updateUser: (name) => set({ userName: name }),
        setProfileAvatar: (avatarId) => set({ profileAvatar: avatarId }),
        logout: () => {
          SoundService.stopAmbient();
          set({
            isAuthenticated: false, userId: null,   userName: '', userEmail: '', profileAvatar: null,
            messages: [], currentPlan: null, recommendedPlan: null,
            currentMood: null, moodHistory: [], weeklyMoodData: [0, 0, 0, 0, 0, 0, 0],
            journalEntries: [], recentActivities: [],
            userXP: 0, lastActiveDate: null, currentStreak: 0,
            pendingLevelUp: null, activeTitle: null, unlockedTitles: [],
            activeSound: null, activeLumiVariant: null, unlockedRewards: [],
            microCompleted: [],
            energyCompleted: [],
          });
        },
        hideSplash: () => set({ showSplash: false }),
        toggleNotifications: (enabled: boolean) => {
          set({ notificationsEnabled: enabled });
          if (!enabled) {
            NotificationService.cancelAllScheduledNotifications();
          }
        },
        setCrisisRegion: (region) => set({ crisisRegion: region }),
        setPlan: (planId) => set({ currentPlan: planId }),
        setRecommendedPlan: (planId) => set({ recommendedPlan: planId }),
        setMood: (mood) => set({ currentMood: mood }),
        saveMoodEntry: (note?: string) => {
          const { currentMood, moodHistory } = get();
          if (!currentMood) return;
          const labels: Record<MoodType, string> = {
            animado: 'Animado', mejor: 'Mejor', neutral: 'Neutral',
            triste: 'Triste', muy_triste: 'Muy Triste',
          };
          const newEntry: MoodEntry = {
            id: Date.now().toString(),
            mood: currentMood,
            date: new Date().toISOString(),
            label: labels[currentMood],
            note,
          };

          const scores: Record<MoodType, number> = {
            animado: 5, mejor: 4, neutral: 3, triste: 2, muy_triste: 1,
          };
          const score = scores[currentMood];
          const newWeekly = [...get().weeklyMoodData.slice(1), score];

          const oldXP = get().userXP;
          const newXP = oldXP + XP_EVENTS.mood.amount;
          const today = new Date().toISOString().split('T')[0];

          // Streak: se DERIVA del historial real (fuente única, ver utils/streak.ts).
          // Así el valor guardado coincide siempre con lo que muestran Perfil y Progreso.
          const updatedHistory = [newEntry, ...moodHistory];
          const { lastActiveDate, currentStreak: oldStreak } = get();
          const newStreak = getStreak(updatedHistory);

          let bonusXP = 0;
          if (newStreak === 3 && oldStreak < 3) {
            bonusXP = XP_EVENTS.streak.amount; // +50 al alcanzar 3 días seguidos
          } else if (lastActiveDate) {
            const diffDays = Math.floor((new Date(today).getTime() - new Date(lastActiveDate).getTime()) / 86400000);
            if (diffDays >= 3) bonusXP = XP_EVENTS.comeback.amount; // +30 al volver tras inactividad
          }

          set({
            moodHistory: updatedHistory,
            currentMood: null,
            weeklyMoodData: newWeekly,
            userXP: newXP + bonusXP,
            lastActiveDate: today,
            currentStreak: newStreak,
          });

          // Check level up
          const plan = get().currentPlan || 'balance';
          const oldLevel = getCurrentLevel(plan, oldXP);
          const newLevel = getCurrentLevel(plan, newXP + bonusXP);
          if (newLevel.level > oldLevel.level) {
            handleLevelUp(newLevel);
          }
          // Sync incondicional: este XP se guarda siempre, suba o no de nivel.
          syncProgressToSupabase();
        },
        removeMoodEntry: (id: string) => {
          const { moodHistory } = get();
          const updated = moodHistory.filter(e => e.id !== id);
          // Recalculate weeklyMoodData from last 7 entries
          const scores: Record<MoodType, number> = {
            animado: 5, mejor: 4, neutral: 3, triste: 2, muy_triste: 1,
          };
          const last7 = updated.slice(0, 7);
          const newWeekly = Array.from({ length: 7 }, (_, i) => {
            const entry = last7[6 - i];
            return entry ? scores[entry.mood as MoodType] || 0 : 0;
          });
          set({ moodHistory: updated, weeklyMoodData: newWeekly });
        },
        sendMessage: (text) => {
          const { messages, userId } = get();
          const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date(),
          };
          set({ messages: [...messages, userMsg], isTyping: true });

          // ChatEngine es un servicio externo asíncrono (API real).
          // FIX: getBotResponse devuelve Promise<string>; antes se asignaba la Promise
          // directamente a `text`, por lo que el chat mostraba "[object Promise]".
          getBotResponse(text, userId ?? undefined)
            .then((reply) => {
              const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: reply,
                sender: 'bot',
                timestamp: new Date(),
              };
              set((state) => ({
                messages: [...state.messages, botMsg],
                isTyping: false,
              }));
            })
            .catch(() => set({ isTyping: false }));
        },
        addJournalEntry: (entry) => {
          const oldXP = get().userXP;
          const newXP = oldXP + XP_EVENTS.journal.amount;
          set((state) => ({
            journalEntries: [...state.journalEntries, entry],
            userXP: newXP,
            lastActiveDate: new Date().toISOString().split('T')[0],
          }));
          // Check level up
          const plan = get().currentPlan || 'balance';
          const oldLevel = getCurrentLevel(plan, oldXP);
          const newLevel = getCurrentLevel(plan, newXP);
          if (newLevel.level > oldLevel.level) {
            handleLevelUp(newLevel);
          }
          // Sync incondicional: ESTE era el bug de Diario Estelar — antes solo se
          // guardaba el XP en Supabase si la estrella hacía subir de nivel.
          syncProgressToSupabase();
        },
        removeJournalEntry: (id) => {
          set((state) => ({
            journalEntries: state.journalEntries.filter((e) => e.id !== id),
          }));
        },
        updateJournalEntry: (id, text) => {
          set((state) => ({
            journalEntries: state.journalEntries.map((e) =>
              e.id === id ? { ...e, text } : e
            ),
          }));
        },
        addCompletedActivity: (title: string, type: string) => {
          const { recentActivities } = get();
          let icon = 'checkmark-circle-outline';
          let color = '#38B2AC';
          if (type === 'respiracion') { icon = 'water-outline'; color = '#87CEEB'; }
          if (type === 'meditacion') { icon = 'sparkles-outline'; color = '#A8E6CF'; }

          const oldXP = get().userXP;
          const newXP = oldXP + XP_EVENTS.activity.amount;
          const newActivity = { title, time: 'Recién', detail: 'Completado', icon, color };
          set({
            recentActivities: [newActivity, ...recentActivities].slice(0, 5),
            userXP: newXP,
            lastActiveDate: new Date().toISOString().split('T')[0],
          });

          // Sync de la actividad puntual (log) en background
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              const activityIdMap: Record<string, string> = {
                'Respiración Guiada': '1',
                'Diario Estelar': '2',
                'Relajación Progresiva': '3',
                'Conexión 5 Sentidos': '4',
                'Cápsula de Papel': '5',
                'Pomodoro de Paz': '6',
                'Diario Ciego': '7',
                'Astillero de Victorias': '8',
                'Abrazo de Mariposa': '9',
                'Mensaje en una Botella': '10',
              };
              const activityId = activityIdMap[title] || '0';

              supabase.from('activity_logs').insert({
                user_id: user.id,
                activity_id: activityId,
                activity_name: title,
                plan: get().currentPlan,
                started_at: new Date().toISOString(),
                completed: true,
              }).then(({ error }) => {
                if (error) console.log('Error Syncing Activity Log:', error);
              });
            }
          });

          // Check level up
          const plan = get().currentPlan || 'balance';
          const oldLevel = getCurrentLevel(plan, oldXP);
          const newLevel = getCurrentLevel(plan, newXP);
          if (newLevel.level > oldLevel.level) {
            handleLevelUp(newLevel);
          }
          // Sync incondicional: el xp/streak/unlocked_titles/recompensas de
          // user_progress se guarda siempre, suba o no de nivel.
          syncProgressToSupabase();
        },
        addXP: (amount: number) => {
          const oldXP = get().userXP;
          const newXP = oldXP + amount;
          set({
            userXP: newXP,
            lastActiveDate: new Date().toISOString().split('T')[0],
          });
          const plan = get().currentPlan || 'balance';
          const oldLevel = getCurrentLevel(plan, oldXP);
          const newLevel = getCurrentLevel(plan, newXP);
          if (newLevel.level > oldLevel.level) {
            handleLevelUp(newLevel);
          }
          syncProgressToSupabase();
        },
        clearLevelUp: () => set({ pendingLevelUp: null }),
        setActiveTitle: (titleId) => {
          set({ activeTitle: titleId });
          syncProgressToSupabase();
        },
        setActiveSound: (soundId) => {
          set({ activeSound: soundId });
          syncProgressToSupabase();
        },
        setActiveLumiVariant: (variantId) => {
          set({ activeLumiVariant: variantId });
          syncProgressToSupabase();
        },

        // ── Trae el progreso guardado en Supabase (otro dispositivo, reinstalación, etc.) ──
        loadProgressFromSupabase: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('user_progress')
            .select('xp, current_streak, last_active_date, current_plan, unlocked_titles, unlocked_rewards, active_title, active_sound, active_lumi_variant')
            .eq('user_id', user.id)
            .single();

          if (error || !data) return;

          set({
            userXP: data.xp ?? get().userXP,
            currentStreak: data.current_streak ?? get().currentStreak,
            lastActiveDate: data.last_active_date ?? get().lastActiveDate,
            currentPlan: data.current_plan ?? get().currentPlan,
            unlockedTitles: data.unlocked_titles ?? get().unlockedTitles,
            unlockedRewards: data.unlocked_rewards ?? get().unlockedRewards,
            activeTitle: data.active_title ?? get().activeTitle,
            activeSound: data.active_sound ?? get().activeSound,
            activeLumiVariant: data.active_lumi_variant ?? get().activeLumiVariant,
          });
        },
      };
    },
    {
      name: 'anima-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Se ejecuta cuando termina de leer desde AsyncStorage
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userName: state.userName,
        userId: state.userId,
        userEmail: state.userEmail,
        profileAvatar: state.profileAvatar,
        notificationsEnabled: state.notificationsEnabled,
        crisisRegion: state.crisisRegion,
        currentPlan: state.currentPlan,
        recommendedPlan: state.recommendedPlan,
        moodHistory: state.moodHistory,
        weeklyMoodData: state.weeklyMoodData,
        messages: state.messages,
        journalEntries: state.journalEntries,
        recentActivities: state.recentActivities,
        userXP: state.userXP,
        lastActiveDate: state.lastActiveDate,
        currentStreak: state.currentStreak,
        activeTitle: state.activeTitle,
        unlockedTitles: state.unlockedTitles,
        activeSound: state.activeSound,
        activeLumiVariant: state.activeLumiVariant,
        unlockedRewards: state.unlockedRewards,
      }),
    }
  )
);