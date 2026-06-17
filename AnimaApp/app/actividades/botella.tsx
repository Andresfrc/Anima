import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, Easing, useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, withDelay, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { GlassCard } from '../../components/ui';

// Mock DB for the community bottles
const COMMUNITY_MESSAGES = [
  "No estás tan solo como crees. Yo también he estado ahí.",
  "El simple hecho de que sigas intentándolo te hace increíblemente valiente.",
  "Alguien en el mundo está orgulloso de ti hoy, incluso si no lo sabes.",
  "Respira. Esto también pasará, como las olas en el mar.",
  "Te envío un abrazo a la distancia. No te rindas.",
  "Mañana es una nueva oportunidad. Hoy hiciste lo mejor que pudiste.",
  "Tu existencia hace que este mundo sea un poquito más interesante.",
];

export default function BotellaScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'write' | 'sending' | 'waiting' | 'received'>('write');
  const [receivedMessage, setReceivedMessage] = useState('');

  // Animations
  const waveOffset = useSharedValue(0);
  const bottleY = useSharedValue(0);
  const bottleOpacity = useSharedValue(1);
  const bottleScale = useSharedValue(1);
  
  // Received bottle animation
  const recvBottleY = useSharedValue(100);
  const recvBottleOpacity = useSharedValue(0);

  useEffect(() => {
    // Gentle ocean waves
    waveOffset.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const handleSend = () => {
    if (!text.trim()) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setPhase('sending');
    
    // Animate bottle throwing out to sea
    bottleY.value = withTiming(-150, { duration: 2000, easing: Easing.out(Easing.cubic) });
    bottleOpacity.value = withTiming(0, { duration: 2000, easing: Easing.ease });
    bottleScale.value = withTiming(0.2, { duration: 2000, easing: Easing.ease });

    setTimeout(() => {
      setPhase('waiting');
      
      // Simulate waiting for the ocean to return a bottle (Network delay mock)
      setTimeout(() => {
        // Pick random response
        const randomMsg = COMMUNITY_MESSAGES[Math.floor(Math.random() * COMMUNITY_MESSAGES.length)];
        setReceivedMessage(randomMsg);
        
        // Animate new bottle coming in
        recvBottleY.value = withTiming(0, { duration: 2000, easing: Easing.out(Easing.cubic) });
        recvBottleOpacity.value = withTiming(1, { duration: 2000, easing: Easing.ease });
        
        setTimeout(() => {
          setPhase('received');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 2000);
      }, 3000);
      
    }, 2000);
  };

  const throwStyle = useAnimatedStyle(() => ({
    opacity: bottleOpacity.value,
    transform: [
      { translateY: bottleY.value },
      { scale: bottleScale.value },
      { rotate: '15deg' }
    ]
  }));

  const receiveStyle = useAnimatedStyle(() => ({
    opacity: recvBottleOpacity.value,
    transform: [
      { translateY: recvBottleY.value },
      { rotate: '-10deg' }
    ]
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: waveOffset.value }]
  }));

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1a293b' : '#e0f7fa' }}>
      <LinearGradient
        colors={[isDark ? '#0F172A' : '#E0F2FE', isDark ? '#1E293B' : '#BAE6FD']}
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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Mensaje en una Botella</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.content}>
          
          {/* Ocean Scene shared across phases */}
          <Animated.View style={[styles.oceanSimulator, waveStyle]}>
             {phase === 'write' || phase === 'sending' ? (
                <Animated.View style={[styles.bottleIconWrap, throwStyle]}>
                  <Ionicons name="paper-plane" size={64} color="#38BDF8" style={styles.bottleDropShadow} />
                </Animated.View>
             ) : null}

             {phase === 'waiting' ? (
               <Animated.View entering={FadeIn.duration(1000)} style={{ alignItems: 'center' }}>
                 <Text style={{ fontSize: 40 }}>🌊</Text>
                 <Text style={{ fontFamily: 'Poppins_500Medium', color: colors.textSecondary, marginTop: 12 }}>Esperando a la marea...</Text>
               </Animated.View>
             ) : null}

             {phase === 'received' || phase === 'waiting' && recvBottleOpacity.value > 0 ? (
                <Animated.View style={[styles.bottleIconWrap, receiveStyle]}>
                  <Ionicons name="mail-open" size={64} color="#4ADE80" style={styles.bottleDropShadow} />
                </Animated.View>
             ) : null}
          </Animated.View>

          {/* Contextual UI */}
          {phase === 'write' && (
            <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(400)} style={styles.writePhaseContainer}>
              <Text style={[styles.instructionTitle, { color: colors.textPrimary }]}>Alienta a un extraño.</Text>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                Escribe un mensaje anónimo de apoyo. Lo lanzaremos al mar digital, y a cambio, recibirás una botella que alguien más dejó para ti.
              </Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: 'rgba(56, 189, 248, 0.3)', backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }]}
                  placeholder="Escribe palabras de aliento..."
                  placeholderTextColor={colors.textLight}
                  value={text}
                  onChangeText={setText}
                  multiline
                  maxLength={150}
                />
                <Text style={[styles.charCount, { color: colors.textLight }]}>{text.length}/150</Text>
              </View>

              <Pressable 
                style={({ pressed }) => [
                  styles.sendButton, 
                  { backgroundColor: text.length > 5 ? '#38BDF8' : colors.bgSecondary },
                  pressed && { transform: [{ scale: 0.96 }] }
                ]}
                onPress={handleSend}
                disabled={text.length <= 5}
              >
                <Text style={[styles.sendButtonText, { color: text.length > 5 ? '#FFF' : colors.textLight }]}>Lanzar al Mar</Text>
              </Pressable>
            </Animated.View>
          )}

          {phase === 'received' && (
            <Animated.View entering={FadeIn.duration(800)} style={styles.receivedPhaseContainer}>
              <Text style={[styles.receivedLabel, { color: colors.textSecondary }]}>Alguien en el mundo escribió esto:</Text>
              
              <GlassCard style={{ padding: 24, alignItems: 'center', marginTop: 16 }}>
                 <Ionicons name="water-outline" size={24} color="#38BDF8" style={{ marginBottom: 12 }} />
                 <Text style={[styles.receivedText, { color: colors.textPrimary }]}>"{receivedMessage}"</Text>
              </GlassCard>

              <Pressable 
                style={({ pressed }) => [
                  styles.doneButton,
                  pressed && { transform: [{ scale: 0.96 }] }
                ]}
                onPress={() => router.back()}
              >
                <Text style={styles.doneButtonText}>Guardar en el corazón</Text>
              </Pressable>
            </Animated.View>
          )}

        </View>
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
  oceanSimulator: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bottleIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottleDropShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  writePhaseContainer: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    height: 140,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    paddingTop: 20,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    textAlignVertical: 'top',
  },
  charCount: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  sendButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  receivedPhaseContainer: {
    flex: 1,
    paddingTop: 20,
  },
  receivedLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  receivedText: {
    fontSize: 20,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    lineHeight: 30,
    fontStyle: 'italic',
  },
  doneButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#38BDF8',
    marginTop: 40,
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#38BDF8',
  }
});
