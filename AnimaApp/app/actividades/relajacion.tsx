import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { 
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, 
  withSequence, Easing, FadeIn, FadeOut 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Gradients } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { JewelButton } from '../../components/ui';

// Body parts data
const BODY_STEPS = [
  { id: 'hands', label: 'Manos y Brazos', instruction: 'Aprieta los puños fuerte.' },
  { id: 'shoulders', label: 'Hombros y Cuello', instruction: 'Sube los hombros hacia tus orejas.' },
  { id: 'face', label: 'Rostro', instruction: 'Frunce el ceño y aprieta los ojos.' },
  { id: 'legs', label: 'Piernas y Pies', instruction: 'Tensa los muslos y pantorrillas.' },
  { id: 'all', label: 'Todo el cuerpo', instruction: 'Tensa todo tu cuerpo a la vez.' },
];

export default function RelajacionScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [stepIndex, setStepIndex] = useState(-1); // -1: Intro, 0-4: Steps, 5: Outro
  const [phase, setPhase] = useState<'idle' | 'read' | 'tense' | 'relax'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);

  // Animations
  const glowOpacity = useSharedValue(0);
  const scaleAnim = useSharedValue(1);

  useEffect(() => {
    let interval: any;
    if (phase === 'read' && timeLeft > 0) {
       interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (phase === 'tense' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Tense heartbeat
      }, 1000);
    } else if (phase === 'relax' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && phase !== 'idle') {
      handlePhaseComplete();
    }
    return () => clearInterval(interval);
  }, [phase, timeLeft]);

  const handlePhaseComplete = () => {
    if (phase === 'read') {
      startTensePhase();
    } else if (phase === 'tense') {
      startRelaxPhase();
    } else if (phase === 'relax') {
      nextStep();
    }
  };

  const startSession = () => {
    setStepIndex(0);
    startReadPhase(0);
  };

  const startReadPhase = (index: number) => {
    setPhase('read');
    setTimeLeft(5); // 5 seconds to read instruction
    glowOpacity.value = withTiming(0.2, { duration: 1000 });
    scaleAnim.value = withTiming(1, { duration: 1000 });
  };

  const startTensePhase = () => {
    setPhase('tense');
    setTimeLeft(5); // 5 seconds of tension
    glowOpacity.value = withRepeat(withTiming(0.8, { duration: 500 }), -1, true);
    scaleAnim.value = withTiming(1.05, { duration: 5000 });
  };

  const startRelaxPhase = () => {
    setPhase('relax');
    setTimeLeft(8); // 8 seconds of relaxation
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    glowOpacity.value = withTiming(0, { duration: 1000 });
    scaleAnim.value = withTiming(1, { duration: 1000 });
  };

  const nextStep = () => {
    if (stepIndex < BODY_STEPS.length - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      startReadPhase(next);
    } else {
      setStepIndex(BODY_STEPS.length); // Outro
      setPhase('idle');
    }
  };

  const currentStep = stepIndex >= 0 && stepIndex < BODY_STEPS.length ? BODY_STEPS[stepIndex] : null;

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <ScreenWrapper style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Relajación Progresiva</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {stepIndex === -1 && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.introSection}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(91,155,213,0.1)' }]}>
              <Ionicons name="body-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Relajación de Jacobson</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Aprenderemos a soltar la tensión muscular acumulada.
            </Text>
            <View style={[styles.instructionList, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF' }]}>
              <InstructionRow num="1" text="Lee la instrucción y prepárate." isDark={isDark} colors={colors} />
              <InstructionRow num="2" text="Tensa fuerte el músculo cuando se te indique." isDark={isDark} colors={colors} />
              <InstructionRow num="3" text="Suelta de golpe y disfruta la sensación." isDark={isDark} colors={colors} />
            </View>
            <JewelButton title="Comenzar Sesión" onPress={startSession} style={{ width: '100%', marginTop: 20 }} />
          </Animated.View>
        )}

        {currentStep && (
          <Animated.View key={currentStep.id} entering={FadeIn.duration(300)} style={styles.activeSection}>
            <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>{currentStep.label}</Text>
            
            <View style={styles.visualContainer}>
              {/* Abstract Body Representation */}
              <View style={styles.bodySilhouette}>
                <Ionicons name="person" size={280} color={isDark ? "rgba(255,255,255,0.05)" : "#E2E8F0"} />
                {/* Active Highlight */}
                <Animated.View style={[styles.highlightGlow, glowStyle]}>
                   <Ionicons name="person" size={280} color={phase === 'tense' ? '#FF6B6B' : (phase === 'relax' ? '#4ADE80' : '#CBD5E0')} />
                </Animated.View>
              </View>
              
              <Text style={[styles.timerText, { color: colors.textPrimary }]}>{timeLeft}</Text>
            </View>

            <Text style={[styles.instructionText, { color: colors.textPrimary }]}>
              {phase === 'read' ? `Prepárate: ${currentStep.instruction}` : 
               phase === 'tense' ? '¡TENSA FUEERTE!' : 
               '¡SUELTA Y RELAJA!'}
            </Text>
            
            <Text style={[styles.phaseLabel, { color: phase === 'tense' ? '#E53E3E' : (phase === 'relax' ? '#38A169' : colors.textLight) }]}>
              {phase === 'read' ? 'L E E' : (phase === 'tense' ? 'T E N S I Ó N' : 'R E L A J A C I Ó N')}
            </Text>
          </Animated.View>
        )}

        {stepIndex === BODY_STEPS.length && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.outroSection}>
            <Ionicons name="checkmark-circle" size={80} color="#4ADE80" />
            <Text style={[styles.title, { color: colors.textPrimary }]}>¡Cuerpo Relajado!</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(252, 211, 77, 0.15)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16, marginBottom: 8 }}>
              <Ionicons name="sparkles" size={16} color="#FCD34D" />
              <Text style={{ color: '#FCD34D', fontSize: 16, fontFamily: 'Poppins_700Bold' }}>+25 XP</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Has completado el escaneo. Intenta llevar esta sensación de calma al resto de tu día.
            </Text>
            <JewelButton title="Finalizar" onPress={() => router.back()} style={{ width: '100%', marginTop: 20 }} />
          </Animated.View>
        )}
      </View>
    </ScreenWrapper>
  );
}

