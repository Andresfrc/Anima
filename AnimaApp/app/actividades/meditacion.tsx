import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence, 
  Easing,
  cancelAnimation 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { SoundService } from '../../utils/SoundService';
import { GlassCard, FloatingParticles } from '../../components/ui';

const { width, height } = Dimensions.get('window');

const AMBIENT_SOUNDS = [
  { id: 'ocean', title: 'Olas del Mar', icon: 'water-outline' },
  { id: 'rain', title: 'Lluvia Serena', icon: 'rainy-outline' },
  { id: 'fire', title: 'Fuego Cálido', icon: 'flame-outline' },
  { id: 'birds', title: 'Bosque y Aves', icon: 'leaf-outline' },
];

export default function MeditacionScreen() {
  const router = useRouter();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSoundId, setActiveSoundId] = useState<string>('ocean');
  
  // Custom Hook definition for the Breathing scale animation
  const breatheScale = useSharedValue(1);

  // When 'isPlaying' toggles, start or stop the breathing animation loop
  useEffect(() => {
    if (isPlaying) {
      // Slow rhythmic expanding and contracting (simulating deep breaths)
      breatheScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 4000, easing: Easing.inOut(Easing.quad) }), // Breathe In (4s)
          withTiming(1.0, { duration: 4500, easing: Easing.inOut(Easing.quad) })  // Breathe Out (4.5s)
        ),
        -1, // Infinite loop
        true // Reverse
      );
      SoundService.playAmbient(activeSoundId);
    } else {
      breatheScale.value = withTiming(1, { duration: 1000 });
      SoundService.stopAmbient();
    }
  }, [isPlaying, activeSoundId]);

  // CRITICAL CLEANUP: Stop sounds immediately if user leaves the screen
  useEffect(() => {
    return () => {
      SoundService.stopAmbient();
      cancelAnimation(breatheScale);
    };
  }, []);

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
    opacity: isPlaying ? 0.8 : 0.3
  }));

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSelectSound = (soundId: string) => {
    setActiveSoundId(soundId);
    if (!isPlaying) {
      setIsPlaying(true); // Auto-play if they tap a different sound
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E1B4B', '#020617']}
        style={StyleSheet.absoluteFillObject}
      />
      <FloatingParticles count={25} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Meditación Guiada</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Breathing Orb Player */}
        <View style={styles.playerSection}>
          <Animated.View style={[styles.glowingOrb, animatedCircleStyle]}>
            <LinearGradient
              colors={['rgba(129, 140, 248, 0.4)', 'rgba(56, 189, 248, 0.1)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          <View style={styles.controlsContainer}>
            <Text style={styles.statusText}>
              {isPlaying ? 'Respira profundamente...' : 'Toca para comenzar'}
            </Text>

            <Pressable onPress={togglePlay} style={styles.playButton}>
              <GlassCard intensity={30} style={styles.playGlass}>
                <Ionicons 
                  name={isPlaying ? 'pause' : 'play'} 
                  size={46} 
                  color="#FFFFFF" 
                  style={{ marginLeft: isPlaying ? 0 : 6 }} 
                />
              </GlassCard>
            </Pressable>
          </View>
        </View>

        {/* Sound Selection Carousel */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.selectorSection}>
          <Text style={styles.selectorTitle}>Entorno Inmersivo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.soundList}>
            {AMBIENT_SOUNDS.map((sound) => {
              const isActive = activeSoundId === sound.id;
              return (
                <Pressable key={sound.id} onPress={() => handleSelectSound(sound.id)}>
                  <GlassCard style={[styles.soundCard, isActive && styles.activeSoundCard] as any}>
                    <Ionicons 
                      name={sound.icon as any} 
                      size={24} 
                      color={isActive ? '#818CF8' : '#94A3B8'} 
                    />
                    <Text style={[styles.soundText, isActive && styles.activeSoundText]}>
                      {sound.title}
                    </Text>
                  </GlassCard>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  playerSection: {
    height: height * 0.45,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  glowingOrb: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    overflow: 'hidden',
  },
  controlsContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  statusText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  playButton: {
    width: 100,
    height: 100,
  },
  playGlass: {
    flex: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectorSection: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  selectorTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  soundList: {
    gap: 12,
    paddingRight: 40,
  },
  soundCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activeSoundCard: {
    borderColor: 'rgba(129, 140, 248, 0.5)',
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
  },
  soundText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: '#94A3B8',
  },
  activeSoundText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  }
});
