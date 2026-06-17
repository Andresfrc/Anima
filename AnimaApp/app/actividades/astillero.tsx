import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, Keyboard, Animated as RNAnimated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, Easing, useSharedValue, useAnimatedStyle, withTiming, withSpring, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { BlurView } from 'expo-blur';
import { ScreenWrapper } from '../../components/ScreenWrapper'; 
import { GlassCard } from '../../components/ui';

// Using the same ui exports as diario-ciego
import { JewelButton as UIJewelButton } from '../../components/ui';

export default function AstilleroScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const [text, setText] = useState('');
  const [victories, setVictories] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Reanimated value for the boat's horizontal progress (0 to 1)
  const boatProgress = useSharedValue(0);

  const handleSubmit = () => {
    if (!text.trim()) return;
    
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Add to list
    setVictories(prev => [text.trim(), ...prev]);
    setText('');

    // Advance the boat. Let's say 5 victories to cross the screen.
    const newProgress = Math.min(boatProgress.value + 0.2, 1);
    boatProgress.value = withSpring(newProgress, { damping: 15, stiffness: 90 });

    if (newProgress >= 0.99 && !showCelebration) {
      setTimeout(() => {
        setShowCelebration(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 500);
    }
  };

  const boatAnimatedStyle = useAnimatedStyle(() => {
    // We want the boat to move from left (say 10% width) to right (90% width)
    // 0 progress = 0 translation, 1 progress = 100% translation of container width
    return {
      left: `${interpolate(boatProgress.value, [0, 1], [10, 80])}%`,
      transform: [
        { rotate: `${Math.sin(boatProgress.value * Math.PI * 4) * 5}deg` } // slight rocking motion as it progresses
      ]
    };
  });

  const waterAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(boatProgress.value, [0, 1], [0.5, 1]),
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1a1829' : '#f5f7fa' }}>
      <LinearGradient
        colors={[isDark ? '#2a1b18' : '#fff3e0', isDark ? '#12101c' : '#e4e9f2']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Astillero de Victorias</Text>
          <View style={{ width: 44 }} />
        </View>

        {!showCelebration ? (
          <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(300)} style={styles.content}>
            
            {/* The Ocean View */}
            <View style={styles.oceanContainer}>
              <Animated.View style={[styles.waterLayer, waterAnimatedStyle]}>
                 <LinearGradient
                    colors={['transparent', '#FFB74D80', '#FF8A65CC']}
                    style={StyleSheet.absoluteFillObject}
                 />
              </Animated.View>
              
              <Animated.View style={[styles.boatWrapper, boatAnimatedStyle]}>
                <Text style={{ fontSize: 48 }}>🚢</Text>
              </Animated.View>

              <View style={styles.islandWrapper}>
                <Text style={{ fontSize: 40 }}>🏝️</Text>
              </View>
            </View>

            <View style={styles.instructionBox}>
              <Text style={[styles.instructionTitle, { color: colors.textPrimary }]}>Cada paso es un océano.</Text>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                Anota una victoria minúscula de hoy. Barrer, levantarte, tomar agua. Todo cuenta para hacer avanzar tu barco.
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: 'rgba(255, 183, 77, 0.3)' }]}
                placeholder="Ej. Me lavé la cara..."
                placeholderTextColor={colors.textLight}
                value={text}
                onChangeText={setText}
                maxLength={60}
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
              />
              <Pressable 
                style={[styles.sendButton, { backgroundColor: text.length > 0 ? '#FFB74D' : colors.bgCard }]}
                onPress={handleSubmit}
                disabled={text.length === 0}
              >
                <Ionicons name="arrow-up" size={20} color={text.length > 0 ? '#FFF' : colors.textLight} />
              </Pressable>
            </View>

            {/* List of micro-victories */}
            <View style={{ flex: 1, marginTop: 24 }}>
               {victories.map((vic, index) => (
                 <Animated.View key={index} entering={FadeIn.delay(index * 100)} style={[styles.victoryCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                   <Ionicons name="star" size={16} color="#FFB74D" style={{ marginRight: 12 }} />
                   <Text style={[styles.victoryText, { color: colors.textPrimary }]}>{vic}</Text>
                 </Animated.View>
               ))}
            </View>

          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(800)} style={styles.successContainer}>
            <Ionicons name="trophy" size={64} color="#FFB74D" style={{ marginBottom: 24 }} />
            <Text style={[styles.successTitle, { color: colors.textPrimary }]}>¡Llegaste a la orilla!</Text>
            <Text style={[styles.successText, { color: colors.textSecondary }]}>
              Construiste un puente sobre el océano usando solo pasos minúsculos. Eres mucho más fuerte de lo que te hace creer tu mente.
            </Text>
            <UIJewelButton 
              title="Volver" 
              icon="checkmark" 
              style={{ marginTop: 40 }}
              colors={['#FFB74D', '#FF8A65']} 
              onPress={() => router.back()} 
            />
          </Animated.View>
        )}
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
  },
  oceanContainer: {
    height: 150,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 183, 77, 0.1)',
    marginBottom: 24,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 77, 0.2)',
  },
  waterLayer: {
    ...StyleSheet.absoluteFillObject,
    top: 75, // Horizon line
  },
  boatWrapper: {
    position: 'absolute',
    top: 40,
    zIndex: 10,
  },
  islandWrapper: {
    position: 'absolute',
    right: 5,
    top: 45,
    zIndex: 5,
  },
  instructionBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFB74D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  victoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  victoryText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.8,
  },
});
