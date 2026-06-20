import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Image } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { Colors, DAILY_AFFIRMATIONS, MoodConfig } from '../../constants/theme';
import {
  GlassCard, MoodButton, JewelButton,
  Mascot, SectionHeader, FeatureButton, AmbientButton, WeeklyProgressRing, MicroChallengeCard, ConnectionRadarCard,
} from '../../components/ui';
import { useTheme } from '../../hooks/useTheme';
import { useStore, MoodType } from '../../store/useStore';
import { EMOTIONAL_ROUTES } from '../../constants/clinicalContent';
import { getAvatarSource } from '../../constants/avatars';
import { supabase } from '../../lib/supabase';
import { syncUserDataFromSupabase, saveMoodToSupabase } from '../../utils/supabaseSync';
import { ROUTE_PROGRESSIONS } from '../../constants/progressionSystem';

const NOTIFICATIONS_MOCK = [
  { id: '1', title: '¡Bienvenido a Anima!', desc: 'Nos alegra tenerte aquí. Recuerda revisar tu plan diario.', time: 'Hace 2h' },
  { id: '2', title: 'Tiempo de Pausa', desc: 'Tomarse 5 minutos para respirar ayuda mucho.', time: 'Hace 5h' },
];

function getLocalToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const { colors, isDark } = useTheme();
  const userName = useStore((s) => s.userName);
  const currentMood = useStore((s) => s.currentMood);
  const setMood = useStore((s) => s.setMood);
  const saveMoodEntry = useStore((s) => s.saveMoodEntry);
  const recentActivities = useStore((s) => s.recentActivities);
  const weeklyMoodData = useStore((s) => s.weeklyMoodData);
  const currentPlan = useStore((s) => s.currentPlan);
  const moodHistory = useStore((s) => s.moodHistory);
  const profileAvatar = useStore((s) => s.profileAvatar);
  const avatarSource = getAvatarSource(profileAvatar);
  const activeTitle = useStore((s) => s.activeTitle);
  const activeRoute = EMOTIONAL_ROUTES.find(r => r.id === currentPlan);

  const activeTitleName = useMemo(() => {
    if (!activeTitle) return null;
    for (const route of Object.values(ROUTE_PROGRESSIONS)) {
      for (const lvl of route.levels) {
        if (lvl.reward?.id === activeTitle) return lvl.reward.name;
      }
    }
    return null;
  }, [activeTitle]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showXPGain, setShowXPGain] = useState(false);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [microCompleted, setMicroCompleted] = useState<any[]>([]);
  const [energyCompleted, setEnergyCompleted] = useState<any[]>([]);

  // ── Verificar si ya registró ánimo hoy ────────────────────────────────────
  const alreadyLoggedMoodToday = useMemo(() => {
    const todayStr = getLocalToday();
    return moodHistory.some((entry) => {
      if (!entry.date) return false;
      try {
        const d = new Date(entry.date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}` === todayStr;
      } catch { return false; }
    });
  }, [moodHistory]);

  const todayMoodEntry = useMemo(() => {
    const todayStr = getLocalToday();
    return moodHistory.find((entry) => {
      if (!entry.date) return false;
      try {
        const d = new Date(entry.date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}` === todayStr;
      } catch { return false; }
    });
  }, [moodHistory]);

  // ── FIX: cargar TODO en paralelo al montar ────────────────────────────────
  // Antes: userId → (esperar) → micro → (esperar) → energy → renderiza
  // Ahora: userId → todo en paralelo → renderiza  (~2x más rápido)
  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      const today = getLocalToday();

      await Promise.all([
        // Historial de mood + progreso XP
        syncUserDataFromSupabase(user.id),

        // Micro retos de hoy
        supabase.from('micro_challenges')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(20)
          .then(({ data }) => {
            if (data) {
              const todayRecords = data.filter(i => i.date?.substring(0, 10) === today);
              console.log(`[MICRO] hoy: ${today} | registros: ${todayRecords.length}`);
              setMicroCompleted(todayRecords);
            }
          }),

        // Energy tasks de hoy
        supabase.from('energy_tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
          .then(({ data }) => {
            if (data) {
              const todayRecords = data.filter(i => i.created_at?.substring(0, 10) === today);
              console.log(`[ENERGY] hoy: ${today} | registros: ${todayRecords.length}`);
              setEnergyCompleted(todayRecords);
            }
          }),

        // Mood semanal
        supabase.from('mood_logs')
          .select('mood, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(7)
          .then(({ data, error }) => {
            if (!error && data) {
              const moodToScore: Record<string, number> = { animado: 5, mejor: 4, neutral: 3, triste: 2, muy_triste: 1 };
              useStore.setState({ weeklyMoodData: data.map((d) => moodToScore[d.mood] ?? 3).reverse() });
            }
          }),

        // Actividades recientes
        supabase.from('activity_logs')
          .select('activity_name, activity_id, started_at, completed')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(5)
          .then(({ data, error }) => {
            if (error || !data) return;
            const iconMap: Record<string, { icon: string; color: string }> = {
              '1': { icon: 'water-outline', color: '#87CEEB' }, '2': { icon: 'star-outline', color: '#FCD34D' },
              '3': { icon: 'leaf-outline', color: '#A8E6CF' }, '4': { icon: 'eye-outline', color: '#B39DDB' },
              '5': { icon: 'heart-outline', color: '#E56B8A' }, '6': { icon: 'timer-outline', color: '#F6AD55' },
              '7': { icon: 'book-outline', color: '#68D391' }, '8': { icon: 'trophy-outline', color: '#FCD34D' },
              '9': { icon: 'hand-left-outline', color: '#B39DDB' }, '10': { icon: 'mail-outline', color: '#87CEEB' },
            };
            const mapped = data.map((log) => {
              const meta = iconMap[log.activity_id] ?? { icon: 'checkmark-circle-outline', color: '#38B2AC' };
              const diffMin = Math.floor((Date.now() - new Date(log.started_at).getTime()) / 60000);
              const time = diffMin < 60 ? `Hace ${diffMin} min` : diffMin < 1440 ? `Hace ${Math.floor(diffMin / 60)}h` : `Hace ${Math.floor(diffMin / 1440)}d`;
              return { title: log.activity_name, time, detail: log.completed ? 'Completada' : 'En progreso', icon: meta.icon, color: meta.color };
            });
            useStore.setState({ recentActivities: mapped });
          }),
      ]);
    };

    initData();

    // Auth state change (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        await syncUserDataFromSupabase(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  // ── Scroll a mood ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const scrollToMood = useStore.getState()._scrollToMood;
      if (scrollToMood && scrollViewRef.current) {
        setTimeout(() => { scrollViewRef.current?.scrollTo({ y: 900, animated: true }); useStore.setState({ _scrollToMood: false }); }, 100);
      }
    });
    return unsubscribe;
  }, [navigation]);

  // ── Guardar micro reto ────────────────────────────────────────────────────
  const saveMicroChallenge = async (challengeId: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = getLocalToday();
    const alreadyDone = microCompleted.some(item => item.date?.substring(0, 10) === today);
    if (alreadyDone) { console.log('⚠️ YA EXISTE HOY (micro)'); return; }

    const localISO = getLocalISOString();
    const { data, error } = await supabase
      .from('micro_challenges')
      .insert({ user_id: user.id, challenge_id: challengeId, completed: true, date: localISO })
      .select();

    if (error) { console.log('INSERT MICRO ERROR:', error); return; }
    console.log('[MICRO] ✅ Guardado');
    if (data) setMicroCompleted((prev) => [...prev, ...data]);
  };

  // ── Guardar energy task ───────────────────────────────────────────────────
  const saveEnergyTask = async (taskName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = getLocalToday();
      const alreadyDone = energyCompleted.some(
        item => item.task_name === taskName && item.created_at?.substring(0, 10) === today
      );
      if (alreadyDone) { console.log('⚠️ YA EXISTE ESTA TASK HOY'); return; }

      const localISO = getLocalISOString();
      const { data, error } = await supabase
        .from('energy_tasks')
        .insert({ user_id: user.id, task_name: taskName, completed: true, created_at: localISO })
        .select();

      if (error) { console.log('INSERT ENERGY ERROR:', error); return; }
      console.log('[ENERGY] ✅ Guardado');
      if (data) setEnergyCompleted((prev) => [...prev, ...data]);
    } catch (err) {
      console.log('Error energía:', err);
    }
  };

  // ── Registrar mood ────────────────────────────────────────────────────────
  const handleRegisterMood = useCallback(async () => {
    if (!currentMood || alreadyLoggedMoodToday) return;
    await saveMoodEntry();
    setShowXPGain(true);
    setTimeout(() => setShowXPGain(false), 1500);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await saveMoodToSupabase(user.id, currentMood);
    } catch (err) {
      console.log('Error guardando mood:', err);
    }
  }, [currentMood, saveMoodEntry, alreadyLoggedMoodToday]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const affirmation = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const quoteArray = (activeRoute as any)?.dailyQuotes ?? DAILY_AFFIRMATIONS;
    return quoteArray[dayOfYear % quoteArray.length];
  }, [activeRoute]);

  const moods: MoodType[] = ['animado', 'mejor', 'neutral', 'triste', 'muy_triste'];

  const welcomeSubtitle = useMemo(() => {
    switch (currentPlan) {
      case 'ansiedad': return 'Respira profundo, estoy aquí contigo 🍃';
      case 'soledad': return 'Me alegra mucho verte hoy 🫂';
      case 'inseguridad': return 'Eres más fuerte de lo que crees 🌟';
      default: return '¿En qué quieres trabajar hoy?';
    }
  }, [currentPlan]);

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={[styles.greeting, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
              {greeting}, {userName || 'amigo/a'} 👋
            </Text>
            {activeTitleName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, marginBottom: 2 }}>
                <Ionicons name="ribbon" size={12} color={colors.primary} />
                <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.primary }}>
                  {activeTitleName.replace('Título: ', '')}
                </Text>
              </View>
            )}
            <Text style={[styles.subtitle, { color: colors.textLight }]}>{welcomeSubtitle}</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Pressable style={[styles.notifBtn, { backgroundColor: colors.bgCard, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]} onPress={() => setShowNotifications(true)}>
              <View style={styles.notifDot} />
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            </Pressable>
            <AmbientButton />
            {avatarSource && (
              <Pressable onPress={() => router.push('/(tabs)/perfil')}>
                <Image source={avatarSource} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.primary }} resizeMode="cover" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Mascot */}
        <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.mascotSection}>
          <Mascot size={130} variant="greeting" />
        </Animated.View>

        {/* Feature buttons */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.featureRow}>
          <FeatureButton title="Diario" icon="star-outline" color="#FCD34D" onPress={() => router.push('/actividades/gratitud')} />
          <FeatureButton title="Actividades" icon="sparkles-outline" color={Colors.secondary} onPress={() => router.push('/(tabs)/actividades')} />
          <FeatureButton title="Chat" icon="chatbubbles-outline" color={Colors.mint} onPress={() => router.push('/(tabs)/chat')} />
        </Animated.View>

        {/* Daily Affirmation */}
        <Animated.View entering={FadeInUp.duration(400).delay(400)}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <SectionHeader title={activeRoute ? `Tu ruta: ${activeRoute.title}` : 'Frase del día'} subtitle="Tu inspiración diaria ✨" style={{ marginBottom: 0, flex: 1 }} />
            {activeRoute && (
              <Pressable onPress={() => setShowRouteInfo(true)} style={({ pressed }) => [{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center', marginLeft: 10 }, pressed && { opacity: 0.7 }]}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textLight} />
              </Pressable>
            )}
          </View>
          <GlassCard style={styles.affirmationCard}>
            <View style={styles.affirmationIconWrap}><Ionicons name="sparkles" size={16} color={colors.accent} /></View>
            <Text style={[styles.affirmationText, { color: colors.textSecondary }]}>{affirmation}</Text>
          </GlassCard>
        </Animated.View>

        {/* Micro-Challenge */}
        <Animated.View entering={FadeInUp.duration(400).delay(450)}>
          <SectionHeader title="Rompiendo el Bucle" subtitle="Tu micro-reto de hoy" />
          <MicroChallengeCard
            completedData={microCompleted}
            onComplete={(challengeId) => { void saveMicroChallenge(challengeId); }}
          />
        </Animated.View>

        {/* Connection Radar */}
        <Animated.View entering={FadeInUp.duration(400).delay(480)}>
          <SectionHeader title="Radar de Conexión" subtitle="Citas contigo mismo" />
          <ConnectionRadarCard
            completedData={energyCompleted}
            onComplete={(task) => { void saveEnergyTask(task); }}
          />
        </Animated.View>

        {/* Mood Selector */}
        <Animated.View entering={FadeInUp.duration(400).delay(500)}>
          <SectionHeader
            title="¿Cómo te sientes?"
            subtitle={alreadyLoggedMoodToday ? 'Tu bienestar de hoy está al día' : 'Selecciona tu estado de ánimo'}
          />
          {alreadyLoggedMoodToday && todayMoodEntry ? (
            <GlassCard style={styles.moodCard}>
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <View style={{
                  width: 56, height: 56, borderRadius: 28,
                  backgroundColor: (MoodConfig[todayMoodEntry.mood]?.color || colors.primary) + '15',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                }}>
                  <Text style={{ fontSize: 28 }}>{MoodConfig[todayMoodEntry.mood]?.emoji || '✨'}</Text>
                </View>
                <Text style={[styles.moodLoggedTitle, { color: colors.textPrimary }]}>
                  Hoy registraste: {MoodConfig[todayMoodEntry.mood]?.label}
                </Text>
                <Text style={[styles.moodLoggedSub, { color: colors.textLight }]}>
                  ¡Gracias por compartir tu sentir hoy! Vuelve mañana para seguir cuidando de ti. 🌱
                </Text>
              </View>
            </GlassCard>
          ) : (
            <GlassCard style={styles.moodCard}>
              <View style={styles.moodRow}>
                {moods.map((m) => (<MoodButton key={m} mood={m} selected={currentMood === m} onPress={() => setMood(m)} />))}
              </View>
              {showXPGain ? (
                <Animated.View entering={FadeIn.duration(300)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(252, 211, 77, 0.15)', paddingVertical: 14, borderRadius: 20, marginTop: 16 }}>
                  <Ionicons name="sparkles" size={20} color="#FCD34D" />
                  <Text style={{ color: '#FCD34D', fontSize: 18, fontFamily: 'Poppins_700Bold' }}>+10 XP</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: 'Poppins_500Medium' }}>¡Registrado!</Text>
                </Animated.View>
              ) : (
                <JewelButton title="Registrar estado de ánimo" onPress={handleRegisterMood} disabled={!currentMood} style={{ marginTop: 16 }} />
              )}
            </GlassCard>
          )}
        </Animated.View>

        {/* Recent Activities */}
        <Animated.View entering={FadeInUp.duration(400).delay(600)}>
          <SectionHeader title="Actividades recientes" />
          {recentActivities.length > 0 ? (
            recentActivities.slice(0, 3).map((act, i) => (
              <GlassCard key={i} style={styles.recentCard}>
                <View style={[styles.recentIcon, { backgroundColor: (act.color || colors.primary) + '15' }]}>
                  <Ionicons name={(act.icon || 'time-outline') as any} size={20} color={act.color || colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.recentTitle, { color: colors.textPrimary }]}>{act.title}</Text>
                  <Text style={[styles.recentTime, { color: colors.textLight }]}>{act.time}</Text>
                </View>
                <Text style={styles.recentDetail}>{act.detail}</Text>
              </GlassCard>
            ))
          ) : (
            <GlassCard style={{ alignItems: 'center', paddingVertical: 20, gap: 6 }}>
              <Ionicons name="time-outline" size={28} color={colors.textLight} />
              <Text style={{ color: colors.textLight, fontSize: 13 }}>Sin actividades recientes</Text>
            </GlassCard>
          )}
        </Animated.View>

        {/* Weekly Wellness Ring */}
        <Animated.View entering={FadeInUp.duration(400).delay(600)}>
          <SectionHeader title="Bienestar Semanal" />
          <GlassCard style={{ alignItems: 'center', paddingVertical: 20 }}>
            <WeeklyProgressRing data={weeklyMoodData} />
            <Text style={{ textAlign: 'center', marginTop: 12, color: colors.textLight, fontSize: 13, maxWidth: 200 }}>Tu balance emocional de los últimos 7 días.</Text>
          </GlassCard>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(300)} style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Notificaciones</Text>
              <Pressable onPress={() => setShowNotifications(false)} style={styles.closeBtn}><Ionicons name="close" size={24} color={colors.textLight} /></Pressable>
            </View>
            <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false}>
              {NOTIFICATIONS_MOCK.map((notif, index) => (
                <View key={notif.id} style={[styles.notifItem, index < NOTIFICATIONS_MOCK.length - 1 && { borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)' }]}>
                  <View style={[styles.notifIconWrap, { backgroundColor: Colors.mint + '20' }]}><Ionicons name="notifications" size={20} color={Colors.mint} /></View>
                  <View style={styles.notifTextWrap}>
                    <Text style={[styles.notifItemTitle, { color: colors.textPrimary }]}>{notif.title}</Text>
                    <Text style={[styles.notifItemDesc, { color: colors.textSecondary }]}>{notif.desc}</Text>
                    <Text style={[styles.notifItemTime, { color: colors.textLight }]}>{notif.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Route Info Modal */}
      {activeRoute && (
        <Modal visible={showRouteInfo} transparent animationType="fade" onRequestClose={() => setShowRouteInfo(false)}>
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInUp.duration(300)} style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
              <View style={[styles.modalHeader, { borderBottomWidth: 0, marginBottom: 10 }]}>
                <View style={[styles.notifIconWrap, { backgroundColor: activeRoute.color + '20' }]}><Ionicons name={activeRoute.icon as any} size={24} color={activeRoute.color} /></View>
                <Pressable onPress={() => setShowRouteInfo(false)} style={styles.closeBtn}><Ionicons name="close" size={24} color={colors.textLight} /></Pressable>
              </View>
              <Text style={[styles.modalTitle, { color: colors.textPrimary, fontSize: 22 }]}>{activeRoute.title}</Text>
              <Text style={[{ color: activeRoute.color, fontFamily: 'Poppins_600SemiBold', marginBottom: 16 }]}>{activeRoute.subtitle}</Text>
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                <Text style={[{ color: colors.textSecondary, marginBottom: 20, lineHeight: 22, fontFamily: 'Poppins_400Regular' }]}>{activeRoute.description}</Text>
                <Text style={[{ color: colors.textPrimary, fontFamily: 'Poppins_600SemiBold', marginBottom: 8 }]}>Área de Enfoque</Text>
                <Text style={[{ color: colors.textSecondary, marginBottom: 16, fontFamily: 'Poppins_400Regular' }]}>{activeRoute.focusArea}</Text>
                <Text style={[{ color: colors.textPrimary, fontFamily: 'Poppins_600SemiBold', marginBottom: 8 }]}>Estrategias</Text>
                {activeRoute.strategies.map((strategy: string, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                    <Ionicons name="checkmark-circle" size={18} color={activeRoute.color} style={{ marginTop: 2 }} />
                    <Text style={[{ color: colors.textSecondary, flex: 1, fontFamily: 'Poppins_400Regular', lineHeight: 20 }]}>{strategy}</Text>
                  </View>
                ))}
              </ScrollView>
              <JewelButton title="Entendido" onPress={() => setShowRouteInfo(false)} style={{ marginTop: 24, width: '100%' }} />
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Poppins_700Bold' },
  subtitle: { fontSize: 14, color: Colors.textLight, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  notifBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', borderWidth: 1, shadowColor: '#5B9BD5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  notifDot: { position: 'absolute', top: 10, right: 11, width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent, zIndex: 1 },
  mascotSection: { alignItems: 'center', marginVertical: 16 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  affirmationCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  affirmationIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.accent + '15', justifyContent: 'center', alignItems: 'center' },
  affirmationText: { flex: 1, fontSize: 13, color: Colors.textSecondary, fontFamily: 'Poppins_400Regular', fontStyle: 'italic', lineHeight: 20 },
  moodCard: { marginBottom: 24 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-around' },
  moodLoggedTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 6 },
  moodLoggedSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 18, paddingHorizontal: 12 },
  recentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  recentIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  recentTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, fontFamily: 'Poppins_600SemiBold' },
  recentTime: { fontSize: 11, color: Colors.textLight },
  recentDetail: { fontSize: 12, color: Colors.mint, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '80%', borderRadius: 24, padding: 24, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  closeBtn: { padding: 4 },
  notifList: { maxHeight: 400 },
  notifItem: { flexDirection: 'row', gap: 16, paddingVertical: 16 },
  notifIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  notifTextWrap: { flex: 1 },
  notifItemTitle: { fontSize: 15, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  notifItemDesc: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20, marginBottom: 6 },
  notifItemTime: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
});