import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassCard, JewelButton, FeatureButton } from '../../components/ui';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, useAnimatedStyle, withTiming, withSequence, withSpring,
  interpolateColor, runOnJS, FadeInUp, ZoomIn, FadeOut, withDelay
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function CapsulaDePapelScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [text, setText] = useState('');
  const [isBurning, setIsBurning] = useState(false);
  const [isBurned, setIsBurned] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Animation values
  const paperScale = useSharedValue(1);
  const paperRotate = useSharedValue(0);
  const paperOpacity = useSharedValue(1);
  const burnProgress = useSharedValue(0); // 0 to 1

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadAndPlayFireSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/Burning-paper.mp3'),
        { shouldPlay: true, volume: 1.0, isLooping: false } 
      );
      setSound(newSound);
    } catch (error) {
      console.log('Error playing fire sound', error);
    }
  };

  const handleBurn = () => {
    if (!text.trim() || isBurning) return;
    
    setIsBurning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    loadAndPlayFireSound();

    // Trigger Reanimated sequence: crumple, spin, turn to ash, and fade away
    burnProgress.value = withTiming(1, { duration: 3000 });
    paperRotate.value = withTiming(15, { duration: 3000 });
    paperScale.value = withSequence(
      withTiming(0.9, { duration: 500 }), // crumple slightly
      withTiming(0.2, { duration: 2500 }) // shrink into ashes
    );
    paperOpacity.value = withSequence(
      withDelay(1500, withTiming(0, { duration: 1500 })) // fade out entirely at the end
    );
    
    // Once the 3-second animation is totally done, reset everything perfectly clean
    // so the user can just type again immediately.
    setTimeout(() => {
      resetActivity();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3000);
  };

  const resetActivity = () => {
    setIsBurning(false);
    setText('');
    paperScale.value = 1;
    paperRotate.value = 0;
    burnProgress.value = 0;
    // Delay 1 second, then smoothly fade in over 800ms
    paperOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));
  };

  const animatedPaperStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      burnProgress.value,
      [0, 0.5, 1],
      ['#FFFFFF', '#FFB347', '#333333'] // White -> Orange fire -> Ash
    );

    return {
      transform: [
        { scale: paperScale.value },
        { rotateZ: `${paperRotate.value}deg` }
      ],
      opacity: paperOpacity.value,
      backgroundColor: bgColor,
    };
  });

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FeatureButton icon="arrow-back" title="" color={colors.textPrimary} onPress={() => router.back()} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cápsula de Papel</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInUp.duration(400)} style={styles.introBox}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <Ionicons name="flame" size={32} color="#FF7E67" />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Desahogo Seguro</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Escribe todo lo que te molesta, te frustra o te da miedo... y luego presiona el botón para quemarlo y dejarlo ir.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.paperContainer, animatedPaperStyle]}>
            <TextInput
              style={[styles.textInput, isBurning && { opacity: 0.3 }]}
              placeholder="Hoy me siento abrumado porque..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={10}
              value={text}
              onChangeText={setText}
              editable={!isBurning}
              textAlignVertical="top"
            />
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>

      <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.footer}>
        <JewelButton 
          title={isBurning ? "Quemando..." : "Quemar pensamiento"} 
          onPress={handleBurn}
          disabled={text.trim().length === 0 || isBurning}
          colors={
            text.trim().length > 0 
              ? ['#FF5722', '#D84315'] // Spicy fiery orange/red gradient
              : (isDark ? ['#333333', '#111111'] : ['#E0E0E0', '#BDBDBD'])
          }
        />
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 10,
  },
  headerLeft: {
    flex: 1, alignItems: 'flex-start', zIndex: 10,
  },
  headerCenter: {
    flex: 3, alignItems: 'center',
  },
  headerRight: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18, fontFamily: 'Poppins_600SemiBold',
  },
  scrollContent: {
    padding: 24, paddingBottom: 100,
  },
  introBox: {
    alignItems: 'center', marginBottom: 30,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22, fontFamily: 'Poppins_700Bold', marginBottom: 8, textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22,
    paddingHorizontal: 20,
  },
  paperContainer: {
    width: '100%',
    minHeight: 300,
    borderRadius: 8,
    padding: 20,
    // Paper styling
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1, borderColor: '#EEEEEE',
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'IndieFlower_400Regular', // If we don't have this, it'll fallback safely, or we could use Poppins
    color: '#333333',
    lineHeight: 28,
  },
  footer: {
    position: 'absolute', bottom: 40, left: 24, right: 24,
  },
  burnedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
  },
  burnedText: {
    color: '#FFF', fontSize: 24, fontFamily: 'Poppins_700Bold', marginTop: 12,
    letterSpacing: 1,
  },
});
