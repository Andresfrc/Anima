/**
 * FeatureButton — Botón de acceso rápido para el dashboard principal.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SoundService } from '../../utils/SoundService';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/theme';

interface FeatureButtonProps {
  title: string;
  icon: string;
  color: string;
  onPress?: () => void;
}

export function FeatureButton({ title, icon, color, onPress }: FeatureButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        SoundService.play('click');
        onPress && onPress();
      }}
      style={styles.featureBtn}
    >
      <View style={[styles.featureIconWrap, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.featureBtnText, { color: colors.textPrimary }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  featureBtn: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  featureIconWrap: {
    width: 56, height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureBtnText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
});
