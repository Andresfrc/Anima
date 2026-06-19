/**
 * AmbientButton — Botón para ciclar sonidos ambientales (lluvia, océano, fuego, aves) y sonidos de recompensa equipados.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SoundService } from '../../utils/SoundService';
import { useTheme } from '../../hooks/useTheme';
import { useStore } from '../../store/useStore';

const REWARD_SOUNDS_MAP: Record<string, string> = {
  ren_r2: 'viento_montana',
  aut_r2: 'caja_musica',
  bal_r2: 'cuencos_tibetanos',
  des_r2: 'ruido_cosmico',
  sol_r2: 'piano_distante',
};

export function AmbientButton() {
  const { colors } = useTheme();
  const activeSound = useStore((s) => s.activeSound);
  const [mode, setMode] = useState<string>('off');
  
  const activeSoundKey = activeSound ? REWARD_SOUNDS_MAP[activeSound] : null;

  const modes = React.useMemo(() => {
    const base = ['off', 'rain', 'ocean', 'fire', 'birds'];
    if (activeSoundKey) {
      return [...base, activeSoundKey];
    }
    return base;
  }, [activeSoundKey]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    SoundService.play('click');

    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const next = modes[nextIndex];
    setMode(next);

    if (next === 'off') SoundService.stopAmbient();
    else SoundService.playAmbient(next);
  };

  const config: Record<string, { icon: string; color: string; label: string }> = {
    off: { icon: 'musical-notes-outline', color: colors.textLight, label: 'Sonidos' },
    rain: { icon: 'rainy', color: '#60A5FA', label: 'Lluvia' },
    ocean: { icon: 'water', color: '#3B82F6', label: 'Océano' },
    fire: { icon: 'flame', color: '#F97316', label: 'Fuego' },
    birds: { icon: 'leaf', color: '#10B981', label: 'Aves' },
    // Recompensas
    viento_montana: { icon: 'cloud-outline', color: '#4FD1C5', label: 'Viento' },
    caja_musica: { icon: 'star-outline', color: '#F472B6', label: 'Caja Mús.' },
    cuencos_tibetanos: { icon: 'notifications-outline', color: '#A78BFA', label: 'Cuencos' },
    ruido_cosmico: { icon: 'planet-outline', color: '#FBBF24', label: 'Cósmico' },
    piano_distante: { icon: 'musical-notes-outline', color: '#EC4899', label: 'Piano' },
  };

  const current = config[mode] || config.off;

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
