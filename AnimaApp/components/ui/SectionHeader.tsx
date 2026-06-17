/**
 * SectionHeader — Encabezado de sección reutilizable con título y subtítulo opcional.
 */
import React from 'react';
import { View, Text, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function SectionHeader({ title, subtitle, style }: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle && <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
});
