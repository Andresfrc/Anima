import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  useAnimatedSensor,
  SensorType,
  cancelAnimation,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { CURRENT_CONFIG } from '../utils/devicePerformance'; 

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// LUNAR MODE CONFIG (Sutil, Atmospheric, Relaxing)
// "Aurora emocional nocturna"
const BLOB_OPACITY = 0.12; 
const DURATION_BASE = 25000; 

// OPTIMIZATION: Use smart detection
const STAR_COUNT = CURRENT_CONFIG.starCount;

// SHOOTING STAR COMPONENT
const ShootingStar = React.memo(() => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const triggerShootingStar = () => {
      // Random delay between 15s and 45s
      const nextDelay = Math.random() * 30000 + 15000;
      
      timeoutId = setTimeout(() => {
        // Reset position
        const startX = Math.random() * screenWidth;
        const startY = Math.random() * (SCREEN_H * 0.4); // Top 40%
        translateX.value = startX;
        translateY.value = startY;
        opacity.value = 0;

        // Animate
        // 1. Fade in quickly
        opacity.value = withTiming(1, { duration: 100 });
        // 2. Move diagonally
        translateX.value = withTiming(startX - 200, { duration: 1000, easing: Easing.out(Easing.quad) });
        translateY.value = withTiming(startY + 200, { duration: 1000, easing: Easing.out(Easing.quad) });
        // 3. Fade out at end
        opacity.value = withDelay(600, withTiming(0, { duration: 400 }));

        // Loop
        triggerShootingStar();
      }, nextDelay);
    };

    triggerShootingStar();
    
    return () => clearTimeout(timeoutId);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: '-45deg' },
      { scaleX: 5 }, // Stretch to look like a streak
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 25,
          height: 2,
          backgroundColor: '#FFF',
          borderRadius: 1,
          top: 0,
          left: 0,
          // Removed expensive shadows
        },
        style,
      ]}
    />
  );
});

const Star = React.memo(({ delay, size, top, left }: { delay: number; size: number; top: number; left: number }) => {
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.quad) }), // Fade in brighter
          withTiming(0.2, { duration: 2500, easing: Easing.inOut(Easing.quad) }), // Fade out (twinkle)
          withTiming(0.9, { duration: 3000, easing: Easing.inOut(Easing.quad) }), // Back up brighter
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) })   // Fade out complete
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: interpolate(opacity.value, [0, 0.5], [0.5, 1.2]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFF',
          // Removed expensive shadows causing lag
        },
        style,
      ]}
    />
  );
});

