import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { Gradients } from '../constants/theme';
import { AuroraBackground } from './ui';
import { AuroraBackgroundDark } from './AuroraBackgroundDark';

export function RootBackground({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* 1. True Base Color */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#050505' : '#F7FAFC' }]} />
      
      {/* 2. Linear Gradient */}
      <LinearGradient 
        colors={[...((isDark) ? Gradients.dreamNight : Gradients.primary)]} 
        style={StyleSheet.absoluteFill} 
      />
      
      {/* 3. The Singular Global 60FPS Aurora Instance */}
      {!isDark && <AuroraBackground />}
      {isDark && <AuroraBackgroundDark />}

      {/* 4. App Screens */}
      {children}
    </View>
  );
}
