/**
 * GlassCard — Tarjeta con efecto glassmorphism, animación spring al presionar,
 * haptic feedback y sonido de click.
 * 
 * ¿POR QUÉ se extrajo aquí?
 * Es el componente UI más reutilizado de toda la app (~30+ usos).
 * Tenerlo en su propio archivo facilita mejorarlo sin tocar otros componentes.
 */
import React from 'react';
import { View, Pressable, ViewStyle, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SoundService } from '../../utils/SoundService';
import { useTheme } from '../../hooks/useTheme';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  intensity?: number;
}

export function GlassCard({ children, style, onPress, intensity = 50 }: GlassCardProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => { if (onPress) scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }); };
  const handlePressOut = () => { if (onPress) scale.value = withSpring(1, { damping: 15, stiffness: 200 }); };

  const Content = (
    <Animated.View style={[
      styles.glassCard, 
      animStyle, 
      style, 
      { 
        backgroundColor: colors.bgCard,
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
      }  
    ]}>
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          SoundService.play('click');
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {Content}
      </Pressable>
    );
  }
  return Content;
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    ...Shadows.small,
  },
});
