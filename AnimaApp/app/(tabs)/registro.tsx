import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import Animated, { FadeInUp, FadeIn, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, MoodConfig } from '../../constants/theme';
import {
  GlassCard, SectionHeader, Mascot, FloatingParticles, JewelButton,
} from '../../components/ui';
import { useTheme } from '../../hooks/useTheme';
import { useStore, MoodType } from '../../store/useStore';
import { EMOTIONAL_ROUTES } from '../../constants/clinicalContent';
import { SoundService } from '../../utils/SoundService';
import { useRouter } from 'expo-router';
import { getCurrentLevel, getNextLevel, getLevelProgress, ROUTE_PROGRESSIONS, getAllRewards } from '../../constants/progressionSystem';
import { supabase } from '../../lib/supabase';
import { saveMoodToSupabase } from '../../utils/supabaseSync';
import { getStreak } from '../../utils/streak';

// ============================================================
// HELPERS
// ============================================================

function getEmotionalInsight(
  moodHistory: { mood: string; date: string }[],
  recentActivities: any[],
  currentPlan: string | null,
): { icon: string; title: string; message: string; color: string } {
  if (moodHistory.length === 0) {
    return {
      icon: 'sparkles',
      title: '¡Empieza tu viaje!',
      message: 'Registra cómo te sientes cada día y descubre patrones en tu bienestar emocional. Lumi te acompañará.',
      color: Colors.primary,
    };
  }
  const scores: Record<string, number> = { animado: 5, mejor: 4, neutral: 3, triste: 2, muy_triste: 1 };
  const recent3 = moodHistory.slice(0, 3).map(e => scores[e.mood] || 3);
  const older3 = moodHistory.slice(3, 6).map(e => scores[e.mood] || 3);
  const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
  const olderAvg = older3.length > 0 ? older3.reduce((a, b) => a + b, 0) / older3.length : recentAvg;
  const routeName = EMOTIONAL_ROUTES.find(r => r.id === currentPlan)?.title || 'tu ruta';
  if (recentAvg > olderAvg + 0.5) {
    return { icon: 'trending-up', title: '¡Tu ánimo mejora! 🌱', message: `Tus últimos registros muestran una tendencia positiva. ${routeName} está funcionando para ti.`, color: '#4ADE80' };
  }
  if (recentAvg < olderAvg - 0.5) {
    return { icon: 'heart', title: 'Has tenido días difíciles 💙', message: 'Recuerda que registrar cómo te sientes es parte del proceso. Estamos contigo, cada paso cuenta.', color: '#60A5FA' };
  }
  if (recentAvg >= 3.5) {
    return { icon: 'sunny', title: '¡Vas muy bien! ☀️', message: `Tu ánimo se mantiene positivo. La consistencia en ${routeName} marca la diferencia.`, color: '#FBBF24' };
  }
  if (moodHistory.length >= 5) {
    return { icon: 'shield-checkmark', title: 'Tu constancia es tu superpoder', message: `Llevas ${moodHistory.length} registros. Conocerte mejor es el primer paso para sentirte mejor.`, color: '#A78BFA' };
  }
  return { icon: 'leaf', title: 'Cada registro cuenta 🍃', message: 'Cuanto más registres, mejores patrones descubrirás. Sigue así.', color: Colors.mint };
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function MoodWeekChart({ data, history }: { data: number[]; history: any[] }) {
  const { colors, isDark } = useTheme();
  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const today = new Date().getDay();
  const orderedLabels = [...dayLabels.slice(today === 0 ? 1 : today), ...dayLabels.slice(0, today === 0 ? 1 : today)];
  const maxVal = Math.max(...data, 1);
  return (
    <View style={chartStyles.container}>
      {data.map((val, i) => {
        const height = Math.max(8, (val / maxVal) * 52);
        const isToday = i === data.length - 1;
        const moodKey = val >= 4 ? 'mejor' : val >= 3 ? 'neutral' : val >= 2 ? 'triste' : null;
        const barColor = moodKey ? (MoodConfig[moodKey as MoodType]?.color || colors.primary) : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)');
        return (
          <View key={i} style={chartStyles.barWrap}>
            <View style={[chartStyles.bar, { height, backgroundColor: barColor }, isToday && { borderWidth: 2, borderColor: colors.primary + '40' }]}>
              {val > 0 && <View style={[chartStyles.barGlow, { backgroundColor: barColor + '30' }]} />}
            </View>
            <Text style={[chartStyles.label, { color: isToday ? colors.primary : colors.textLight }, isToday && { fontWeight: '700' }]}>
              {orderedLabels[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 68, paddingHorizontal: 4 },
  barWrap: { alignItems: 'center', flex: 1, gap: 6 },
  bar: { width: 22, borderRadius: 8, minHeight: 6, overflow: 'hidden' },
  barGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', borderRadius: 8 },
  label: { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
});

// ============================================================
// MAIN SCREEN
// ============================================================
export default function RegistroScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const moodHistory = useStore(s => s.moodHistory);
  const journalEntries = useStore(s => s.journalEntries) ?? [];
  const recentActivities = useStore(s => s.recentActivities);
  const weeklyMoodData = useStore(s => s.weeklyMoodData);
  const currentPlan = useStore(s => s.currentPlan);
  const setMood = useStore(s => s.setMood);
  const saveMoodEntry = useStore(s => s.saveMoodEntry);
  const removeMoodEntry = useStore(s => s.removeMoodEntry);

  const streak = useMemo(() => getStreak(moodHistory), [moodHistory]);
  const insight = useMemo(() => getEmotionalInsight(moodHistory, recentActivities, currentPlan), [moodHistory, recentActivities, currentPlan]);
  const isEmpty = moodHistory.length === 0 && journalEntries.length === 0;

  const alreadyLoggedMoodToday = useMemo(() => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return moodHistory.some((entry) => {
      if (!entry.date) return false;
      try {
        const entryDate = new Date(entry.date);
        const entryStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
        return entryStr === todayStr;
      } catch {
        return false;
      }
    });
  }, [moodHistory]);

  const [showLogModal, setShowLogModal] = useState(false);
  const [savedXP, setSavedXP] = useState(false);
  const [registroTab, setRegistroTab] = useState<'registro' | 'progreso'>('registro');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [journalNote, setJournalNote] = useState('');

  // ── FIX: Cargar estrellas desde Supabase al montar ────────────────────────
  // Sin esto, el contador de Estrellas y la timeline muestran 0
  // hasta que el usuario abre el Diario Estelar manualmente
  useEffect(() => {
    const loadJournalEntries = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, text, x, y, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !data) return;

      const mapped = data.map((row) => ({
        id:   row.id,
        text: row.text,
        x:    row.x,
        y:    row.y,
        date: row.created_at,
      }));

      if (mapped.length > 0) {
        useStore.setState({ journalEntries: mapped });
      }
    };

    loadJournalEntries();
  }, []);

  const dominantMood = useMemo(() => {
    if (moodHistory.length === 0) return null;
    const counts: Record<string, number> = {};
    moodHistory.forEach(e => { counts[e.mood] = (counts[e.mood] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] as MoodType : null;
  }, [moodHistory]);

  const handleSaveLog = useCallback(async () => {
    if (!selectedMood) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    SoundService.play('click');
    setMood(selectedMood);
    saveMoodEntry(journalNote.trim() || undefined);
    setJournalNote('');
    setSelectedMood(null);
    setSavedXP(true);
    setTimeout(() => { setSavedXP(false); setShowLogModal(false); }, 1200);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await saveMoodToSupabase(user.id, selectedMood, journalNote.trim() || undefined);
    } catch (err) {
      console.log('Error sync mood registro:', err);
    }
  }, [selectedMood, journalNote]);

  const userXP = useStore(s => s.userXP);
  const currentLevel = useMemo(() => getCurrentLevel(currentPlan || 'balance', userXP), [currentPlan, userXP]);
  const nextLevel = useMemo(() => getNextLevel(currentPlan || 'balance', userXP), [currentPlan, userXP]);
  const progressPct = useMemo(() => getLevelProgress(currentPlan || 'balance', userXP), [currentPlan, userXP]);
  const progression = ROUTE_PROGRESSIONS[currentPlan || 'balance'];
  const routeColor = progression?.color || colors.primary;
  const allRewards = useMemo(() => {
    const items = getAllRewards(currentPlan || 'balance', userXP);
    return items.map(r => ({ ...r, unlocked: userXP >= r.xpRequired }));
  }, [currentPlan, userXP]);

  return (
    <View style={styles.container}>
      <FloatingParticles count={10} persistenceKey="registro_stars_v3" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ─── 1. HEADER + LUMI ─── */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.headerSection}>
          <View style={styles.headerTextCol}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mi Viaje</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>
              {moodHistory.length > 0
                ? `${moodHistory.length} registro${moodHistory.length !== 1 ? 's' : ''} de tu camino emocional`
                : 'Tu espacio de autoconocimiento'
              }
            </Text>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={14} color="#F97316" />
                <Text style={styles.streakText}>{streak} día{streak !== 1 ? 's' : ''} seguido{streak !== 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
          <Mascot size={90} variant={'registro' as any} style={{ marginRight: -8 }} />
        </Animated.View>

        {/* ─── TAB SWITCHER ─── */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.tabSwitcher}>
          <Pressable
            style={[styles.tabBtn, registroTab === 'registro' && { backgroundColor: colors.primary + '20' }]}
            onPress={() => { Haptics.selectionAsync(); setRegistroTab('registro'); }}
          >
            <Ionicons name="time-outline" size={16} color={registroTab === 'registro' ? colors.primary : colors.textLight} />
            <Text style={[styles.tabBtnText, { color: registroTab === 'registro' ? colors.primary : colors.textLight }]}>Registro</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, registroTab === 'progreso' && { backgroundColor: routeColor + '20' }]}
            onPress={() => { Haptics.selectionAsync(); setRegistroTab('progreso'); }}
          >
            <Ionicons name="trophy-outline" size={16} color={registroTab === 'progreso' ? routeColor : colors.textLight} />
            <Text style={[styles.tabBtnText, { color: registroTab === 'progreso' ? routeColor : colors.textLight }]}>Progreso</Text>
            <View style={[styles.tabLvlBadge, { backgroundColor: routeColor + '20' }]}>
              <Text style={[styles.tabLvlText, { color: routeColor }]}>Lv.{currentLevel.level}</Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* ─── TAB CONTENT ─── */}
        {registroTab === 'registro' ? (
          <View>
            {/* ─── 2. INSIGHT EMOCIONAL ─── */}
            <Animated.View entering={FadeInUp.duration(500).delay(100)}>
              <GlassCard style={{ ...styles.insightCard, borderLeftColor: insight.color, borderLeftWidth: 3 }}>
                <View style={styles.insightRow}>
                  <View style={[styles.insightIconWrap, { backgroundColor: insight.color + '15' }]}>
                    <Ionicons name={insight.icon as any} size={22} color={insight.color} />
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>{insight.title}</Text>
                    <Text style={[styles.insightMessage, { color: colors.textSecondary }]}>{insight.message}</Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>

            {/* ─── 3. GRÁFICO SEMANAL ─── */}
            {moodHistory.length > 0 && (
              <Animated.View entering={FadeInUp.duration(500).delay(200)}>
                <GlassCard style={styles.chartCard}>
                  <View style={styles.chartHeader}>
                    <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Esta semana</Text>
                    {dominantMood && (
                      <View style={[styles.dominantBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
                        <Ionicons name={MoodConfig[dominantMood]?.icon as any || 'ellipse'} size={13} color={MoodConfig[dominantMood]?.color} />
                        <Text style={{ fontSize: 11, fontWeight: '600', color: MoodConfig[dominantMood]?.color, fontFamily: 'Poppins_600SemiBold' }}>
                          {MoodConfig[dominantMood]?.label}
                        </Text>
                      </View>
                    )}
                  </View>
                  <MoodWeekChart data={weeklyMoodData} history={moodHistory} />
                </GlassCard>
              </Animated.View>
            )}

            {/* ─── 4. STATS ROW ─── */}
            <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.statsRow}>
              {[
                { n: moodHistory.length, label: 'Registros', icon: 'heart', color: colors.primary, bg: Colors.primary },
                { n: journalEntries.length, label: 'Estrellas', icon: 'star', color: '#FCD34D', bg: '#FCD34D' },
                { n: recentActivities.length, label: 'Actividades', icon: 'sparkles', color: colors.mint, bg: Colors.mint },
              ].map((s, i) => (
                <View key={i} style={styles.statCard}>
                  <LinearGradient colors={[s.bg + '15', s.bg + '05']} style={styles.statGradient}>
                    <View style={[styles.statIconWrap, { backgroundColor: s.bg + '18' }]}>
                      <Ionicons name={s.icon as any} size={16} color={s.color} />
                    </View>
                    <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{s.n}</Text>
                    <Text style={[styles.statLabel, { color: colors.textLight }]}>{s.label}</Text>
                  </LinearGradient>
                </View>
              ))}
            </Animated.View>

            {/* ─── 5. ACTIVIDADES RECIENTES ─── */}
            {recentActivities.length > 0 && (
              <Animated.View entering={FadeInUp.duration(500).delay(350)}>
                <SectionHeader title="Tu progreso" subtitle="Actividades completadas recientemente" />
                {recentActivities.slice(0, 4).map((act, i) => (
                  <Animated.View key={`act-${i}`} entering={FadeInRight.duration(400).delay(i * 80)}>
                    <GlassCard style={styles.activityItem}>
                      <View style={[styles.activityIconWrap, { backgroundColor: (act.color || Colors.mint) + '15' }]}>
                        <Ionicons name={(act.icon || 'checkmark-circle-outline') as any} size={18} color={act.color || Colors.mint} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>{act.title}</Text>
                        <Text style={[styles.activityTime, { color: colors.textLight }]}>{act.time}</Text>
                      </View>
                      <View style={[styles.activityDonePill, { backgroundColor: (act.color || Colors.mint) + '12' }]}>
                        <Ionicons name="checkmark" size={12} color={act.color || Colors.mint} />
                        <Text style={{ fontSize: 10, color: act.color || Colors.mint, fontWeight: '600' }}>{act.detail}</Text>
                      </View>
                    </GlassCard>
                  </Animated.View>
                ))}
              </Animated.View>
            )}

            {/* ─── 6. TIMELINE ─── */}
            <Animated.View entering={FadeInUp.duration(500).delay(400)}>
              <SectionHeader
                title="Tu línea de tiempo"
                subtitle={moodHistory.length > 0 ? `Últimos ${Math.min(moodHistory.length, 10)} registros` : undefined}
              />
            </Animated.View>

            {!isEmpty ? (
              <View>
                {moodHistory.slice(0, 10).map((entry, i) => {
                  const config = MoodConfig[entry.mood as MoodType];
                  const isLast = i === Math.min(moodHistory.length, 10) - 1;
                  return (
                    <Animated.View key={entry.id} entering={FadeInUp.duration(400).delay(450 + i * 60)}>
                      <View style={styles.timelineItem}>
                        <View style={styles.timelineSpine}>
                          <View style={[styles.timelineDot, { borderColor: config?.color || '#B8C4D0' }]}>
                            <Ionicons name={(config?.icon || 'ellipse') as any} size={12} color={config?.color || '#B8C4D0'} />
                          </View>
                          {!isLast && <View style={[styles.timelineConnector, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />}
                        </View>
                        <Pressable
                          style={{ flex: 1, marginLeft: 8, marginBottom: 8 }}
                          onLongPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            Alert.alert(
                              'Eliminar registro',
                              `¿Quieres eliminar este registro de "${config?.label}"?`,
                              [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Eliminar', style: 'destructive', onPress: () => removeMoodEntry(entry.id) },
                              ]
                            );
                          }}
                          delayLongPress={500}
                        >
                          <GlassCard>
                            <View style={styles.timelineRow}>
                              <View style={{ flex: 1, gap: 2 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={[styles.timelineLabel, { color: colors.textPrimary }]}>{entry.label}</Text>
                                  <View style={[styles.moodPill, { backgroundColor: (config?.color || '#B8C4D0') + '12' }]}>
                                    <Text style={[styles.moodPillText, { color: config?.color }]}>{config?.label}</Text>
                                  </View>
                                </View>
                                <Text style={[styles.timelineDate, { color: colors.textLight }]}>
                                  {new Date(entry.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </Text>
                                {!!entry.note && (
                                  <View style={[styles.noteBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                                    <Ionicons name="chatbubble-outline" size={12} color={colors.textLight} />
                                    <Text style={[styles.timelineNote, { color: colors.textSecondary }]}>{entry.note}</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </GlassCard>
                        </Pressable>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            ) : (
              <Animated.View entering={FadeIn.duration(600).delay(400)}>
                <Pressable onPress={() => {
                  useStore.setState({ _scrollToMood: true });
                  router.push('/');
                }}>
                  <GlassCard style={styles.emptyCard}>
                    <Image
                      source={require('../../assets/images/mascot/lumi-camino.png')}
                      style={styles.emptyLumiImage}
                      resizeMode="contain"
                    />
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Tu historia empieza aquí</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Cada registro es un paso hacia conocerte mejor. Lumi te acompañará en el camino.
                    </Text>
                    <View style={styles.emptySteps}>
                      {[
                        { icon: 'add-circle-outline', text: 'Toca aquí o el botón + para registrar tu ánimo', color: Colors.primary },
                        { icon: 'bar-chart-outline', text: 'Descubre patrones en tu bienestar', color: '#FBBF24' },
                        { icon: 'analytics-outline', text: 'Recibe insights personalizados', color: '#4ADE80' },
                      ].map((step, i) => (
                        <Animated.View key={i} entering={FadeInRight.duration(400).delay(600 + i * 120)}>
                          <View style={[styles.emptyStep, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : step.color + '08' }]}>
                            <View style={[styles.emptyStepIcon, { backgroundColor: step.color + '15' }]}>
                              <Ionicons name={step.icon as any} size={18} color={step.color} />
                            </View>
                            <Text style={[styles.emptyStepText, { color: colors.textSecondary }]}>{step.text}</Text>
                          </View>
                        </Animated.View>
                      ))}
                    </View>
                  </GlassCard>
                </Pressable>
              </Animated.View>
            )}

            <View style={{ height: 120 }} />
          </View>
        ) : (
          /* ─── PROGRESO TAB ─── */
          <View>
            {/* Hero Level Card */}
            <Animated.View entering={FadeIn.duration(500)}>
              <GlassCard style={styles.heroLevelCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={[styles.levelBadgeLg, { backgroundColor: routeColor + '20', borderColor: routeColor }]}>
                    <Text style={[styles.levelBadgeNum, { color: routeColor }]}>Lv.{currentLevel.level}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.heroLevelRoute, { color: colors.textLight }]}>Ruta {progression?.routeName} {progression?.emoji}</Text>
                    <Text style={[styles.heroLevelTitle, { color: colors.textPrimary }]}>{currentLevel.title}</Text>
                  </View>
                  <Mascot size={70} variant={'celebrando' as any} />
                </View>
                <View style={{ marginTop: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={[styles.xpLabelTxt, { color: colors.textLight }]}>
                      {!nextLevel ? '¡Nivel Máximo!' : `${userXP} / ${nextLevel.xpRequired} XP`}
                    </Text>
                    <Text style={[styles.xpPctTxt, { color: routeColor }]}>{Math.round(progressPct * 100)}%</Text>
                  </View>
                  <View style={[styles.xpBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    <View style={[styles.xpBarFill, { width: `${Math.max(progressPct * 100, 2)}%`, backgroundColor: routeColor }]} />
                  </View>
                  {nextLevel && (
                    <Text style={[styles.xpRemainingTxt, { color: colors.textLight }]}>
                      {nextLevel.xpRequired - userXP} XP para "{nextLevel.title}"
                    </Text>
                  )}
                </View>
                <View style={[styles.lumiMsgBox, { backgroundColor: routeColor + '08' }]}>
                  <Ionicons name="chatbubble-ellipses" size={14} color={routeColor} />
                  <Text style={[styles.lumiMsgTxt, { color: colors.textSecondary }]}>{currentLevel.lumiMessage}</Text>
                </View>
              </GlassCard>
            </Animated.View>

            {/* XP Sources */}
            <Animated.View entering={FadeInUp.duration(400).delay(200)}>
              <SectionHeader title="¿Cómo gano XP?" />
              <View style={{ gap: 8, marginBottom: 20 }}>
                {[
                  { icon: 'heart', label: 'Registrar ánimo', xp: '+10', color: '#F472B6' },
                  { icon: 'sparkles', label: 'Completar actividad', xp: '+25', color: '#4ADE80' },
                  { icon: 'star', label: 'Diario Estelar', xp: '+15', color: '#FCD34D' },
                  { icon: 'flame', label: 'Racha 3+ días', xp: '+50', color: '#F97316' },
                ].map((s, i) => (
                  <Animated.View key={i} entering={FadeInRight.duration(300).delay(300 + i * 80)}>
                    <View style={[styles.xpSourceRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                      <View style={[styles.xpSourceIco, { backgroundColor: s.color + '15' }]}>
                        <Ionicons name={s.icon as any} size={16} color={s.color} />
                      </View>
                      <Text style={[styles.xpSourceLbl, { color: colors.textPrimary }]}>{s.label}</Text>
                      <Text style={[styles.xpSourceVal, { color: s.color }]}>{s.xp}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Rewards */}
            <Animated.View entering={FadeInUp.duration(400).delay(400)}>
              <SectionHeader title="Recompensas" />
              <View style={{ gap: 10, marginBottom: 20 }}>
                {allRewards.map((r, i) => (
                  <Animated.View key={r.reward.id} entering={FadeInUp.duration(300).delay(500 + i * 80)}>
                    <GlassCard style={{ ...styles.rewardRow, ...(r.unlocked ? {} : { opacity: 0.5 }) }}>
                      <View style={[styles.rewardIco, { backgroundColor: r.unlocked ? routeColor + '20' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') }]}>
                        {r.unlocked
                          ? <Ionicons name={r.reward.icon as any} size={22} color={routeColor} />
                          : <Ionicons name="lock-closed" size={18} color={colors.textLight} />
                        }
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rewardNm, { color: r.unlocked ? colors.textPrimary : colors.textLight }]}>{r.reward.name}</Text>
                        <Text style={[styles.rewardDsc, { color: colors.textLight }]}>
                          {r.unlocked ? r.reward.description : `Nivel ${r.level} • ${r.xpRequired} XP`}
                        </Text>
                      </View>
                      {r.unlocked && <Ionicons name="checkmark-circle" size={20} color={routeColor} />}
                    </GlassCard>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Journey Timeline */}
            <Animated.View entering={FadeInUp.duration(400).delay(600)}>
              <SectionHeader title="Tu Camino" />
              <View style={{ marginBottom: 16 }}>
                {progression?.levels.map((lvl, i) => {
                  const isReached = userXP >= lvl.xpRequired;
                  const isCurrent = lvl.level === currentLevel.level;
                  return (
                    <View key={lvl.level} style={styles.jItem}>
                      <View style={styles.jSpine}>
                        <View style={[styles.jDot, {
                          backgroundColor: isReached ? routeColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                          borderColor: isCurrent ? routeColor : 'transparent',
                          borderWidth: isCurrent ? 3 : 0,
                          transform: [{ scale: isCurrent ? 1.3 : 1 }],
                        }]}>
                          {isReached && <Ionicons name="checkmark" size={10} color="#FFF" />}
                        </View>
                        {i < (progression?.levels.length || 0) - 1 && (
                          <View style={[styles.jLine, { backgroundColor: isReached ? routeColor + '40' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') }]} />
                        )}
                      </View>
                      <View style={styles.jContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.jTitle, { color: isReached ? colors.textPrimary : colors.textLight }]}>
                            Lv.{lvl.level} — {lvl.title}
                          </Text>
                          {isCurrent && (
                            <View style={[styles.jCurrentBadge, { backgroundColor: routeColor }]}>
                              <Text style={styles.jCurrentText}>TÚ</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.jXP, { color: colors.textLight }]}>
                          {lvl.xpRequired === 0 ? 'Inicio' : `${lvl.xpRequired} XP`}
                        </Text>
                        {lvl.reward && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                            <Ionicons name={(isReached ? 'gift' : 'gift-outline') as any} size={11} color={isReached ? routeColor : colors.textLight} />
                            <Text style={[styles.jReward, { color: isReached ? routeColor : colors.textLight }]}>{lvl.reward.name}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            <View style={{ height: 120 }} />
          </View>
        )}
      </ScrollView>

      {/* ─── FAB ─── */}
      {!alreadyLoggedMoodToday && (
        <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.fabContainer}>
          <Pressable
            style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85, transform: [{ scale: 0.93 }] }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              SoundService.play('click');
              setShowLogModal(true);
            }}
          >
            <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.fabGradient}>
              <Ionicons name="add" size={28} color="#FFF" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* ─── LOG MODAL ─── */}
      <Modal visible={showLogModal} transparent animationType="slide" onRequestClose={() => setShowLogModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.bgCard : '#FFFFFF' }]}>
            <View style={[styles.modalHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>¿Cómo te sientes?</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textLight }]}>Tómate un momento para reflexionar</Text>
              </View>
              <Pressable onPress={() => setShowLogModal(false)} hitSlop={12}>
                <Ionicons name="close-circle" size={28} color={colors.textLight} />
              </Pressable>
            </View>

            <View style={styles.moodGrid}>
              {(Object.keys(MoodConfig) as MoodType[]).map((moodKey) => {
                const isSelected = selectedMood === moodKey;
                const config = MoodConfig[moodKey];
                return (
                  <Pressable
                    key={moodKey}
                    style={[
                      styles.moodBox,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                      isSelected && { backgroundColor: config.color + '15', borderColor: config.color, borderWidth: 2 },
                    ]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedMood(moodKey); }}
                  >
                    <Ionicons name={(config.icon || 'ellipse') as any} size={28} color={isSelected ? config.color : colors.textLight} />
                    <Text style={[styles.moodLabel, { color: isSelected ? config.color : colors.textSecondary }, isSelected && { fontWeight: '700' }]}>
                      {config.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Reflexión del día (opcional)</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F7FAFC',
                color: colors.textPrimary,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              }]}
              placeholder="¿Qué hizo que te sintieras así?"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={journalNote}
              onChangeText={setJournalNote}
            />

            {savedXP ? (
              <Animated.View entering={FadeIn.duration(300)} style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: 'rgba(252, 211, 77, 0.15)', paddingVertical: 16, borderRadius: 20, marginTop: 20,
              }}>
                <Ionicons name="sparkles" size={20} color="#FCD34D" />
                <Text style={{ color: '#FCD34D', fontSize: 18, fontFamily: 'Poppins_700Bold' }}>+10 XP</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: 'Poppins_500Medium', marginLeft: 4 }}>¡Registrado!</Text>
              </Animated.View>
            ) : (
              <JewelButton
                title="Guardar Registro"
                icon="checkmark-circle-outline"
                onPress={handleSaveLog}
                style={{ marginTop: 20, opacity: selectedMood ? 1 : 0.5 }}
                disabled={!selectedMood}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
  headerSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTextCol: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 28, fontWeight: '700', fontFamily: 'Poppins_700Bold', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(249,115,22,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, alignSelf: 'flex-start', marginTop: 6 },
  streakText: { fontSize: 12, fontWeight: '700', color: '#F97316', fontFamily: 'Poppins_700Bold' },
  insightCard: { marginBottom: 16, paddingVertical: 14 },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  insightIconWrap: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  insightContent: { flex: 1, gap: 4 },
  insightTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  insightMessage: { fontSize: 13, lineHeight: 19, fontFamily: 'Poppins_400Regular' },
  chartCard: { marginBottom: 16, paddingVertical: 16 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingHorizontal: 4 },
  chartTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  dominantBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  statGradient: { alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  statIconWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium' },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, paddingVertical: 10 },
  activityIconWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activityTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  activityTime: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  activityDonePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timelineSpine: { width: 32, alignItems: 'center', paddingTop: 16 },
  timelineDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', zIndex: 1 },
  timelineConnector: { width: 2, flex: 1, marginTop: -2 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineLabel: { fontSize: 15, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  timelineDate: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  moodPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  moodPillText: { fontSize: 10, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 6, padding: 8, borderRadius: 10 },
  timelineNote: { fontSize: 12, fontStyle: 'italic', lineHeight: 17, fontFamily: 'Poppins_400Regular', flex: 1 },
  emptyCard: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyLumiImage: { width: 110, height: 110, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold', marginTop: 4 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 16, lineHeight: 21, fontFamily: 'Poppins_400Regular' },
  emptySteps: { marginTop: 12, gap: 10, width: '100%', paddingHorizontal: 4 },
  emptyStep: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16 },
  emptyStepIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emptyStepText: { fontSize: 13, fontFamily: 'Poppins_500Medium', flex: 1 },
  fabContainer: { position: 'absolute', bottom: 110, right: 24, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  fab: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
  fabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  modalSubtitle: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  moodBox: { width: '30%', aspectRatio: 1, borderRadius: 16, borderWidth: 1.5, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center', gap: 8 },
  moodLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  inputLabel: { fontSize: 14, fontFamily: 'Poppins_500Medium', marginBottom: 8 },
  input: { borderRadius: 16, padding: 16, fontSize: 14, borderWidth: 1, minHeight: 90, fontFamily: 'Poppins_400Regular' },
  heroLevelCard: { padding: 20, marginBottom: 20 },
  levelBadgeLg: { width: 56, height: 56, borderRadius: 18, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  levelBadgeNum: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  heroLevelRoute: { fontSize: 11, fontFamily: 'Poppins_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroLevelTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', marginTop: 2 },
  xpLabelTxt: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  xpPctTxt: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  xpBarTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 5 },
  xpRemainingTxt: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 6 },
  lumiMsgBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, marginTop: 14 },
  lumiMsgTxt: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', fontStyle: 'italic', lineHeight: 20 },
  xpSourceRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, gap: 10 },
  xpSourceIco: { width: 34, height: 34, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  xpSourceLbl: { flex: 1, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  xpSourceVal: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rewardIco: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  rewardNm: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  rewardDsc: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  jItem: { flexDirection: 'row', minHeight: 64 },
  jSpine: { width: 36, alignItems: 'center' },
  jDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  jLine: { width: 2.5, flex: 1, marginVertical: 3 },
  jContent: { flex: 1, paddingLeft: 12, paddingBottom: 14 },
  jTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  jXP: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  jReward: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  jCurrentBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 },
  jCurrentText: { fontSize: 8, fontFamily: 'Poppins_700Bold', color: '#FFF', letterSpacing: 0.5 },
  tabSwitcher: { flexDirection: 'row', gap: 8, marginBottom: 16, marginTop: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14 },
  tabBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  tabLvlBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  tabLvlText: { fontSize: 10, fontFamily: 'Poppins_700Bold' },
});