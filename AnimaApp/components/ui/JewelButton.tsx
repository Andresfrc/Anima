/**
 * JewelButton — Botón premium con gradiente, animación spring y feedback háptico.
 */
import React from 'react';
import { Text, Pressable, ViewStyle, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SoundService } from '../../utils/SoundService';
import { Gradients, BorderRadius, Shadows } from '../../constants/theme';

interface JewelButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  colors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
  disabled?: boolean;
}

export function JewelButton({ title, onPress, icon, colors, style, disabled }: JewelButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        console.log("🔥 BOTON PRESIONADO");

        if (disabled) {
          console.log("❌ BOTON DESHABILITADO");
          return;
        }

        console.log("✅ EJECUTANDO onPress");

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        SoundService.play('click');

        onPress(); // ← aquí se ejecuta el alert o función que le mandes
      }}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      disabled={disabled}
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <Animated.View style={animStyle}>
        <LinearGradient
          colors={(colors as [string, string, ...string[]]) || [...Gradients.jewel]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.jewelButton, style]}
        >
          {icon && (
            <Ionicons
              name={icon as any}
              size={20}
              color="#FFF"
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={styles.jewelButtonText}>{title}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  jewelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.full,
    ...Shadows.glow,
  },
  jewelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
});