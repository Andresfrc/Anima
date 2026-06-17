import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Local mapping to avoid circular dependencies with SoundService for this specific mix puzzle
const TRACKS = [
  { id: 'rain', file: require('../../../assets/sounds/rain.mp3'), title: 'Lluvia', icon: 'rainy' },
  { id: 'fire', file: require('../../../assets/sounds/fire.mp3'), title: 'Fuego', icon: 'flame' },
  { id: 'birds', file: require('../../../assets/sounds/birds.mp3'), title: 'Bosque', icon: 'leaf' },
];

interface AuralGroundingProps {
  onComplete: () => void;
}

export function AuralGrounding({ onComplete }: AuralGroundingProps) {
  const [sounds, setSounds] = useState<Record<string, Audio.Sound>>({});
  const [activeTracks, setActiveTracks] = useState<Record<string, boolean>>({
    rain: true, fire: true, birds: true
  });

  const [isReady, setIsReady] = useState(false);

  // Initialize and play all tracks on mount
  useEffect(() => {
    let isMounted = true;
    const loadedSounds: Record<string, Audio.Sound> = {};

    const loadAudio = async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        
        for (const track of TRACKS) {
          const { sound } = await Audio.Sound.createAsync(track.file, { isLooping: true, volume: 0.5 });
          loadedSounds[track.id] = sound;
        }

        if (isMounted) {
          setSounds(loadedSounds);
          setIsReady(true);
          // Play all simultaneously
          Object.values(loadedSounds).forEach(s => s.playAsync());
        }
      } catch (error) {
        console.warn('Audiomix failed', error);
      }
    };

    loadAudio();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      Object.values(loadedSounds).forEach(s => {
        s.stopAsync().then(() => s.unloadAsync()).catch(()=>{});
      });
    };
  }, []);

  // Monitor success condition
  useEffect(() => {
    const allDisabled = Object.values(activeTracks).every(status => !status);
    if (allDisabled && isReady) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(onComplete, 1500);
    }
  }, [activeTracks, isReady]);

  const toggleTrack = async (id: string) => {
    const isCurrentlyActive = activeTracks[id];
    const sound = sounds[id];
    
    if (sound) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (isCurrentlyActive) {
        // Fade out or just stop
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      
      setActiveTracks(prev => ({ ...prev, [id]: !isCurrentlyActive }));
    }
  };

  if (!isReady) {
    return <Text style={{ color: 'white', opacity: 0.5 }}>Cargando entorno acústico...</Text>;
  }

  return (
    <View style={styles.container}>
      {TRACKS.map((track, i) => {
        const isActive = activeTracks[track.id];
        return (
          <Animated.View key={track.id} entering={FadeIn.delay(i * 150)}>
            <Pressable onPress={() => toggleTrack(track.id)}>
              <View style={[styles.card, !isActive && styles.cardDisabled, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                <View style={styles.row}>
                  <View style={[styles.iconBox, isActive ? styles.iconActive : styles.iconMuted]}>
                    <Ionicons name={track.icon as any} size={24} color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.4)'} />
                  </View>
                  <Text style={[styles.title, !isActive && styles.titleMuted]}>{track.title}</Text>
                  
                  <View style={styles.switchBoundary}>
                    <View style={[styles.switchTrack, isActive ? styles.trackActive : styles.trackInactive]}>
                      <View style={[styles.switchThumb, isActive ? styles.thumbActive : styles.thumbInactive]} />
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardDisabled: {
    borderColor: 'rgba(255,255,255,0.02)',
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  iconMuted: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  titleMuted: {
    color: 'rgba(255,255,255,0.4)',
    textDecorationLine: 'line-through',
  },
  switchBoundary: {
    width: 50,
  },
  switchTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  trackActive: {
    backgroundColor: '#38BDF8',
  },
  trackInactive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  thumbActive: {
    transform: [{ translateX: 22 }],
  },
  thumbInactive: {
    transform: [{ translateX: 0 }],
  }
});
