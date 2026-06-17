/**
 * useStore.ts — Store global de la aplicación con Zustand + persistencia.
 *
 * CAMBIOS DE AUDITORÍA:
 * 1. MoodType ahora se importa de constants/theme.ts (fuente única de verdad)
 * 2. Se eliminó BOT_RESPONSES y getBotResponse() → movido a services/ChatEngine.ts
 * 3. Se limpiaron los datos mock del estado inicial (moodHistory ahora empieza vacío)
 * 4. Las actividades se movieron a constants/activities.ts (datos estáticos ≠ estado)
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
  userName: string;
  userEmail: string;
  profileAvatar: string | null;
  showSplash: boolean;
  notificationsEnabled: boolean;
  
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
  
  // Actions
  login: (email: string, name: string) => void;
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
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
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
      
      // Actions
      login: (email, name) => set({ isAuthenticated: true, userEmail: email, userName: name || 'Usuario' }),
      updateUser: (name) => set({ userName: name }),
      setProfileAvatar: (avatarId) => set({ profileAvatar: avatarId }),
      logout: () => {
        SoundService.stopAmbient();
        set({ 
          isAuthenticated: false, userName: '', userEmail: '', profileAvatar: null, 
          messages: [], currentPlan: null, recommendedPlan: null,
          currentMood: null, moodHistory: [], weeklyMoodData: [0, 0, 0, 0, 0, 0, 0],
          journalEntries: [], recentActivities: [],
          userXP: 0, lastActiveDate: null, currentStreak: 0,
          pendingLevelUp: null, activeTitle: null, unlockedTitles: [],
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
        
        // Streak calculation
        const { lastActiveDate, currentStreak } = get();
        let newStreak = currentStreak;
        let bonusXP = 0;
        if (lastActiveDate) {
          const lastDate = new Date(lastActiveDate);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            newStreak = currentStreak + 1;
            if (newStreak === 3) bonusXP = XP_EVENTS.streak.amount; // +50 at 3-day streak
          } else if (diffDays >= 3) {
            bonusXP = XP_EVENTS.comeback.amount; // +30 comeback
            newStreak = 1;
          } else if (diffDays === 0) {
            // Same day, no streak change
          } else {
            newStreak = 1; // Reset streak (missed 1 day)
          }
        } else {
          newStreak = 1;
        }

        set({ 
          moodHistory: [newEntry, ...moodHistory], 
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
          set({ pendingLevelUp: newLevel });
          // Auto-unlock title rewards
          if (newLevel.reward?.type === 'title') {
            const titles = get().unlockedTitles;
            if (!titles.includes(newLevel.reward.id)) {
              set({ unlockedTitles: [...titles, newLevel.reward.id] });
            }
          }
        }
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
        const { messages } = get();
        const userMsg: ChatMessage = {
          id: Date.now().toString(),
          text,
          sender: 'user',
          timestamp: new Date(),
        };
        set({ messages: [...messages, userMsg], isTyping: true });
        
        // ChatEngine ahora es un servicio externo — fácil de reemplazar por API real
        setTimeout(() => {
          const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: getBotResponse(text),
            sender: 'bot',
            timestamp: new Date(),
          };
          set((state) => ({
            messages: [...state.messages, botMsg],
            isTyping: false,
          }));
        }, 1500 + Math.random() * 1000);
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
          set({ pendingLevelUp: newLevel });
          if (newLevel.reward?.type === 'title') {
            const titles = get().unlockedTitles;
            if (!titles.includes(newLevel.reward.id)) {
              set({ unlockedTitles: [...titles, newLevel.reward.id] });
            }
          }
        }
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
        // Check level up
        const plan = get().currentPlan || 'balance';
        const oldLevel = getCurrentLevel(plan, oldXP);
        const newLevel = getCurrentLevel(plan, newXP);
        if (newLevel.level > oldLevel.level) {
          set({ pendingLevelUp: newLevel });
          if (newLevel.reward?.type === 'title') {
            const titles = get().unlockedTitles;
            if (!titles.includes(newLevel.reward.id)) {
              set({ unlockedTitles: [...titles, newLevel.reward.id] });
            }
          }
        }
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
          set({ pendingLevelUp: newLevel });
        }
      },
      clearLevelUp: () => set({ pendingLevelUp: null }),
      setActiveTitle: (titleId) => set({ activeTitle: titleId }),
    }),
    {
      name: 'anima-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userName: state.userName,
        userEmail: state.userEmail,
        profileAvatar: state.profileAvatar,
        notificationsEnabled: state.notificationsEnabled,
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
      }),
    }
  )
);
