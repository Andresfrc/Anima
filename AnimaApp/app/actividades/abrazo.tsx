import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { JewelButton } from '../../components/ui';

export default function AbrazoScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const [isActive, setIsActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const isActiveRef = useRef(isActive);
  
  // Animation values for the butterfly wings
  const leftWingRotate = useSharedValue(0);
  const rightWingRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  // Time tracking
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update ref synchronously
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Core Haptic loop function
  const triggerHapticLoop = async () => {
    if (!isActiveRef.current) return;
    
    // Left tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    leftWingRotate.value = withSequence(
      withTiming(-30, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: 350, easing: Easing.in(Easing.ease) })
    );

    await new Promise(resolve => setTimeout(resolve, 800));
    if (!isActiveRef.current) return;

    // Right tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    rightWingRotate.value = withSequence(
      withTiming(30, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: 350, easing: Easing.in(Easing.ease) })
    );
    
    if (isActiveRef.current) {
       setTimeout(() => runOnJS(triggerHapticLoop)(), 800);
    }
  };

  useEffect(() => {
    if (isActive) {
      // Start glow pulse
      glowOpacity.value = withRepeat(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      
      // Start Haptic Loop
      triggerHapticLoop();

      // Start timer
      timerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      // Stop everything
      glowOpacity.value = withTiming(0.3, { duration: 500 });
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // Force kill loop on unmount or effect cleanup
      isActiveRef.current = false;
    };
  }, [isActive]);

  const toggleSession = () => {
    setIsActive(!isActive);
    Haptics.selectionAsync();
  };

  const leftWingStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${leftWingRotate.value}deg` }
    ]
  }));

  const rightWingStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${rightWingRotate.value}deg` }
    ]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1 + (glowOpacity.value - 0.3) }]
  }));

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1F1A24' : '#FCE4EC' }}>
      <LinearGradient
        colors={[isDark ? '#2A1B24' : '#FCE4EC', isDark ? '#120E15' : '#F8BBD0']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Abrazo de Mariposa</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        
        {/* Instructions */}
        <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.instructionBox}>
           <Text style={[styles.instructionTitle, { color: colors.textPrimary }]}>Regulación Nerviosa</Text>
           <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
             Cruza tus brazos sobre el pecho. Sostén el teléfono en el centro y cierra los ojos. Siente los latidos del teléfono y respira suavemente.
           </Text>
        </Animated.View>

        {/* Butterfly Animation Area */}
        <View style={styles.butterflyContainer}>
          {/* Pulsing Glow Background */}
          <Animated.View style={[styles.glowRing, { backgroundColor: '#F48FB1' }, glowStyle]} />
          
          <View style={styles.butterflyBody}>
            {/* Left Wing */}
            <Animated.View style={[styles.wing, styles.leftWing, leftWingStyle]}>
              <LinearGradient
                colors={['#F06292', '#F48FB1']}
                style={StyleSheet.absoluteFillObject}
                start={{x: 1, y: 0.5}} end={{x: 0, y: 0.5}}
              />
            </Animated.View>

            {/* Center Body */}
            <View style={styles.centerBody} />

            {/* Right Wing */}
            <Animated.View style={[styles.wing, styles.rightWing, rightWingStyle]}>
              <LinearGradient
                colors={['#F06292', '#F48FB1']}
                style={StyleSheet.absoluteFillObject}
                start={{x: 0, y: 0.5}} end={{x: 1, y: 0.5}}
              />
            </Animated.View>
          </View>
        </View>

        {/* Timer Display */}
        <Animated.Text style={[styles.timerText, { color: isActive ? '#F48FB1' : colors.textLight }]}>
          {Math.floor(sessionTime / 60).toString().padStart(2, '0')}:{(sessionTime % 60).toString().padStart(2, '0')}
        </Animated.Text>

        {/* Start/Stop Controls */}
        <Animated.View entering={FadeIn.duration(600).delay(400)} style={styles.controls}>
          <JewelButton
            title={isActive ? "Pausar Abrazo" : "Iniciar Abrazo"}
            icon={isActive ? "pause" : "heart"}
            colors={isActive ? ['transparent', 'transparent'] : ['#F48FB1', '#F06292']}
            style={isActive ? { borderWidth: 1, borderColor: '#F48FB1' } : {}}
            onPress={toggleSession}
          />
        </Animated.View>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  instructionBox: {
    alignItems: 'center',
    marginBottom: 60,
  },
  instructionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
  butterflyContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
    filter: 'blur(30px)', // Experimental on some RN versions, but helps conceptually
  },
  butterflyBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBody: {
    width: 8,
    height: 60,
    backgroundColor: '#AD1457',
    borderRadius: 4,
    marginHorizontal: 2,
    zIndex: 10,
  },
  wing: {
    width: 80,
    height: 120,
    borderRadius: 40,
    overflow: 'hidden',
  },
  leftWing: {
    borderBottomLeftRadius: 80,
    borderTopLeftRadius: 20,
    transformOrigin: 'right center', // Ensures it folds towards the center body
  },
  rightWing: {
    borderBottomRightRadius: 80,
    borderTopRightRadius: 20,
    transformOrigin: 'left center', // Ensures it folds towards the center body
  },
  timerText: {
    fontSize: 32,
    fontFamily: 'Poppins_300Light',
    marginBottom: 40,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    width: '100%',
    paddingHorizontal: 20,
  }
});
