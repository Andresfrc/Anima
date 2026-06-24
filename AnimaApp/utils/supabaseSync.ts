/**
 * supabaseSync.ts
 * Sincroniza moodHistory, userXP, currentStreak y level entre Supabase y el store local.
 */
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { MoodType } from '../constants/theme';
import { getCurrentLevel } from '../constants/progressionSystem';

// ── ISO completo con offset local, ej: "2026-06-17T20:30:00-05:00" ───────────
function getLocalISOString(): string {
  const d = new Date();
  const tzOffset = -d.getTimezoneOffset();
  const sign = tzOffset >= 0 ? '+' : '-';
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const offsetStr = `${sign}${pad(tzOffset / 60)}:${pad(tzOffset % 60)}`;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${day}T${h}:${min}:${sec}${offsetStr}`;
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface MoodLog {
  id: string;
  mood: string;
  created_at: string;
  note?: string;
}

// ── 1. CARGAR historial de mood desde Supabase al store ───────────────────────
export async function loadMoodHistory(userId: string) {
  const { data, error } = await supabase
    .from('mood_logs')
    .select('id, mood, created_at, note')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) {
    console.log('Error cargando mood_logs:', error);
    return;
  }

  const labels: Record<string, string> = {
    animado: 'Animado', mejor: 'Mejor', neutral: 'Neutral',
    triste: 'Triste', muy_triste: 'Muy Triste',
  };

  const moodEntries = data.map((log: MoodLog) => ({
    id: log.id,
    mood: log.mood as MoodType,
    date: log.created_at,
    label: labels[log.mood] || log.mood,
    note: log.note,
  }));

  const scores: Record<string, number> = {
    animado: 5, mejor: 4, neutral: 3, triste: 2, muy_triste: 1,
  };
  const last7 = moodEntries.slice(0, 7);
  const weeklyMoodData = Array.from({ length: 7 }, (_, i) => {
    const entry = last7[6 - i];
    return entry ? scores[entry.mood] || 0 : 0;
  });

  useStore.setState({ moodHistory: moodEntries, weeklyMoodData });
  console.log(`✅ Cargados ${moodEntries.length} registros de ánimo`);
}

// ── 2. CARGAR progreso (XP, streak, level) desde Supabase al store ────────────
export async function loadUserProgress(userId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.log('Error cargando user_progress:', error);
    }
    return;
  }

  if (!data) return;

  const storeXP = useStore.getState().userXP;
  const supabaseXP = data.xp ?? 0;

  useStore.setState({
    userXP:         Math.max(storeXP, supabaseXP),
    currentStreak:  data.current_streak ?? 0,
    lastActiveDate: data.last_active_date ?? null,
    unlockedTitles: data.unlocked_titles ?? [],
  });

  console.log(`✅ Progreso cargado: XP=${data.xp}, Level=${data.level ?? 1}, Racha=${data.current_streak}`);
}

// ── 3. GUARDAR progreso en Supabase (upsert) ──────────────────────────────────
export async function saveUserProgress(userId: string) {
  const state = useStore.getState();

  // Calcular nivel actual basado en XP + plan
  const plan = state.currentPlan || 'balance';
  const currentLevel = getCurrentLevel(plan, state.userXP);

  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id:          userId,
      xp:               state.userXP,
      level:            currentLevel.level,   // ← guardamos el nivel
      current_streak:   state.currentStreak,
      last_active_date: state.lastActiveDate,
      current_plan:     state.currentPlan,
      unlocked_titles:  state.unlockedTitles,
      updated_at:       new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.log('Error guardando user_progress:', error);
  } else {
    console.log(`✅ Progreso guardado: XP=${state.userXP}, Level=${currentLevel.level}`);
  }
}

// ── 4. GUARDAR mood en mood_logs + actualizar progreso ────────────────────────
export async function saveMoodToSupabase(userId: string, mood: string, note?: string) {
  const localISO = getLocalISOString();
  const todayStr = localISO.substring(0, 10);

  // Verificar si ya existe un registro hoy antes de insertar
  const { data: existing } = await supabase
    .from('mood_logs')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', `${todayStr}T00:00:00`)
    .lte('created_at', `${todayStr}T23:59:59`)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`[MOOD] ⚠️ Ya existe registro hoy (${todayStr}), no se guarda duplicado`);
    return;
  }

  console.log(`[MOOD] Guardando mood "${mood}" con fecha local: ${localISO}`);

  const { error } = await supabase
    .from('mood_logs')
    .insert({
      user_id:    userId,
      mood,
      note:       note || null,
      created_at: localISO,
    });

  if (error) {
    console.log('Error guardando mood_log:', error);
    return;
  }

  console.log(`✅ Mood "${mood}" guardado correctamente`);
  await saveUserProgress(userId);
}

// ── 5. CARGA COMPLETA al iniciar sesión ───────────────────────────────────────
export async function syncUserDataFromSupabase(userId: string) {
  await Promise.all([
    loadMoodHistory(userId),
    loadUserProgress(userId),
  ]);
}