function InstructionRow({ num, text, isDark, colors }: { num: string, text: string, isDark: boolean, colors: any }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
      <View style={[styles.numBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.numText}>{num}</Text>
      </View>
      <Text style={[styles.instructionRowText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16, fontWeight: '600', color: Colors.textPrimary, fontFamily: 'Poppins_600SemiBold',
  },
  content: {
    flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center',
  },
  introSection: {
    alignItems: 'center', width: '100%',
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(91,155,213,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  title: {
    fontSize: 24, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32,
    fontFamily: 'Poppins_400Regular',
  },
  instructionList: {
    width: '100%', padding: 20, backgroundColor: '#FFF', borderRadius: 24,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  numBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  numText: {
    fontSize: 12, fontWeight: '700', color: '#FFF',
  },
  instructionRowText: {
    flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20,
  },
  
  // Active Steps
  activeSection: {
    alignItems: 'center', width: '100%',
  },
  stepLabel: {
    fontSize: 18, fontWeight: '600', color: Colors.textSecondary, marginBottom: 40,
    fontFamily: 'Poppins_600SemiBold',
  },
  visualContainer: {
    width: 300, height: 350, justifyContent: 'center', alignItems: 'center', marginBottom: 40,
    position: 'relative',
  },
  bodySilhouette: {
    position: 'relative',
  },
  highlightGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    opacity: 0,
  },
  timerText: {
    position: 'absolute', fontSize: 60, fontWeight: '700', color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold', textShadowColor: 'rgba(255,255,255,0.8)', textShadowRadius: 10,
  },
  instructionText: {
    fontSize: 20, fontWeight: '500', color: Colors.textPrimary, textAlign: 'center', marginBottom: 10,
    fontFamily: 'Poppins_500Medium', paddingHorizontal: 20,
  },
  phaseLabel: {
    fontSize: 14, fontWeight: '700', letterSpacing: 2,
    fontFamily: 'Poppins_700Bold',
  },
  
  // Outro
  outroSection: {
    alignItems: 'center', width: '100%',
  },
});