export const AuroraBackgroundDark = React.memo(function AuroraBackgroundDark() {
  const blob1Anim = useSharedValue(0); 
  const blob2Anim = useSharedValue(0); 
  const blob3Anim = useSharedValue(0); 

  const currentPlan = useStore(s => s.currentPlan);

  const getBlobColors = () => {
    switch(currentPlan) {
      case 'ansiedad': return ['#6FA8DC', '#8A9CD8', '#86BFC6']; 
      case 'soledad':  return ['#8CB4D6', '#99C2E0', '#A6D0EA']; 
      case 'inseguridad': return ['#9BD1B3', '#9BD1C5', '#A2D19B']; 
      case 'renacer': return ['#D1C49B', '#D1CC9B', '#D1BC9B'];
      case 'autocompasion': return ['#D19EBB', '#D1A39B', '#D19BA8'];
      case 'balance': return ['#9B9CD1', '#A99BD1', '#9BC7D1'];
      case 'descubrimiento': return ['#9BD1AA', '#9BD1BD', '#A3D19B'];
      default: return ['#5A99D4', '#9B8EC4', '#A8E6CF']; 
    }
  };

  const [color1, color2, color3] = getBlobColors();

  // PARALLAX SENSOR
  // Only enable if high performance config allows it (or just always for now as it's optimized)
  const sensor = useAnimatedSensor(SensorType.GYROSCOPE, { interval: 50 });

  const starsAnimatedStyle = useAnimatedStyle(() => {
    const { x, y } = sensor.sensor.value;
    const transX = withSpring(y * 25, { damping: 20, stiffness: 100 }); 
    const transY = withSpring(x * 25, { damping: 20, stiffness: 100 });
    return { transform: [{ translateX: transX }, { translateY: transY }] };
  });

  // Generate random stars once
  const stars = React.useMemo(() => {
    return Array.from({ length: STAR_COUNT }).map((_, i) => ({
      id: i,
      top: Math.random() * SCREEN_H,
      left: Math.random() * SCREEN_W,
      size: Math.random() * 2 + 1, // Tiny stars 1-3px
      delay: Math.random() * 5000,
    }));
  }, []);

  useEffect(() => {
    // Blob 1: Vertical float + subtle scale
    blob1Anim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: DURATION_BASE, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: DURATION_BASE * 1.2, easing: Easing.inOut(Easing.quad) })
      ), -1, true
    );

    // Blob 2: Lateral float + subtle scale
    blob2Anim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: DURATION_BASE * 1.5, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: DURATION_BASE * 1.3, easing: Easing.inOut(Easing.quad) })
      ), -1, true
    );

    // Blob 3: Breathing
    blob3Anim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: DURATION_BASE * 0.8, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: DURATION_BASE, easing: Easing.inOut(Easing.quad) })
      ), -1, true
    );
    
    return () => {
      cancelAnimation(blob1Anim);
      cancelAnimation(blob2Anim);
      cancelAnimation(blob3Anim);
    };
  }, []);

  const style1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(blob1Anim.value, [0, 1], [0, 80]) }, 
      { translateX: interpolate(blob1Anim.value, [0, 1], [0, 30]) },
      { scale: interpolate(blob1Anim.value, [0, 1], [1, 1.2]) },
    ],
    opacity: interpolate(blob1Anim.value, [0, 1], [BLOB_OPACITY, BLOB_OPACITY * 0.7]),
  }));

  const style2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(blob2Anim.value, [0, 1], [0, -60]) },
      { translateX: interpolate(blob2Anim.value, [0, 1], [0, -40]) }, 
      { scale: interpolate(blob2Anim.value, [0, 1], [1, 1.3]) },
    ],
    opacity: interpolate(blob2Anim.value, [0, 1], [BLOB_OPACITY * 0.8, BLOB_OPACITY]),
  }));

  const style3 = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(blob3Anim.value, [0, 1], [0.8, 1.1]) }, 
      { translateY: interpolate(blob3Anim.value, [0, 1], [0, 20]) },
    ],
    opacity: interpolate(blob3Anim.value, [0, 1], [BLOB_OPACITY * 0.6, BLOB_OPACITY * 0.9]),
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
       {/* Stars Layer - Animated container for parallax */}
       <Animated.View style={[StyleSheet.absoluteFill, starsAnimatedStyle]}>
         {stars.map((star) => (
          <Star key={star.id} {...star} />
        ))}
       </Animated.View>
      
      {/* Shooting Star - Occasional */}
      <ShootingStar />

      {/* Blob 1: Blue/Primary (Top Left) */}
      <Animated.View style={[styles.blobBase, styles.blob1, style1, { backgroundColor: color1 }]} />
      
      {/* Blob 2: Lavender/Secondary (Bottom Right) */}
      <Animated.View style={[styles.blobBase, styles.blob2, style2, { backgroundColor: color2 }]} />
      
      {/* Blob 3: Subtle Warmth/Accent (Center/Top) */}
      <Animated.View style={[styles.blobBase, styles.blob3, style3, { backgroundColor: color3 }]} />
      
      <View style={styles.vignette} />
    </View>
  );
});

const styles = StyleSheet.create({
  blobBase: {
    position: 'absolute',
    borderRadius: 999, // Max rounded
  },
  blob1: {
    width: SCREEN_W * 1.2,
    height: SCREEN_W * 1.2,
    backgroundColor: '#5A99D4', 
    top: -SCREEN_W * 0.4,
    left: -SCREEN_W * 0.3,
  },
  blob2: {
    width: SCREEN_W * 1.1,
    height: SCREEN_W * 1.1,
    backgroundColor: '#9B8EC4', 
    bottom: -SCREEN_W * 0.3,
    right: -SCREEN_W * 0.2,
  },
  blob3: {
    width: SCREEN_W * 0.8,
    height: SCREEN_W * 0.8,
    backgroundColor: '#A8E6CF', 
    top: SCREEN_H * 0.3,
    left: SCREEN_W * 0.1,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // In a real implementation we might use a radial gradient SVG here for vignette
    // For now, pure transparency to let specific blobs shine.
  }
});
