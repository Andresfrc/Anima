/**
 * LevelUpModal — Modal de celebración cuando el usuario sube de nivel.
 * Se muestra automáticamente cuando `pendingLevelUp` tiene valor en el store.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../store/useStore';
import { useTheme } from '../../hooks/useTheme';
import { Mascot } from './index';
import { ROUTE_PROGRESSIONS } from '../../constants/progressionSystem';
import { SoundService } from '../../utils/SoundService';

export default function LevelUpModal() {
  const { colors, isDark } = useTheme();
  const pendingLevelUp = useStore((s) => s.pendingLevelUp);
  const clearLevelUp = useStore((s) => s.clearLevelUp);
  const currentPlan = useStore((s) => s.currentPlan);
  const route = ROUTE_PROGRESSIONS[currentPlan || 'balance'];

  useEffect(() => {
    if (pendingLevelUp) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      SoundService.play('pop');
    }
  }, [pendingLevelUp]);

  if (!pendingLevelUp) return null;

  const rewardType = pendingLevelUp.reward?.type;
  const rewardIcon = rewardType === 'title' ? 'ribbon' 
    : rewardType === 'sound' ? 'musical-notes' 
    : rewardType === 'breathing' ? 'water' 
    : rewardType === 'lumi_variant' ? 'star' 
    : null;

  return (
    <Modal visible={!!pendingLevelUp} transparent animationType="fade" onRequestClose={clearLevelUp}>
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(800).springify().damping(14)} style={[styles.card, { backgroundColor: isDark ? '#1A1535' : '#FFF' }]}>
          {/* Gradient accent bar */}
          <LinearGradient colors={route?.gradient || ['#FCD34D', '#F59E0B']} style={styles.accentBar} />

          {/* Mascot */}
          <Animated.View entering={FadeInUp.delay(400).duration(700)}>
            <Mascot size={120} variant="levelup" />
          </Animated.View>

          {/* Level badge */}
          <Animated.View entering={FadeInUp.delay(600).duration(600)} style={[styles.levelBadge, { backgroundColor: pendingLevelUp.color + '20', borderColor: pendingLevelUp.color }]}>
            <Ionicons name={pendingLevelUp.icon as any} size={20} color={pendingLevelUp.color} />
            <Text style={[styles.levelBadgeText, { color: pendingLevelUp.color }]}>Nivel {pendingLevelUp.level}</Text>
          </Animated.View>

          {/* Title */}
          <Animated.Text entering={FadeInUp.delay(800).duration(600)} style={[styles.title, { color: colors.textPrimary }]}>
            ¡{pendingLevelUp.title}!
          </Animated.Text>

          {/* Lumi message */}
          <Animated.Text entering={FadeInUp.delay(1000).duration(600)} style={[styles.message, { color: colors.textSecondary }]}>
            {pendingLevelUp.lumiMessage}
          </Animated.Text>

          {/* Reward (if any) */}
          {pendingLevelUp.reward && (
            <Animated.View entering={FadeInUp.delay(1200).duration(600)} style={[styles.rewardCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(252,211,77,0.08)' }]}>
              <View style={styles.rewardHeader}>
                <Ionicons name="gift-outline" size={16} color="#FCD34D" />
                <Text style={[styles.rewardLabel, { color: '#FCD34D' }]}>RECOMPENSA DESBLOQUEADA</Text>
              </View>
              <View style={styles.rewardContent}>
                {rewardIcon && <Ionicons name={rewardIcon as any} size={22} color={pendingLevelUp.color} />}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rewardName, { color: colors.textPrimary }]}>{pendingLevelUp.reward.name}</Text>
                  <Text style={[styles.rewardDesc, { color: colors.textLight }]}>{pendingLevelUp.reward.description}</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Close button */}
          <Animated.View entering={FadeInUp.delay(1400).duration(600)} style={{ width: '100%', marginTop: 16 }}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                clearLevelUp();
              }}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            >
              <LinearGradient colors={route?.gradient || ['#FCD34D', '#F59E0B']} style={styles.closeBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.closeBtnText}>¡Genial!</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  card: {
    width: '85%', maxWidth: 360, borderRadius: 28, padding: 28,
    alignItems: 'center', gap: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 15,
  },
  accentBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
  },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5,
  },
  levelBadgeText: {
    fontSize: 14, fontFamily: 'Poppins_700Bold',
  },
  title: {
    fontSize: 24, fontFamily: 'Poppins_700Bold', textAlign: 'center',
  },
  message: {
    fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center',
    lineHeight: 20, paddingHorizontal: 8,
  },
  rewardCard: {
    width: '100%', borderRadius: 16, padding: 14, gap: 10, marginTop: 4,
  },
  rewardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  rewardLabel: {
    fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 1,
  },
  rewardContent: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  rewardName: {
    fontSize: 14, fontFamily: 'Poppins_600SemiBold',
  },
  rewardDesc: {
    fontSize: 12, fontFamily: 'Poppins_400Regular',
  },
  closeBtn: {
    borderRadius: 16, overflow: 'hidden',
  },
  closeBtnGradient: {
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    borderRadius: 16,
  },
  closeBtnText: {
    color: '#FFF', fontSize: 16, fontFamily: 'Poppins_700Bold',
  },
});
