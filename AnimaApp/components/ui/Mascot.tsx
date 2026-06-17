/**
 * Mascot — Componente de la mascota principal con animaciones de flotación,
 * glow y respiración según la variante seleccionada.
 */
import React, { useEffect } from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, Easing, interpolate, cancelAnimation,
} from 'react-native-reanimated';

// Mascot images (RF-19)
const MASCOT_IMAGES: Record<string, ImageSourcePropType> = {
  happy: require('../../assets/images/mascot/saludando.png'),
  greeting: require('../../assets/images/mascot/saludando.png'),
  breathing: require('../../assets/images/mascot/respirando.png'),
  meditating: require('../../assets/images/mascot/lumi-meditating.png'),
  resting: require('../../assets/images/mascot/lumi-resting.png'),
  radar: require('../../assets/images/mascot/lumi-radar.png'),
  celebrating: require('../../assets/images/mascot/lumi-celebrating.png'),
  diary: require('../../assets/images/mascot/lumi-diary.png'),
  fire: require('../../assets/images/mascot/lumi-fire.png'),
  star: require('../../assets/images/mascot/lumi-star .png'),
  confused: require('../../assets/images/mascot/lumi-confused.png'),
  empathetic: require('../../assets/images/mascot/lumi-empatico.png'),
  sleeping: require('../../assets/images/mascot/Lumi-sleeping.png'),
  registro: require('../../assets/images/mascot/Lumi-resgistro.png'),
  pensativo: require('../../assets/images/mascot/lumi-pensativo.png'),
  estudioso: require('../../assets/images/mascot/lumi-estudioso.png'),
  celebrando: require('../../assets/images/mascot/lumi-celebrando.png'),
  levelup: require('../../assets/images/mascot/lumi-up.png'),
};

export type MascotVariant = 'happy' | 'greeting' | 'empathetic' | 'breathing' | 'meditating' | 'resting' | 'radar' | 'celebrating' | 'diary' | 'fire' | 'star' | 'confused' | 'sleeping' | 'registro' | 'pensativo' | 'estudioso' | 'celebrando' | 'levelup';

interface MascotProps {
  size?: number;
  style?: any;
  variant?: MascotVariant;
}

const MascotComponent = ({ size = 120, style, variant = 'happy' }: MascotProps) => {
  const floatY = useSharedValue(0);
  const glow = useSharedValue(0);
  const breathScale = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true
    );
    
    glow.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );

    if (variant === 'breathing' || variant === 'meditating') {
      breathScale.value = withRepeat(
        withTiming(1.04, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
        -1, true
      );
    }
    
    return () => {
      cancelAnimation(floatY);
      cancelAnimation(glow);
      cancelAnimation(breathScale);
    };
  }, [variant]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.6]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.9, 1.1]) }],
  }));

  const combinedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: breathScale.value }
    ],
  }));

  const imageSource = MASCOT_IMAGES[variant] || MASCOT_IMAGES.happy;

  const scaleMap: Record<string, { image: number, glow: number }> = {
    happy: { image: 1, glow: 1.3 },
    meditating: { image: 1.45, glow: 1.05 },
    star: { image: 1.6, glow: 0.95 },
  };

  const currentScale = scaleMap[variant] || { image: 1.35, glow: 1.1 };

  return (
    <Animated.View style={[styles.mascotContainer, { width: size, height: size }, combinedStyle, style]}>
      <Animated.View style={[styles.mascotGlow, { width: size * currentScale.glow, height: size * currentScale.glow }, glowStyle]} />
      <Image
        source={imageSource}
        style={{ width: size, height: size, transform: [{ scale: currentScale.image }] }}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

export const Mascot = React.memo(MascotComponent);

const styles = StyleSheet.create({
  mascotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotGlow: {
    position: 'absolute',
    borderRadius: 200,
    backgroundColor: 'rgba(91,155,213,0.12)',
  },
});
