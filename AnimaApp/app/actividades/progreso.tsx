/**
 * ProgressScreen — Tu viaje emocional visualizado.
 *
 * Muestra:
 * 1. Nivel actual con barra de XP animada
 * 2. Título temático de la ruta
 * 3. Mensaje de Lumi personalizado
 * 4. Rewards desbloqueados y por desbloquear
 * 5. Timeline de hitos
 */
import React, { useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions,
} from 'react-native';
import Animated, {
  FadeInUp, FadeIn, FadeInRight,
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withSpring, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { GlassCard, SectionHeader, Mascot, FeatureButton } from '../../components/ui';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../hooks/useTheme';
import { useStore } from '../../store/useStore';
import {
  ROUTE_PROGRESSIONS,
  getCurrentLevel,
  getNextLevel,
  getLevelProgress,
  getAllRewards,
} from '../../constants/progressionSystem';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const currentPlan = useStore(s => s.currentPlan) || 'balance';
  const userXP = useStore(s => s.userXP);

  const progression = ROUTE_PROGRESSIONS[currentPlan];
  const currentLevel = useMemo(() => getCurrentLevel(currentPlan, userXP), [currentPlan, userXP]);
  const nextLevel = useMemo(() => getNextLevel(currentPlan, userXP), [currentPlan, userXP]);
  const progressPct = useMemo(() => getLevelProgress(currentPlan, userXP), [currentPlan, userXP]);
  const rewards = useMemo(() => {
    const all = getAllRewards(currentPlan, userXP);
    return all.map(r => ({ ...r, unlocked: userXP >= r.xpRequired }));
  }, [currentPlan, userXP]);

  // Animated XP bar
  const barWidth = useSharedValue(0);
  useEffect(() => {
    barWidth.value = withDelay(600, withTiming(progressPct, { duration: 1200, easing: Easing.out(Easing.exp) }));
  }, [progressPct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.max(barWidth.value * 100, 2)}%`,
  }));

  if (!progression) return null;

  const isMaxLevel = !nextLevel;
  const routeColor = progression.color;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FeatureButton icon="arrow-back" title="" color={colors.textPrimary} onPress={() => router.back()} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mi Progreso</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ─── Hero Card: Current Level ─── */}
        <Animated.View entering={FadeIn.duration(600)}>
          <GlassCard style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={[styles.levelBadge, { backgroundColor: routeColor + '20', borderColor: routeColor }]}>
                <Text style={[styles.levelNumber, { color: routeColor }]}>Lv.{currentLevel.level}</Text>
              </View>
              <View style={styles.heroInfo}>
                <Text style={[styles.heroRoute, { color: colors.textLight }]}>
                  Ruta {progression.routeName} {progression.emoji}
                </Text>
                <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                  {currentLevel.title}
                </Text>
              </View>
              <Mascot size={70} variant={'registro' as any} />
            </View>

            {/* XP Bar */}
            <View style={styles.xpSection}>
              <View style={styles.xpHeader}>
                <Text style={[styles.xpLabel, { color: colors.textLight }]}>
                  {isMaxLevel ? '¡Nivel Máximo!' : `${userXP} / ${nextLevel?.xpRequired} XP`}
                </Text>
                <Text style={[styles.xpPercent, { color: routeColor }]}>
                  {Math.round(progressPct * 100)}%
                </Text>
              </View>
              <View style={[styles.xpTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Animated.View style={[styles.xpFill, { backgroundColor: routeColor }, barStyle]} />
                {/* Glow effect */}
                <Animated.View style={[styles.xpGlow, { backgroundColor: routeColor, shadowColor: routeColor }, barStyle]} />
              </View>
              {!isMaxLevel && (
                <Text style={[styles.xpRemaining, { color: colors.textLight }]}>
                  {nextLevel!.xpRequired - userXP} XP para "{nextLevel!.title}"
                </Text>
              )}
            </View>

            {/* Lumi Message */}
            <View style={[styles.lumiMsg, { backgroundColor: routeColor + '08' }]}>
              <Ionicons name="chatbubble-ellipses" size={16} color={routeColor} />
              <Text style={[styles.lumiMsgText, { color: colors.textSecondary }]}>
                {currentLevel.lumiMessage}
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* ─── XP Sources ─── */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)}>
          <SectionHeader title="¿Cómo gano XP?" />
          <View style={styles.xpSources}>
            {[
              { icon: 'heart', label: 'Registrar ánimo', xp: '+10', color: '#F472B6' },
              { icon: 'sparkles', label: 'Completar actividad', xp: '+25', color: '#4ADE80' },
              { icon: 'star', label: 'Diario Estelar', xp: '+15', color: '#FCD34D' },
              { icon: 'flame', label: 'Racha 3+ días', xp: '+50', color: '#F97316' },
            ].map((s, i) => (
              <Animated.View key={i} entering={FadeInRight.duration(300).delay(300 + i * 80)}>
                <View style={[styles.xpSourceItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                  <View style={[styles.xpSourceIcon, { backgroundColor: s.color + '15' }]}>
                    <Ionicons name={s.icon as any} size={18} color={s.color} />
                  </View>
                  <Text style={[styles.xpSourceLabel, { color: colors.textPrimary }]}>{s.label}</Text>
                  <Text style={[styles.xpSourceValue, { color: s.color }]}>{s.xp}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ─── Rewards ─── */}
        <Animated.View entering={FadeInUp.duration(400).delay(400)}>
          <SectionHeader title="Recompensas" />
          <View style={styles.rewardsGrid}>
            {rewards.map((r, i) => (
              <Animated.View key={r.reward.id} entering={FadeInUp.duration(300).delay(500 + i * 100)}>
                <Pressable
                  onPress={() => {
                    if (r.unlocked) {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } else {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <GlassCard style={{ ...styles.rewardCard, ...(r.unlocked ? {} : { opacity: 0.5 }) }}>
                    <View style={[
                      styles.rewardIconWrap,
                      { backgroundColor: r.unlocked ? routeColor + '20' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') },
                    ]}>
                      {r.unlocked ? (
                        <Ionicons name={r.reward.icon as any} size={24} color={routeColor} />
                      ) : (
                        <Ionicons name="lock-closed" size={20} color={colors.textLight} />
                      )}
                    </View>
                    <Text style={[
                      styles.rewardName,
                      { color: r.unlocked ? colors.textPrimary : colors.textLight },
                    ]} numberOfLines={2}>
                      {r.reward.name}
                    </Text>
                    <Text style={[styles.rewardDesc, { color: colors.textLight }]} numberOfLines={2}>
                      {r.unlocked ? r.reward.description : `Nivel ${r.level} • ${r.xpRequired} XP`}
                    </Text>
                  </GlassCard>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ─── Journey Timeline ─── */}
        <Animated.View entering={FadeInUp.duration(400).delay(600)} style={{ marginBottom: 100 }}>
          <SectionHeader title="Tu Camino" />
          <View style={styles.journey}>
            {progression.levels.map((lvl, i) => {
              const isReached = userXP >= lvl.xpRequired;
              const isCurrent = lvl.level === currentLevel.level;
              return (
                <View key={lvl.level} style={styles.journeyItem}>
                  <View style={styles.journeySpine}>
                    <View style={[
                      styles.journeyDot,
                      {
                        backgroundColor: isReached ? routeColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                        borderColor: isCurrent ? routeColor : 'transparent',
                        borderWidth: isCurrent ? 3 : 0,
                        transform: [{ scale: isCurrent ? 1.3 : 1 }],
                      },
                    ]}>
                      {isReached && <Ionicons name="checkmark" size={12} color="#FFF" />}
                    </View>
                    {i < progression.levels.length - 1 && (
                      <View style={[
                        styles.journeyLine,
                        { backgroundColor: isReached ? routeColor + '40' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') },
                      ]} />
                    )}
                  </View>
                  <View style={styles.journeyContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[
                        styles.journeyTitle,
                        { color: isReached ? colors.textPrimary : colors.textLight },
                      ]}>
                        Lv.{lvl.level} — {lvl.title}
                      </Text>
                      {isCurrent && (
                        <View style={[styles.currentBadge, { backgroundColor: routeColor }]}>
                          <Text style={styles.currentBadgeText}>ACTUAL</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.journeyXP, { color: colors.textLight }]}>
                      {lvl.xpRequired === 0 ? 'Inicio' : `${lvl.xpRequired} XP`}
                    </Text>
                    {lvl.reward && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Ionicons
                          name={(isReached ? 'gift' : 'gift-outline') as any}
                          size={12}
                          color={isReached ? routeColor : colors.textLight}
                        />
                        <Text style={[styles.journeyReward, { color: isReached ? routeColor : colors.textLight }]}>
                          {lvl.reward.name}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10,
  },
  headerLeft: { flex: 1, alignItems: 'flex-start', zIndex: 10 },
  headerCenter: { flex: 3, alignItems: 'center' },
  headerRight: { flex: 1 },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  content: { paddingHorizontal: 20, paddingTop: 10 },

  // Hero Card
  heroCard: { padding: 20, marginBottom: 24 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  levelBadge: {
    width: 52, height: 52, borderRadius: 16, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  levelNumber: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  heroInfo: { flex: 1 },
  heroRoute: { fontSize: 12, fontFamily: 'Poppins_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', marginTop: 2 },

  // XP Bar
  xpSection: { marginBottom: 16 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  xpPercent: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  xpTrack: { height: 10, borderRadius: 5, overflow: 'hidden', position: 'relative' },
  xpFill: { height: '100%', borderRadius: 5, position: 'absolute', left: 0, top: 0 },
  xpGlow: {
    height: '100%', borderRadius: 5, position: 'absolute', left: 0, top: 0,
    opacity: 0.4, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8,
  },
  xpRemaining: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 6 },

  // Lumi Message
  lumiMsg: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12 },
  lumiMsgText: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', fontStyle: 'italic', lineHeight: 20 },

  // XP Sources
  xpSources: { gap: 8, marginBottom: 24 },
  xpSourceItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, gap: 12 },
  xpSourceIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  xpSourceLabel: { flex: 1, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  xpSourceValue: { fontSize: 14, fontFamily: 'Poppins_700Bold' },

  // Rewards
  rewardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  rewardCard: { width: (width - 52) / 2, padding: 16, alignItems: 'center' },
  rewardLocked: { opacity: 0.5 },
  rewardIconWrap: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  rewardName: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', marginBottom: 2 },
  rewardDesc: { fontSize: 10, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 14 },

  // Journey Timeline
  journey: { gap: 0, marginTop: 4 },
  journeyItem: { flexDirection: 'row', minHeight: 60 },
  journeySpine: { width: 32, alignItems: 'center' },
  journeyDot: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  journeyLine: { width: 2, flex: 1, marginVertical: 4 },
  journeyContent: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  journeyTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  journeyXP: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  journeyReward: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  currentBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  currentBadgeText: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: '#FFF', letterSpacing: 0.5 },
});
