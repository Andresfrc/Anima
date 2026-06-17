/**
 * FloatingParticles — Partículas flotantes decorativas con persistencia opcional.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, withDelay, Easing, cancelAnimation,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface FloatingParticlesProps {
  count?: number;
  persistenceKey?: string;
}

export function FloatingParticles({ count = 6, persistenceKey }: FloatingParticlesProps) {
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!persistenceKey) {
      setPositions(Array.from({ length: count }).map((_, i) => ({
        x: 20 + (i * (SCREEN_W - 40)) / count,
        y: 200 + Math.random() * 200,
      })));
      setLoaded(true);
      return;
    }

    const loadPositions = async () => {
      try {
        const stored = await AsyncStorage.getItem(persistenceKey);
        if (stored) {
          setPositions(JSON.parse(stored));
        } else {
          const newPositions = Array.from({ length: count }).map(() => ({
            x: Math.random() * (SCREEN_W - 40) + 20,
            y: Math.random() * (SCREEN_H - 100) + 50,
          }));
          setPositions(newPositions);
          await AsyncStorage.setItem(persistenceKey, JSON.stringify(newPositions));
        }
      } catch (e) {
        console.warn('Failed to load particle positions', e);
      } finally {
        setLoaded(true);
      }
    };

    loadPositions();
  }, [persistenceKey, count]);

  if (!loaded) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {positions.map((pos, i) => (
        <Particle key={i} index={i} initialX={pos.x} initialY={pos.y} />
      ))}
    </View>
  );
}

function Particle({ index, initialX, initialY }: { index: number; initialX?: number; initialY?: number }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 500;
    const duration = 4000 + Math.random() * 3000;
    translateY.value = withDelay(delay, withRepeat(
      withTiming(-60 - Math.random() * 40, { duration, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
    translateX.value = withDelay(delay, withRepeat(
      withTiming(20 - Math.random() * 40, { duration: duration * 0.7, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.6, { duration: duration * 0.3 }),
        withTiming(0, { duration: duration * 0.7 }),
      ),
      -1
    ));
    
    return () => {
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(opacity);
    };
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const left = initialX ?? (20 + (index * (SCREEN_W - 40)) / 6);
  const top = initialY ?? (200 + Math.random() * 200);
  const size = 4 + Math.random() * 4;
  const particleColors = [Colors.primary, Colors.mint, Colors.secondary, Colors.accent];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left, top,
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: particleColors[index % particleColors.length],
        },
        style,
      ]}
    />
  );
}
