/**
 * MoodButton — Botón de estado de ánimo con animación spring e ícono vectorial.
 * 
 * FIX: Se corrigió el bug donde scale.value se asignaba en el cuerpo del render
 * (causando re-ejecución en cada render). Ahora usa useEffect correctamente.
 */
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SoundService } from '../../utils/SoundService';
import { useTheme } from '../../hooks/useTheme';
import { Colors, MoodConfig, MoodType } from '../../constants/theme';

interface MoodButtonProps {
  mood: MoodType;
  selected: boolean;
  onPress: () => void;
}

export function MoodButton({ mood, selected, onPress }: MoodButtonProps) {
  const { colors } = useTheme();
  const config = MoodConfig[mood];
  
  // FIX: Movido a useEffect para evitar re-ejecutar en cada render
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(selected ? 1.15 : 1, { damping: 12, stiffness: 150 });
  }, [selected]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={() => {
      SoundService.play('click');
      onPress();
    }} style={styles.moodButtonWrap}>
      <Animated.View style={[styles.moodButton, animStyle]}>
        <View style={[
          styles.moodIconCircle,
          selected
            ? { backgroundColor: config.color + '18', borderColor: config.color, borderWidth: 2 }
            : { backgroundColor: colors.bgCard, borderColor: colors.textLight + '20', borderWidth: 1.5 },
        ]}>
          <Ionicons name={config.icon as any} size={22} color={selected ? config.color : colors.textLight} />
        </View>
        {selected && <View style={[styles.moodDotIndicator, { backgroundColor: config.color }]} />}
      </Animated.View>
      <Text style={[
        styles.moodLabel,
        selected ? { color: config.color, fontWeight: '700' } : { color: colors.textSecondary },
      ]}>{config.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  moodButtonWrap: { alignItems: 'center', gap: 6 },
  moodButton: {
    width: 52, height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodIconCircle: {
    width: 48, height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodDotIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 6, height: 6, borderRadius: 3,
  },
  moodLabel: {
    fontSize: 10, color: Colors.textLight,
    fontFamily: 'Poppins_500Medium',
  },
});
