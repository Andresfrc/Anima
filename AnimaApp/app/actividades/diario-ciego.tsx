import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { BlurView } from 'expo-blur';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { JewelButton } from '../../components/ui';

export default function DiarioCiegoScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [text, setText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animation values for the "fading" effect
  const textOpacity = useSharedValue(1);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input automatically
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  }, []);

  const handleTextChange = (val: string) => {
    setText(val);
    
    // Light haptic feedback to simulate old typewriter or tactile feel
    if (val.length > text.length) {
      if (val.length % 5 === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    // Reset opacity to 1 while typing
    textOpacity.value = withTiming(1, { duration: 100 });

    // After 1 second of no typing, fade the text out quickly
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      textOpacity.value = withTiming(0.0, { duration: 1000, easing: Easing.inOut(Easing.ease) });
    }, 1000);
  };

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Keyboard.dismiss();
    setIsFinished(true);
  };

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={[isDark ? '#1a1829' : '#f5f7fa', isDark ? '#12101c' : '#e4e9f2']}
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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Diario Ciego</Text>
          <View style={{ width: 44 }} />
        </View>

        {!isFinished ? (
          <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(300)} style={styles.content}>
            <View style={styles.instructionBox}>
              <Ionicons name="eye-off-outline" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
              <Text style={[styles.instructionTitle, { color: colors.textPrimary }]}>Escribe sin juzgarte.</Text>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                Tus palabras se desvanecerán en la oscuridad unos segundos después de escribirlas. Libera tu mente.
              </Text>
            </View>

            <Animated.View style={[styles.inputContainer, animatedTextStyle]}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.textPrimary }]}
                multiline
                placeholder="Empieza a escribir aquí..."
                placeholderTextColor={colors.textLight}
                value={text}
                onChangeText={handleTextChange}
                autoCorrect={false}
                spellCheck={false}
              />
            </Animated.View>

            {text.length > 10 && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.finishButtonContainer}>
                <JewelButton 
                  title="Soltar y Dejar ir" 
                  icon="paper-plane-outline" 
                  colors={['#B39DDB', '#9575CD']} 
                  onPress={handleFinish} 
                />
              </Animated.View>
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(800)} style={styles.successContainer}>
            <Ionicons name="sparkles" size={64} color="#B39DDB" style={{ marginBottom: 24 }} />
            <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Lo has dejado ir.</Text>
            <Text style={[styles.successText, { color: colors.textSecondary }]}>
              Escribir tus miedos e incertidumbres es el primer paso para quitarles su poder sobre ti. Tu mente ahora tiene más espacio.
            </Text>
            <JewelButton 
              title="Volver" 
              icon="checkmark" 
              style={{ marginTop: 40 }}
              colors={['#B39DDB', '#9575CD']} 
              onPress={() => router.back()} 
            />
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </ScreenWrapper>
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
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 32,
    textAlignVertical: 'top',
  },
  finishButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
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
