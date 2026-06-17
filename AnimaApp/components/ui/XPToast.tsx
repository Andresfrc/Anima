/**
 * XPToast — Floating "+X XP" animation when XP is earned.
 *
 * Uses zustand's raw subscribe (not React hooks) for
 * bulletproof state change detection, even with persist middleware.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';

interface ToastItem {
  id: number;
  amount: number;
}

let _toastId = 0;

export default function XPToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    // Use zustand's raw subscribe — fires on EVERY state mutation
    let prevXP = useStore.getState().userXP;

    const unsub = useStore.subscribe((state) => {
      const currentXP = state.userXP;
      if (currentXP > prevXP) {
        const delta = currentXP - prevXP;
        prevXP = currentXP;
        const id = ++_toastId;
        setToasts(prev => [...prev, { id, amount: delta }]);
        // Auto-remove after animation
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 2200);
      } else {
        prevXP = currentXP;
      }
    });

    return unsub;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map(t => (
        <FloatingXP key={t.id} amount={t.amount} />
      ))}
    </View>
  );
}

function FloatingXP({ amount }: { amount: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    // Pop in
    opacity.value = withTiming(1, { duration: 250 });
    scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.back(2)) });
    // Float up and fade out
    translateY.value = withDelay(500, withTiming(-50, { duration: 1200, easing: Easing.out(Easing.quad) }));
    opacity.value = withDelay(1000, withTiming(0, { duration: 800 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.toast, animStyle]}>
      <Ionicons name="sparkles" size={14} color="#FCD34D" />
      <Text style={styles.toastText}>+{amount} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 12, 30, 0.85)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 77, 0.25)',
    shadowColor: '#FCD34D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  toastText: {
    color: '#FCD34D',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
});
