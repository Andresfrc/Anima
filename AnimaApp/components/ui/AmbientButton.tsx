/**
 * AmbientButton — Botón para ciclar sonidos ambientales (lluvia, océano, fuego, aves).
 */
import React, { useState } from 'react';
import { Text, Pressable, View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SoundService } from '../../utils/SoundService';
import { useTheme } from '../../hooks/useTheme';

type AmbientMode = 'off' | 'rain' | 'ocean' | 'fire' | 'birds';

export function AmbientButton() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<AmbientMode>('off');
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    SoundService.play('click');

    const nextMap: Record<AmbientMode, AmbientMode> = {
      off: 'rain', rain: 'ocean', ocean: 'fire', fire: 'birds', birds: 'off',
    };
    const next = nextMap[mode];
    setMode(next);

    if (next === 'off') SoundService.stopAmbient();
    else SoundService.playAmbient(next);
  };

  const config: Record<AmbientMode, { icon: string; color: string; label: string }> = {
    off: { icon: 'musical-notes-outline', color: colors.textLight, label: 'Sonidos' },
    rain: { icon: 'rainy', color: '#60A5FA', label: 'Lluvia' },
    ocean: { icon: 'water', color: '#3B82F6', label: 'Océano' },
    fire: { icon: 'flame', color: '#F97316', label: 'Fuego' },
    birds: { icon: 'leaf', color: '#10B981', label: 'Aves' },
  };

  const current = config[mode];

  return (
    <Pressable onPress={handlePress} style={styles.ambientBtn}>
      <Animated.View 
        style={[
          styles.ambientIconWrap, 
          { backgroundColor: mode === 'off' ? 'rgba(0,0,0,0.05)' : current.color + '20' }
        ]}
        entering={FadeIn}
        key={mode}
      >
        <Ionicons name={current.icon as any} size={20} color={mode === 'off' ? colors.textLight : current.color} /> 
      </Animated.View>
      <Animated.Text 
        style={[
          styles.ambientLabel, 
          { color: mode === 'off' ? colors.textLight : current.color }
        ]}
        key={mode + 'text'}
        entering={FadeIn.duration(300)}
      >
        {current.label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ambientBtn: {
    alignItems: 'center', gap: 6, marginVertical: 12,
  },
  ambientIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  ambientLabel: {
    fontSize: 11, fontWeight: '600', fontFamily: 'Poppins_600SemiBold',
  },
});
