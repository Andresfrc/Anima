import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withSequence, withRepeat, Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AuroraBackground } from './ui';
import { Colors, Gradients, Shadows } from '../constants/theme';

const mascotImage = require('../assets/images/mascot/saludando.png');

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const BUBBLE_COUNT = 8;

/**
 * Burbuja flotante del splash. Cada una posee sus propios hooks de animación.
 * FIX: antes los hooks (useSharedValue/useAnimatedStyle) se llamaban dentro de un
 * .map() en el componente padre, violando las reglas de hooks de React.
 */
function Bubble({ index }: { index: number }) {
  const x = useSharedValue(Math.random() * width);
  const y = useSharedValue(height);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const size = useMemo(() => 8 + Math.random() * 12, []);

  useEffect(() => {
    const delay = 500 + index * 200;
    opacity.value = withDelay(delay, withTiming(0.5, { duration: 600 }));
    scale.value = withDelay(delay, withTiming(1, { duration: 600 }));
    y.value = withDelay(
      delay,
      withTiming(Math.random() * height * 0.6, { duration: 2500, easing: Easing.out(Easing.ease) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    top: y.value,
    left: x.value,
  }));

  return (
    <Animated.View
      style={[styles.bubble, { width: size, height: size, borderRadius: size / 2 }, bStyle]}
    />
  );
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const mascotScale = useSharedValue(0);
  const mascotY = useSharedValue(30);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.6);
  const glowOpacity = useSharedValue(0);
  const mainOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Glow appears
    glowScale.value = withTiming(1.2, { duration: 1200, easing: Easing.out(Easing.ease) });
    glowOpacity.value = withTiming(0.6, { duration: 1000 });

    // 2. Mascot scales in
    mascotScale.value = withDelay(300, withSequence(
      withTiming(1.1, { duration: 500, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 200 }),
    ));
    mascotY.value = withDelay(300, withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }));

    // 3. Title fades in
    titleOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(700, withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }));

    // 4. Subtitle fades in
    subtitleOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));

    // 5. Las burbujas se animan solas dentro del componente Bubble.

    // 6. Pulsing glow
    glowScale.value = withDelay(1500, withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ), 2
    ));

    // 7. Fade out and finish
    mainOpacity.value = withDelay(3200, withTiming(0, { duration: 600 }, (finished) => {
      if (finished) runOnJS(onFinish)();
    }));
  }, []);

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }, { translateY: mascotY.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const mainFade = useAnimatedStyle(() => ({
    opacity: mainOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, mainFade]}>
      <LinearGradient colors={[...Gradients.splash]} style={StyleSheet.absoluteFill} />
      <AuroraBackground />

      {/* Floating bubbles */}
      {Array.from({ length: BUBBLE_COUNT }).map((_, i) => (
        <Bubble key={i} index={i} />
      ))}

      {/* Glow */}
      <Animated.View style={[styles.glow, glowAnimStyle]} />

      {/* Mascot */}
      <Animated.View style={[styles.mascotWrap, mascotStyle]}>
        <Image source={mascotImage} style={styles.mascotImage} resizeMode="contain" />
      </Animated.View>

      {/* Title */}
      <Animated.View style={titleStyle}>
        <Text style={styles.title}>Ánima</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View style={subStyle}>
        <Text style={styles.subtitle}>Tu compañero emocional</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  glow: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(91,155,213,0.15)',
  },
  mascotWrap: {
    marginBottom: 24,
  },
  mascotImage: {
    width: 140, height: 140,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 6,
    fontFamily: 'Poppins_400Regular',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(91,155,213,0.15)',
  },
});
