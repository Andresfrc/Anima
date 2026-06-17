import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ParticleProps {
  index: number;
}

const Particle = ({ index }: ParticleProps) => {
  const randomX = Math.random() * width;
  const randomY = Math.random() * height;
  const size = Math.random() * 4 + 2; // 2-6px size
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Random movement
    translateX.value = withRepeat(
      withTiming(Math.random() * 100 - 50, {
        duration: Math.random() * 5000 + 5000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
    
    translateY.value = withRepeat(
      withTiming(Math.random() * 100 - 50, {
        duration: Math.random() * 5000 + 5000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Fade in/out
    opacity.value = withDelay(
      Math.random() * 2000,
      withRepeat(
        withTiming(Math.random() * 0.5 + 0.2, {
          duration: Math.random() * 3000 + 2000,
        }),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: randomX,
          top: randomY,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    />
  );
};

interface ParticlesBackgroundProps {
  count?: number;
}

export function ParticlesBackground({ count = 15 }: ParticlesBackgroundProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <Particle key={i} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
});
