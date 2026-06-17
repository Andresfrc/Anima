import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  Easing,
  interpolateColor
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface HapticGroundingProps {
  onComplete: () => void;
}

export function HapticGrounding({ onComplete }: HapticGroundingProps) {
  const [completedOrbs, setCompletedOrbs] = useState<number[]>([]);

  useEffect(() => {
    if (completedOrbs.length === 4) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(onComplete, 1000);
    }
  }, [completedOrbs]);

  const handleOrbComplete = (id: number) => {
    if (!completedOrbs.includes(id)) {
      setCompletedOrbs(prev => [...prev, id]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {[1, 2, 3, 4].map((id) => (
          <HapticOrb 
            key={id} 
            isCompleted={completedOrbs.includes(id)} 
            onComplete={() => handleOrbComplete(id)} 
          />
        ))}
      </View>
    </View>
  );
}

function HapticOrb({ isCompleted, onComplete }: { isCompleted: boolean, onComplete: () => void }) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const hapticInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePressIn = () => {
    if (isCompleted) return;
    
    scale.value = withSpring(0.9);
    progress.value = withTiming(1, { duration: 3000, easing: Easing.linear });

    // Start rhythmic heartbeat haptics while holding
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hapticInterval.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Check if finished via the shared value (approximate check in interval)
      if (progress.value >= 0.95) {
        clearInterval(hapticInterval.current!);
        onComplete();
        progress.value = withTiming(1, { duration: 100 });
      }
    }, 400); // Heartbeat pace
  };

  const handlePressOut = () => {
    if (isCompleted) return;
    
    scale.value = withSpring(1);
    // If they let go before 100%, reset the progress
    if (progress.value < 1) {
      progress.value = withTiming(0, { duration: 300 });
      if (hapticInterval.current) {
        clearInterval(hapticInterval.current);
      }
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (hapticInterval.current) clearInterval(hapticInterval.current);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.05)', 'rgba(56, 189, 248, 0.4)']
    );
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: isCompleted ? 'rgba(56, 189, 248, 0.6)' : bgColor,
      borderColor: isCompleted ? 'rgba(56, 189, 248, 0.8)' : 'rgba(255,255,255,0.2)'
    };
  });

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isCompleted}
    >
      <Animated.View style={[styles.orb, animatedStyle]}>
        <Ionicons 
          name={isCompleted ? "checkmark" : "finger-print"} 
          size={36} 
          color={isCompleted ? "#FFFFFF" : "rgba(255,255,255,0.5)"} 
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 30,
    width: 280,
  },
  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
