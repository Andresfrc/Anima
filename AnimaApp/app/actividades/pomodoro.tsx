import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, Pressable, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { FeatureButton, JewelButton, Mascot } from '../../components/ui';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, useAnimatedProps, withTiming, Easing,
  FadeInUp, FadeIn, ZoomIn
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CIRCLE_LENGTH = 1000; // SVG circumference
const R = CIRCLE_LENGTH / (2 * Math.PI);

import { Path, G } from 'react-native-svg';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

type TimerMode = 'focus' | 'break';

// Min/Max ranges
const FOCUS_MIN = 5 * 60;
const FOCUS_MAX = 60 * 60;
const FOCUS_STEP = 5 * 60;  // 5 min steps
const BREAK_MIN = 1 * 60;
const BREAK_MAX = 15 * 60;
const BREAK_STEP = 1 * 60;  // 1 min steps

const safeAction = async (action: 'play' | 'pause' | 'stop', sound: Audio.Sound | null) => {
  if (!sound) return;
  try {
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      if (action === 'play') await sound.playAsync();
      if (action === 'pause') await sound.pauseAsync();
      if (action === 'stop') await sound.stopAsync();
    }
  } catch (error) {
    console.log(`Ignored Audio Error:`, error);
  }
};

export default function PomodoroScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [focusDuration, setFocusDuration] = useState(25 * 60); // default 25 min
  const [breakDuration, setBreakDuration] = useState(5 * 60);  // default 5 min
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [ambientSound, setAmbientSound] = useState<Audio.Sound | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const currentDuration = mode === 'focus' ? focusDuration : breakDuration;

  const progress = useSharedValue(1); // 1 = full, 0 = empty

  // Format time as MM:SS
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Fixed interval logic to prevent tearing down the interval every second
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next >= 0) {
            progress.value = withTiming(next / currentDuration, { duration: 1000, easing: Easing.linear });
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode]);

  // Separate effect to handle completion without disrupting the interval
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      handleComplete();
    }
  }, [timeLeft, isRunning]);

  useEffect(() => {
    return () => {
      if (ambientSound) {
        ambientSound.unloadAsync();
      }
    };
  }, [ambientSound]);

  // Pause timer if app is sent to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (isRunning && (nextAppState === 'background' || nextAppState === 'inactive')) {
        setIsRunning(false);
        await safeAction('pause', ambientSound);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "El tiempo te espera pacientemente ⏳",
            body: "Pausamos tu Pomodoro mientras no estás. Regresa cuando estés listo para reconectar con tu paz.",
            sound: true,
          },
          trigger: null, // trigger immediately
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning, ambientSound]);

  const toggleTimer = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isRunning) {
      // Pause
      setIsRunning(false);
      await safeAction('pause', ambientSound);
    } else {
      // Play
      setIsRunning(true);
      if (!ambientSound) {
          try {
            // Load track based on mode
            const track = mode === 'focus' 
              ? require('../../assets/sounds/Lofi.mp3')
              : require('../../assets/sounds/Lofi2.mp3');
              
            const { sound: newSound } = await Audio.Sound.createAsync(track, { 
              shouldPlay: !isMuted, 
              isLooping: true, 
              volume: 0.8 
            });
            setAmbientSound(newSound);
          } catch (e) {
            console.log('Error loading ambient sound', e);
          }
        } else {
          if (!isMuted) {
            await safeAction('play', ambientSound);
          }
        }
    }
  };

  const handleComplete = async () => {
    setIsRunning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await safeAction('stop', ambientSound);
    
    // Show celebration screen
    setShowCompletion(true);
    
    setTimeout(() => {
      setShowCompletion(false);
      // Auto-switch mode after 3 seconds
      if (mode === 'focus') {
        setMode('break');
        setTimeLeft(breakDuration);
        progress.value = 1;
      } else {
        setMode('focus');
        setTimeLeft(focusDuration);
        progress.value = 1;
      }
      // Unload audio to force a new load (Lofi2 vs Lofi) when they press play again
      if (ambientSound) {
        ambientSound.unloadAsync();
        setAmbientSound(null);
      }
    }, 3000);
  };

  const resetTimer = async () => {
    setIsRunning(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await safeAction('stop', ambientSound);
    setTimeLeft(currentDuration);
    progress.value = withTiming(1, { duration: 500 });
  };

  // ─── Configurable time stepper ───
  const adjustTime = (direction: 'up' | 'down') => {
    if (isRunning) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const step = mode === 'focus' ? FOCUS_STEP : BREAK_STEP;
    const min = mode === 'focus' ? FOCUS_MIN : BREAK_MIN;
    const max = mode === 'focus' ? FOCUS_MAX : BREAK_MAX;
    const current = mode === 'focus' ? focusDuration : breakDuration;
    const newVal = direction === 'up' 
      ? Math.min(current + step, max) 
      : Math.max(current - step, min);
    if (mode === 'focus') {
      setFocusDuration(newVal);
    } else {
      setBreakDuration(newVal);
    }
    setTimeLeft(newVal);
    progress.value = 1;
  };

  const switchMode = (newMode: TimerMode) => {
    if (mode === newMode) return;
    setIsRunning(false);
    setMode(newMode);
    const total = newMode === 'focus' ? focusDuration : breakDuration;
    setTimeLeft(total);
    progress.value = 1;
    if (ambientSound) {
      safeAction('stop', ambientSound).then(() => {
        ambientSound.unloadAsync();
        setAmbientSound(null);
      });
    }
  };

  const toggleMute = async () => {
    Haptics.selectionAsync();
    if (isMuted) {
      setIsMuted(false);
      if (isRunning) {
        await safeAction('play', ambientSound);
      }
    } else {
      setIsMuted(true);
      await safeAction('pause', ambientSound);
    }
  };

  // Beautiful Continuous Sprout Growth
  // progress.value goes from 1 (start) to 0 (end)
  const sproutStem = useAnimatedProps(() => {
    // Stem grows up as progress drops from 1.0 to 0.7
    const height = progress.value > 0.7 ? (1 - progress.value) * 100 : 30;
    return { strokeDashoffset: Math.max(0, 100 - (height / 30) * 100) };
  });

  const leftLeafProps = useAnimatedProps(() => {
    // Left leaf scales up between 0.7 and 0.4
    const s = progress.value > 0.7 ? 0 : progress.value < 0.4 ? 1 : (0.7 - progress.value) * 3.33;
    return { transform: [{ scale: Math.min(Math.max(s, 0), 1) }] };
  });

  const rightLeafProps = useAnimatedProps(() => {
    // Right leaf scales up between 0.5 and 0.2
    const s = progress.value > 0.5 ? 0 : progress.value < 0.2 ? 1 : (0.5 - progress.value) * 3.33;
    return { transform: [{ scale: Math.min(Math.max(s, 0), 1) }] };
  });
  
  const flowerProps = useAnimatedProps(() => {
    // Flower blooms in the final 20% (0.2 -> 0.0)
    const s = progress.value > 0.2 ? 0 : (0.2 - progress.value) * 5;
    return { transform: [{ scale: Math.min(Math.max(s, 0), 1) }] };
  });

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = CIRCLE_LENGTH * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const primaryColor = mode === 'focus' ? '#4ADE80' : '#60A5FA'; // Green for focus, Blue for break

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FeatureButton icon="arrow-back" title="" color={colors.textPrimary} onPress={() => router.back()} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Guardián de Límites</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        
        {/* Mode Selector */}
        <Animated.View style={styles.modeContainer}>
          <Pressable 
            style={[styles.modeTab, mode === 'focus' && { backgroundColor: 'rgba(74,222,128,0.2)' }]}
            onPress={() => switchMode('focus')}
          >
            <Text style={[styles.modeText, { color: mode === 'focus' ? '#4ADE80' : colors.textSecondary }]}>Enfoque</Text>
          </Pressable>
          <Pressable 
            style={[styles.modeTab, mode === 'break' && { backgroundColor: 'rgba(96,165,250,0.2)' }]}
            onPress={() => switchMode('break')}
          >
            <Text style={[styles.modeText, { color: mode === 'break' ? '#60A5FA' : colors.textSecondary }]}>Descanso</Text>
          </Pressable>
        </Animated.View>

        {/* Mascot & Context */}
        <Animated.View style={styles.mascotArea}>
          <Mascot size={110} variant={(mode === 'focus' ? 'estudioso' : 'resting') as any} />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {mode === 'focus' 
              ? 'Lumi estudia contigo mientras te concentras.\nEl mundo exterior puede esperar un rato.'
              : 'Tómate un respiro. Estírate y bebe agua.\nLumi también está relajándose.'}
          </Text>
        </Animated.View>

        {/* Timer UI */}
        <View style={styles.timerWrap}>
          <Svg 
            width={width * 0.75} 
            height={width * 0.75} 
            viewBox={`0 0 ${R * 2 + 40} ${R * 2 + 40}`}
          >
            {/* The Elegant Glowing Plant (Center) */}
            <G transform={`translate(${R + 20}, ${R + 60}) scale(2.0)`}>
              {/* Stem */}
              <AnimatedPath 
                d="M 0 0 Q -10 -20 0 -40 Q 5 -50 0 -60" 
                fill="none" 
                stroke={mode === 'focus' ? '#4ADE80' : '#60A5FA'} 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeDasharray="100"
                animatedProps={sproutStem}
              />
              {/* Left Leaf */}
              <AnimatedG animatedProps={leftLeafProps} origin="-5, -25">
                <Path d="M 0 -25 Q -20 -25 -25 -40 Q -10 -40 0 -25 Z" fill={mode === 'focus' ? '#4ADE80' : '#60A5FA'} opacity={0.8} />
              </AnimatedG>
              {/* Right Leaf */}
              <AnimatedG animatedProps={rightLeafProps} origin="5, -45">
                <Path d="M 0 -45 Q 20 -40 25 -55 Q 5 -55 0 -45 Z" fill={mode === 'focus' ? '#4ADE80' : '#60A5FA'} opacity={0.8} />
              </AnimatedG>
              {/* Blooming Light (Flower) */}
              <AnimatedG animatedProps={flowerProps} origin="0, -65">
                <Circle cx="0" cy="-65" r="8" fill="#FFF" opacity={0.9} />
                <Circle cx="0" cy="-65" r="14" fill="#FFF" opacity={0.3} />
                <Path d="M 0 -75 L 2 -67 L 10 -65 L 2 -63 L 0 -55 L -2 -63 L -10 -65 L -2 -67 Z" fill="#FFD700" />
              </AnimatedG>
            </G>

            {/* Background Circle */}
            <Circle 
              cx={R + 20} cy={R + 20} r={R}
              stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
              strokeWidth={15}
              fill="transparent"
            />
            {/* Animated Progress Circle */}
            <AnimatedCircle 
              cx={R + 20} cy={R + 20} r={R}
              stroke={primaryColor}
              strokeWidth={15}
              fill="transparent"
              strokeDasharray={CIRCLE_LENGTH}
              animatedProps={animatedProps}
              strokeLinecap="round"
              rotation="-90"
              origin={`${R + 20}, ${R + 20}`}
            />
          </Svg>
          
          <View style={styles.timeTextWrap}>
            {!isRunning && (
              <Pressable 
                style={[styles.stepperBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]} 
                onPress={() => adjustTime('up')}
              >
                <Ionicons name="chevron-up" size={22} color={primaryColor} />
              </Pressable>
            )}
            <Text style={[styles.timeText, { color: colors.textPrimary }]}>{timeString}</Text>
            {!isRunning && (
              <Pressable 
                style={[styles.stepperBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]} 
                onPress={() => adjustTime('down')}
              >
                <Ionicons name="chevron-down" size={22} color={primaryColor} />
              </Pressable>
            )}
            {!isRunning && (
              <Text style={[styles.stepperHint, { color: colors.textLight }]}>
                {mode === 'focus' ? '±5 min' : '±1 min'}
              </Text>
            )}
          </View>
        </View>

        {/* Controls */}
        <Animated.View style={styles.controls}>
          <Pressable style={[styles.controlBtn, { backgroundColor: isDark ? '#333' : '#EEE' }]} onPress={resetTimer}>
            <Ionicons name="stop" size={24} color={colors.textPrimary} />
          </Pressable>

          <Pressable style={[styles.playBtn, { backgroundColor: primaryColor }]} onPress={toggleTimer}>
            <Ionicons name={isRunning ? "pause" : "play"} size={36} color="#FFF" style={{ marginLeft: isRunning ? 0 : 4 }} />
          </Pressable>

          <Pressable style={[styles.controlBtn, { backgroundColor: isMuted ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.05)' }]} onPress={toggleMute}>
            <Ionicons name={isMuted ? "volume-mute" : "musical-notes"} size={22} color={isMuted ? '#EF4444' : colors.textPrimary} />
          </Pressable>
        </Animated.View>

      </View>

      {/* Completion Overlay */}
      {showCompletion && (
        <Animated.View entering={FadeIn.duration(400)} exiting={FadeIn.duration(400)} style={[StyleSheet.absoluteFillObject, styles.completionOverlay]}>
          <Mascot size={150} variant="celebrating" />
          <Animated.Text entering={FadeInUp.delay(200)} style={styles.completionTitle}>
            ¡Ciclo Completado!
          </Animated.Text>
          <Animated.View entering={FadeInUp.delay(350)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(252, 211, 77, 0.2)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16 }}>
            <Ionicons name="sparkles" size={16} color="#FCD34D" />
            <Text style={{ color: '#FCD34D', fontSize: 16, fontFamily: 'Poppins_700Bold' }}>+25 XP</Text>
          </Animated.View>
          <Animated.Text entering={FadeInUp.delay(400)} style={styles.completionSub}>
            Respira profundo. Estás un paso más cerca de tu paz.
          </Animated.Text>
        </Animated.View>
      )}

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 10,
  },
  headerLeft: { flex: 1, alignItems: 'flex-start', zIndex: 10 },
  headerCenter: { flex: 3, alignItems: 'center' },
  headerRight: { flex: 1 },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderRadius: 30,
    padding: 6,
    marginBottom: 40,
  },
  modeTab: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  modeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  mascotArea: {
    alignItems: 'center',
    marginBottom: 40,
    height: 120, // fixed height to prevent shifting
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  timerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeTextWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 64,
    fontFamily: 'Poppins_700Bold',
    fontVariant: ['tabular-nums'], 
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    marginTop: 50,
  },
  controlBtn: {
    width: 56, height: 56,
    borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  playBtn: {
    width: 80, height: 80,
    borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  completionOverlay: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  completionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: '#FFF',
    marginTop: 30,
    textAlign: 'center',
  },
  completionSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  stepperBtn: {
    width: 40, height: 32,
    borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  stepperHint: {
    fontSize: 11, fontFamily: 'Poppins_400Regular',
    marginTop: 2, opacity: 0.6,
  },
});
