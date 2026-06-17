/**
 * WeeklyProgressRing — Anillo de progreso semanal animado con SVG.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, useAnimatedStyle, withTiming, Easing, FadeInUp,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface WeeklyProgressRingProps {
  data: number[];
  size?: number;
  strokeWidth?: number;
}

export function WeeklyProgressRing({ data, size = 160, strokeWidth = 12 }: WeeklyProgressRingProps) {
  const { colors } = useTheme();
  const total = data.reduce((acc, val) => acc + val, 0);
  const average = total / (data.length || 1);
  const progress = Math.min(average / 5, 1);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 1500, easing: Easing.out(Easing.exp) });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const scoreText = Math.round(progress * 100);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 16 }}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary + '20'}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
            animatedProps={animatedProps}
          />
        </Svg>
        
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
           <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <Animated.Text 
                entering={FadeInUp.delay(500)}
                style={{ fontSize: 32, fontWeight: '700', color: colors.textPrimary, fontFamily: 'Poppins_700Bold' }}
              >
                {scoreText}%
              </Animated.Text>
              <Animated.Text 
                entering={FadeInUp.delay(600)}
                style={{ fontSize: 12, color: colors.textLight, fontFamily: 'Poppins_400Regular' }}
              >
                Bienestar Semanal
              </Animated.Text>
           </View>
        </View>
      </View>
    </View>
  );
}
