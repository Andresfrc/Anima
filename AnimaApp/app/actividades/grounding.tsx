import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { GlassCard } from '../../components/ui';
import { VisualGrounding } from './components/VisualGrounding';
import { HapticGrounding } from './components/HapticGrounding';
import { AuralGrounding } from './components/AuralGrounding';
import { CognitiveGrounding } from './components/CognitiveGrounding';

const { width, height } = Dimensions.get('window');

const GROUNDING_STEPS = [
  { id: 5, sense: 'Vista', title: '5 cosas que puedas ver', instruction: 'Atrapa 5 estrellas caóticas y arrástralas al centro para formar una constelación.' },
  { id: 4, sense: 'Tacto', title: '4 cosas que puedas sentir', instruction: 'Mantén presionado cada orbe de cristal hasta que sientas el latido en tus manos.' },
  { id: 3, sense: 'Oído', title: '3 cosas que puedas oír', instruction: 'Usa los interruptores para aislar los sonidos de la naturaleza.' },
  { id: 2, sense: 'Olfato', title: '2 cosas que puedas oler', instruction: 'Escribe dos aromas que te traigan paz o recuerdos reconfortantes.' },
  { id: 1, sense: 'Gusto', title: '1 cosa que puedas saborear', instruction: 'Imagina o describe un sabor que te conecte con el presente.' },
  { id: 0, sense: 'Completado', title: 'Conexión Establecida', instruction: 'Has regresado exitosamente al momento presente.' },
];

export default function GroundingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(5); // Starts at 5, counts down to 1

  const currentStepData = GROUNDING_STEPS.find(s => s.id === currentStep);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  useEffect(() => {
    if (currentStep === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timer = setTimeout(() => {
        router.back();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 5:
        return <View style={styles.stepContainer}><VisualGrounding onComplete={handleNext} /></View>;
      case 4:
        return <View style={styles.stepContainer}><HapticGrounding onComplete={handleNext} /></View>;
      case 3:
        return <View style={styles.stepContainer}><AuralGrounding onComplete={handleNext} /></View>;
      case 2:
      case 1:
        return <View style={styles.stepContainer}><CognitiveGrounding senseCount={currentStep} onComplete={handleNext} /></View>;
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Animated.View entering={FadeIn.duration(1500).delay(500)}>
              <Ionicons name="flower" size={100} color="#38BDF8" style={{ textShadowColor: 'rgba(56, 189, 248, 0.5)', textShadowRadius: 20 }} />
            </Animated.View>
            <Animated.View entering={FadeIn.duration(600).delay(1200)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(252, 211, 77, 0.2)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16, marginTop: 16 }}>
              <Ionicons name="sparkles" size={16} color="#FCD34D" />
              <Text style={{ color: '#FCD34D', fontSize: 16, fontFamily: 'Poppins_700Bold' }}>+25 XP</Text>
            </Animated.View>
          </View>
        );
      default:
        return null;
    }
  };

  if (!currentStepData) return null;

  return (
    <ScreenWrapper style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E1B4B', '#020617']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>
        <View style={styles.progressContainer}>
          <Text style={styles.headerTitle}>Conexión 5 Sentidos</Text>
          <Text style={styles.headerSubtitle}>Paso: {currentStepData.sense}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Dynamic Content Carousel */}
      <View style={styles.content}>
        <Animated.View 
          key={currentStep}
          entering={SlideInRight.duration(500)}
          exiting={SlideOutLeft.duration(400)}
          style={StyleSheet.absoluteFillObject}
        >
          <View style={styles.instructionsWrapper}>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepInstruction}>{currentStepData.instruction}</Text>
          </View>
          
          <View style={styles.interactionArea}>
            {renderStepContent()}
          </View>
          
        </Animated.View>
      </View>

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 15, paddingTop: 60,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  progressContainer: { alignItems: 'center' },
  headerTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#FFFFFF' },
  headerSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#818CF8' },
  content: { flex: 1, position: 'relative' },
  instructionsWrapper: { padding: 24, paddingBottom: 0, alignItems: 'center' },
  stepTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 24, color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  stepInstruction: { fontFamily: 'Poppins_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  interactionArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stepContainer: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.3)' }
});
