import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeInRight, FadeOutLeft, runOnJS } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';
import { GlassCard, Mascot } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useTheme } from '../../hooks/useTheme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Puntuaciones internas para el algoritmo de ruteo
// R: Renacer, A: Autocompasión, B: Balance, D: Descubrimiento
type RouteScore = { R: number; A: number; B: number; D: number; S: number };

const TRIAGE_QUESTIONS = [
  {
    id: 'energy',
    question: "¿Cómo has percibido tu energía y descanso en los últimos días?",
    options: [
      { text: "Me ha costado mucho trabajo, me siento agotado/a", scores: { R: 2, A: 1, B: 0, D: 0, S: 0 } },
      { text: "Variable, hay días buenos y días pesados", scores: { R: 0, A: 0, B: 2, D: 0, S: 0 } },
      { text: "Tengo buena energía y duermo bien", scores: { R: 0, A: 0, B: 0, D: 2, S: 0 } },
    ]
  },
  {
    id: 'mind',
    question: "¿Qué frase describe mejor el estado actual de tu mente?",
    options: [
      { text: "A veces siento una nube gris o algo de tristeza", scores: { R: 2, A: 0, B: 0, D: 0, S: 0 } },
      { text: "Siento que mi mente no para, hay mucha presión", scores: { R: 0, A: 2, B: 2, D: 0, S: 0 } },
      { text: "Me siento tranquilo/a, pero quiero seguir creciendo", scores: { R: 0, A: 0, B: 0, D: 2, S: 0 } },
    ]
  },
  {
    id: 'goal',
    question: "Si Aníma pudiera ayudarte con una sola cosa hoy, ¿cuál sería?",
    options: [
      { text: "Encontrar paz y manejar mi estrés", scores: { R: 0, A: 0, B: 3, D: 0, S: 0 } },
      { text: "Aprender a tratarme con más cariño y menos culpa", scores: { R: 0, A: 3, B: 0, D: 0, S: 0 } },
      { text: "Recuperar la motivación para salir de un bache", scores: { R: 3, A: 0, B: 0, D: 0, S: 0 } },
      { text: "Conocerme mejor y explorar mis emociones", scores: { R: 0, A: 0, B: 0, D: 3, S: 0 } },
      { text: "Sentirme más conectado/a y en paz con mi propia compañía", scores: { R: 0, A: 0, B: 0, D: 0, S: 3 } },
    ]
  },
  {
    id: 'connection',
    question: "¿Cómo sientes tu nivel de conexión con los demás últimamente?",
    options: [
      { text: "Me siento aislado/a o incomprendido/a, incluso estando con gente", scores: { R: 0, A: 1, B: 0, D: 0, S: 3 } },
      { text: "Tengo personas cerca, pero me cuesta conectar profundamente", scores: { R: 0, A: 0, B: 1, D: 0, S: 2 } },
      { text: "Me siento acompañado/a y apoyado/a en este momento", scores: { R: 1, A: 0, B: 0, D: 2, S: 0 } },
    ]
  }
];

export default function TriageScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const userName = useStore(s => s.userName);
  const setRecommendedPlan = useStore(s => s.setRecommendedPlan);

  const [currentStep, setCurrentStep] = useState(0);
  const [totalScores, setTotalScores] = useState<RouteScore>({ R: 0, A: 0, B: 0, D: 0, S: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSelectOption = (scores: RouteScore) => {
    Haptics.selectionAsync();
    
    // Sumar puntajes
    const newScores = {
      R: totalScores.R + scores.R,
      A: totalScores.A + scores.A,
      B: totalScores.B + scores.B,
      D: totalScores.D + scores.D,
      S: totalScores.S + scores.S,
    };
    setTotalScores(newScores);

    // Avanzar o Calcular
    if (currentStep < TRIAGE_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      calculateAndNavigate(newScores);
    }
  };

  const calculateAndNavigate = (finalScores: RouteScore) => {
    setIsAnalyzing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Encontrar la llave con el valor máximo
    let bestPlanId = 'balance'; // Fallback
    let maxScore = -1;

    const routeMap = {
      'R': 'renacer',
      'A': 'autocompasion',
      'B': 'balance',
      'D': 'descubrimiento',
      'S': 'soledad'
    } as const;

    (Object.keys(finalScores) as Array<keyof RouteScore>).forEach(key => {
      if (finalScores[key] > maxScore) {
        maxScore = finalScores[key];
        bestPlanId = routeMap[key];
      }
    });

    setRecommendedPlan(bestPlanId);

    // Pequeño delay dramático para la pantalla de análisis
    setTimeout(() => {
      router.replace('/(onboarding)/select-plan');
    }, 2500);
  };

  if (isAnalyzing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
         <Animated.View entering={FadeIn.duration(1000)} style={[styles.analyzingWrapper, { backgroundColor: colors.bgPrimary }]}>
           <Mascot variant="meditating" size={150} />
           <Text style={[styles.analyzingTitle, { color: colors.textPrimary }]}>Aníma está pensando...</Text>
           <Text style={[styles.analyzingSubtitle, { color: colors.textSecondary }]}>Diseñando la experiencia perfecta para ti, {userName || 'viajero/a'}.</Text>
         </Animated.View>
      </View>
    );
  }

  const stepData = TRIAGE_QUESTIONS[currentStep];

  return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Absolute Background Gradient */}
      <LinearGradient 
        colors={isDark ? ['#101828', '#1A233A', '#0F172A'] : ['#F8FAFC', '#F1F5F9', '#E2E8F0']} 
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
           <Animated.View 
             style={[styles.progressFill, { width: `${((currentStep + 1) / TRIAGE_QUESTIONS.length) * 100}%` }]} 
           />
        </View>
        <Text style={[styles.stepCounter, { color: colors.textSecondary }]}>Paso {currentStep + 1} de {TRIAGE_QUESTIONS.length}</Text>
      </View>

      <Animated.View 
        key={currentStep} 
        entering={FadeInRight.springify().damping(18).mass(0.8)} 
        exiting={FadeOutLeft.duration(200)}
        style={styles.questionContainer}
      >
        <Text style={[styles.questionText, { color: colors.textPrimary }]}>{stepData.question}</Text>

        <View style={styles.optionsWrapper}>
          {stepData.options.map((opt, i) => (
            <GlassCard key={i} style={styles.optionCard} intensity={15}>
              <Pressable 
                style={({ pressed }) => [
                  styles.optionButton,
                  pressed && { opacity: 0.7, backgroundColor: 'rgba(255,255,255,0.05)' }
                ]}
                onPress={() => handleSelectOption(opt.scores)}
              >
                <Text style={[styles.optionText, { color: colors.textPrimary }]}>{opt.text}</Text>
              </Pressable>
            </GlassCard>
          ))}
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101828',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepCounter: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  questionContainer: {
    paddingHorizontal: 24,
    paddingTop: 120,
  },
  questionText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 26,
    color: '#FFFFFF',
    marginBottom: 40,
    lineHeight: 34,
  },
  optionsWrapper: {
    gap: 16,
  },
  optionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionButton: {
    padding: 20,
    minHeight: 80,
    justifyContent: 'center',
  },
  optionText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: '#E2E8F0',
    lineHeight: 24,
  },
  analyzingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#101828',
  },
  analyzingTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: '#FFFFFF',
    marginTop: 32,
    marginBottom: 12,
    textAlign: 'center',
  },
  analyzingSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
  }
});
