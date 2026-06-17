import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, BorderRadius, Gradients } from '../constants/theme';

// ============ Premium Gradient Card ============
interface PremiumCardProps {
  children: React.ReactNode;
  colors?: string[];
  style?: ViewStyle;
  onPress?: () => void;
}

export function PremiumCard({ children, colors, style, onPress }: PremiumCardProps) {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const handlePressIn = () => {
    if (onPress) scaleValue.value = withSpring(0.97, { damping: 15 });
  };
  const handlePressOut = () => {
    if (onPress) scaleValue.value = withSpring(1, { damping: 15 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
    >
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={(colors || ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']) as unknown as readonly [string, string, ...string[]]}
          style={[styles.premiumCard, style]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {children}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ============ Shimmer Effect ============
interface ShimmerProps {
  width: number;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Shimmer({ width, height, borderRadius = 8, style }: ShimmerProps) {
  const shimmerAnim = useSharedValue(0);

  React.useEffect(() => {
    shimmerAnim.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerAnim.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: 'rgba(91,155,213,0.08)',
        },
        shimmerStyle,
        style,
      ]}
    />
  );
}

// ============ Badge ============
interface BadgeProps {
  label: string;
  color?: string;
  icon?: string;
}

export function Badge({ label, color = Colors.primary, icon }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '15', borderColor: color + '30' }]}>
      {icon && <Ionicons name={icon as any} size={12} color={color} />}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ============ Floating Action Button ============
interface FABProps {
  icon: string;
  onPress: () => void;
  color?: string[];
}

export function FloatingActionButton({ icon, onPress, color }: FABProps) {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scaleValue.value = withSpring(0.9); }}
      onPressOut={() => { scaleValue.value = withSpring(1); }}
      style={styles.fabContainer}
    >
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={(color || Gradients.jewel) as unknown as readonly [string, string, ...string[]]}
          style={styles.fab}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon as any} size={26} color="#FFF" />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  premiumCard: {
    borderRadius: BorderRadius.large,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    ...Shadows.medium,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glow,
  },
});
