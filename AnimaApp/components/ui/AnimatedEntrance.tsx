/**
 * AnimatedEntrance — Rewritten to use react-native-reanimated instead of moti.
 * moti was removed as a phantom dependency during the audit cleanup.
 */
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeInLeft, FadeInRight } from 'react-native-reanimated';

interface AnimatedEntranceProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  from?: 'bottom' | 'top' | 'left' | 'right';
}

export function AnimatedEntrance({ children, index = 0, delay = 100, style, from = 'bottom' }: AnimatedEntranceProps) {
  const totalDelay = index * delay;

  const getEntering = () => {
    switch (from) {
      case 'top': return FadeInUp.delay(totalDelay).duration(500).springify().damping(20).stiffness(100);
      case 'left': return FadeInLeft.delay(totalDelay).duration(500).springify().damping(20).stiffness(100);
      case 'right': return FadeInRight.delay(totalDelay).duration(500).springify().damping(20).stiffness(100);
      case 'bottom':
      default: return FadeInDown.delay(totalDelay).duration(500).springify().damping(20).stiffness(100);
    }
  };

  return (
    <Animated.View entering={getEntering()} style={style}>
      {children}
    </Animated.View>
  );
}
