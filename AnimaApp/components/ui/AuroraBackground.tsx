/**
 * AuroraBackground — Fondo animado con blobs parallax basado en gyroscope.
 * 
 * ¿POR QUÉ se extrajo aquí?
 * Estaba en el monolito ui.tsx (1,345 líneas). Separarlo permite:
 * - Tree-shaking: solo se carga donde se usa
 * - Mantenimiento individual sin afectar otros componentes
 * - Code reviews más simples
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSpring, withSequence, Easing, interpolate, cancelAnimation,
  useAnimatedSensor, SensorType,
} from 'react-native-reanimated';
import { useStore } from '../../store/useStore';
import { useTheme } from '../../hooks/useTheme';
import { FloatingParticles } from './FloatingParticles';

const { width: SCREEN_W } = Dimensions.get('window');

export const AuroraBackground = React.memo(function AuroraBackground() {
  const { isDark } = useTheme();
  const sensor = useAnimatedSensor(SensorType.GYROSCOPE, { interval: 100 });
  const blob1Anim = useSharedValue(0);
  const blob2Anim = useSharedValue(0);
  const blob3Anim = useSharedValue(0);

  const currentPlan = useStore(s => s.currentPlan);

  const getBlobColors = () => {
    switch(currentPlan) {
      case 'ansiedad': return ['#6FA8DC', '#8A9CD8', '#86BFC6']; 
      case 'soledad':  return ['#A2C4E0', '#B0D2E6', '#BDE0EC']; 
      case 'inseguridad': return ['#9BD1B3', '#9BD1C5', '#A2D19B']; 
      case 'renacer': return ['#D1C49B', '#D1CC9B', '#D1BC9B'];
      case 'autocompasion': return ['#D19EBB', '#D1A39B', '#D19BA8'];
      case 'balance': return ['#9B9CD1', '#A99BD1', '#9BC7D1'];
      case 'descubrimiento': return ['#9BD1AA', '#9BD1BD', '#A3D19B'];
      default: return ['#5A99D4', '#9B8EC4', '#A8E6CF']; 
    }
  };

  const [color1, color2, color3] = getBlobColors();

  useEffect(() => {
    blob1Anim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    blob2Anim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 7000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    blob3Anim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    
    return () => {
      cancelAnimation(blob1Anim);
      cancelAnimation(blob2Anim);
      cancelAnimation(blob3Anim);
    };
  }, []);

  const style1 = useAnimatedStyle(() => {
    const { x, y } = sensor.sensor.value;
    return {
      transform: [
        { translateX: withSpring(y * 20 + interpolate(blob1Anim.value, [0, 1], [0, 20])) },
        { translateY: withSpring(x * 20 + interpolate(blob1Anim.value, [0, 1], [0, 20])) },
        { scale: interpolate(blob1Anim.value, [0, 1], [1, 1.1]) },
      ],
      opacity: interpolate(blob1Anim.value, [0, 1], [0.8, 0.6]),
    };
  });

  const style2 = useAnimatedStyle(() => {
    const { x, y } = sensor.sensor.value;
    return {
      transform: [
        { translateX: withSpring(y * -15 + interpolate(blob2Anim.value, [0, 1], [0, -20])) },
        { translateY: withSpring(x * -15 + interpolate(blob2Anim.value, [0, 1], [0, 20])) },
        { scale: interpolate(blob2Anim.value, [0, 1], [1, 1.15]) },
      ],
      opacity: interpolate(blob2Anim.value, [0, 1], [0.5, 0.3]),
    };
  });

  const style3 = useAnimatedStyle(() => {
    const { x, y } = sensor.sensor.value;
    return {
      transform: [
        { translateX: withSpring(y * 10) },
        { translateY: withSpring(x * 10 + interpolate(blob3Anim.value, [0, 1], [0, -15])) },
        { scale: interpolate(blob3Anim.value, [0, 1], [0.9, 1.05]) },
      ],
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.auroraBlob, isDark ? styles.blob1Dark : styles.blob1, style1, { backgroundColor: color1 }]} />
      <Animated.View style={[styles.auroraBlob, isDark ? styles.blob2Dark : styles.blob2, style2, { backgroundColor: color2 }]} />
      <Animated.View style={[styles.auroraBlob, isDark ? styles.blob3Dark : styles.blob3, style3, { backgroundColor: color3 }]} />
      <View style={styles.frostOverlay} />
      {isDark && <FloatingParticles count={15} />} 
    </View>
  );
});

const styles = StyleSheet.create({
  auroraBlob: {
    position: 'absolute',
    borderRadius: 200,
  },
  frostOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  blob1: {
    width: 300, height: 300,
    backgroundColor: 'rgba(91,155,213,0.12)',
    top: -50, right: -80,
  },
  blob2: {
    width: 250, height: 250,
    backgroundColor: 'rgba(155,142,196,0.10)',
    top: 200, left: -60,
  },
  blob3: {
    width: 220, height: 220,
    backgroundColor: 'rgba(168,230,207,0.10)',
    bottom: 80, right: -40,
  },
  blob1Dark: {
    width: 300, height: 300,
    backgroundColor: 'rgba(167,139,250,0.15)',
    top: -50, right: -80,
  },
  blob2Dark: {
    width: 250, height: 250,
    backgroundColor: 'rgba(91,155,213,0.15)',
    top: 200, left: -60,
  },
  blob3Dark: {
    width: 220, height: 220,
    backgroundColor: 'rgba(200,182,255,0.10)',
    bottom: 80, right: -40,
  },
});
