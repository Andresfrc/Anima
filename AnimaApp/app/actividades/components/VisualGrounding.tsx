import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withRepeat,
  withSequence,
  runOnJS,
  FadeIn,
  cancelAnimation
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Define random starting positions for 5 stars
const TARGET_RADIUS = 60;
const CENTER_X = 0; // Relative to the container center
const CENTER_Y = 0;

interface VisualGroundingProps {
  onComplete: () => void;
}

export function VisualGrounding({ onComplete }: VisualGroundingProps) {
  const [collectedCount, setCollectedCount] = useState(0);
  const [showConstellation, setShowConstellation] = useState(false);

  // Center target pulse animation
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true
    );
    return () => cancelAnimation(pulseScale);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: showConstellation ? withTiming(0, { duration: 500 }) : 1
  }));

  // Trigger completion when 5 are collected
  useEffect(() => {
    if (collectedCount === 5) {
      setShowConstellation(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        onComplete();
      }, 3000);
    }
  }, [collectedCount]);

  return (
    <View style={styles.container}>
      {/* Central Target */}
      <Animated.View style={[styles.targetZone, pulseStyle]}>
        <Ionicons name="planet" size={40} color="rgba(255,255,255,0.2)" />
      </Animated.View>

      {/* Constellation Reward Animation */}
      {showConstellation && (
        <Animated.View entering={FadeIn.duration(1500)} style={styles.constellationZone}>
          <Ionicons name="sparkles" size={100} color="#FFD700" style={{ textShadowColor: 'rgba(255, 215, 0, 0.5)', textShadowRadius: 20 }} />
        </Animated.View>
      )}

      {/* Render 5 Draggable Stars */}
      {[0, 1, 2, 3, 4].map((index) => (
        <DraggableStar 
          key={index} 
          index={index} 
          onCaught={() => setCollectedCount(prev => prev + 1)} 
        />
      ))}
    </View>
  );
}

// Separate component for each star to manage its own gesture state independently
function DraggableStar({ index, onCaught }: { index: number, onCaught: () => void }) {
  const [isCaught, setIsCaught] = useState(false);
  
  // Start them chaotically distributed across the top half of the screen
  const initialX = (Math.random() - 0.5) * (width * 0.8);
  const initialY = -150 - (Math.random() * 200);

  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const scale = useSharedValue(isCaught ? 0 : 1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    return () => cancelAnimation(rotation);
  }, []);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      if (isCaught) return;
      // Vibrate/Shake visually
      rotation.value = withRepeat(
        withSequence(withTiming(-12, { duration: 50 }), withTiming(12, { duration: 50 })),
        -1,
        true
      );
    })
    .onStart(() => {
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (isCaught) return;
      translateX.value = offsetX.value + event.translationX;
      translateY.value = offsetY.value + event.translationY;
    })
    .onEnd(() => {
      if (isCaught) return;
      
      const distance = Math.sqrt(
        Math.pow(translateX.value, 2) + Math.pow(translateY.value, 2)
      );

      if (distance < TARGET_RADIUS + 30) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withTiming(0, { duration: 600 });
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        runOnJS(onCaught)();
        runOnJS(setIsCaught)(true);
      } else {
        translateX.value = withSpring(initialX);
        translateY.value = withSpring(initialY);
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onFinalize(() => {
      // Stop shaking
      rotation.value = withTiming(0, { duration: 100 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ]
  }));

  if (isCaught) return null; // Unmount after caught to save resources

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.starWrapper, animatedStyle]}>
        <Ionicons name="star" size={32} color="#FFD700" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  targetZone: {
    width: TARGET_RADIUS * 2,
    height: TARGET_RADIUS * 2,
    borderRadius: TARGET_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute'
  },
  starWrapper: {
    position: 'absolute',
    padding: 10, // increase touch target
  },
  constellationZone: {
    position: 'absolute',
    width: TARGET_RADIUS * 2,
    height: TARGET_RADIUS * 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  }
});
