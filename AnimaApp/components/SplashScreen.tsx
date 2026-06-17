import React, { useEffect } from 'react';
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

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const mascotScale = useSharedValue(0);
  const mascotY = useSharedValue(30);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.6);
  const glowOpacity = useSharedValue(0);
  const mainOpacity = useSharedValue(1);
  const bubbles = Array.from({ length: 8 }).map(() => ({
    x: useSharedValue(Math.random() * width),
    y: useSharedValue(height),
    opacity: useSharedValue(0),
    scale: useSharedValue(0),
  }));

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

    // 5. Bubbles float up
    bubbles.forEach((b, i) => {
      const delay = 500 + i * 200;
      b.opacity.value = withDelay(delay, withTiming(0.5, { duration: 600 }));
      b.scale.value = withDelay(delay, withTiming(1, { duration: 600 }));
      b.y.value = withDelay(delay,
        withTiming(Math.random() * height * 0.6, { duration: 2500, easing: Easing.out(Easing.ease) })
      );
    });

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
      {bubbles.map((b, i) => {
        const bStyle = useAnimatedStyle(() => ({
          transform: [{ scale: b.scale.value }],
          opacity: b.opacity.value,
          top: b.y.value,
          left: b.x.value,
        }));
        const size = 8 + Math.random() * 12;
        return (
          <Animated.View
            key={i}
            style={[styles.bubble, { width: size, height: size, borderRadius: size / 2 }, bStyle]}
          />
        );
      })}

      {/* Glow */}
      <Animated.View style={[styles.glow, glowAnimStyle]} />

      {/* Mascot */}
      <Animated.View style={[styles.mascotWrap, mascotStyle]}>
        <Image source={mascotImage} style={styles.mascotImage} resizeMode="contain" />
      </Animated.View>

      {/* Title */}
      <Animated.View style={titleStyle}>
        <Text style={styles.title}>Aníma</Text>
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
