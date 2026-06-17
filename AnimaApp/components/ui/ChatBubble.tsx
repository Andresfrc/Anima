/**
 * ChatBubble + TypingIndicator — Componentes del sistema de chat.
 */
import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Gradients, BorderRadius } from '../../constants/theme';

interface ChatBubbleProps {
  text: string;
  isUser: boolean;
  showAvatar?: boolean;
  userAvatarSource?: any;
}

export function ChatBubble({ text, isUser, showAvatar, userAvatarSource }: ChatBubbleProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && showAvatar && (
        <LinearGradient colors={[...Gradients.jewel]} style={styles.bubbleAvatar}>
          <Ionicons name="happy-outline" size={16} color="#FFF" />
        </LinearGradient>
      )}
      <View style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleBot,
        isUser ? { backgroundColor: colors.primary } : { 
          backgroundColor: isDark ? colors.bgCard : 'rgba(255,255,255,0.9)',
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' 
        }
      ]}>
        <Text style={[
          styles.bubbleText, 
          isUser ? { color: '#FFF' } : { color: colors.textPrimary }
        ]}>{text}</Text>
      </View>
      {isUser && userAvatarSource && (
        <Image source={userAvatarSource} style={{ width: 28, height: 28, borderRadius: 14, marginLeft: 8 }} />
      )}
    </View>
  );
}

export function TypingIndicator() {
  const { colors, isDark } = useTheme();
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(withSequence(withTiming(-4, { duration: 300 }), withTiming(0, { duration: 300 })), -1);
    dot2.value = withDelay(150, withRepeat(withSequence(withTiming(-4, { duration: 300 }), withTiming(0, { duration: 300 })), -1));
    dot3.value = withDelay(300, withRepeat(withSequence(withTiming(-4, { duration: 300 }), withTiming(0, { duration: 300 })), -1));
  }, []);

  const d1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const d2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const d3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <View style={[styles.bubbleRow]}>
      <LinearGradient colors={[...Gradients.jewel]} style={styles.bubbleAvatar}>
        <Ionicons name="happy-outline" size={16} color="#FFF" />
      </LinearGradient>
      <View style={[
        styles.bubble, styles.bubbleBot, 
        { 
          flexDirection: 'row', gap: 4, paddingVertical: 14,
          backgroundColor: isDark ? colors.bgCard : 'rgba(255,255,255,0.9)',
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
        }
      ]}>
        <Animated.View style={[styles.typingDot, d1, { backgroundColor: colors.textLight }]} />
        <Animated.View style={[styles.typingDot, d2, { backgroundColor: colors.textLight }]} />
        <Animated.View style={[styles.typingDot, d3, { backgroundColor: colors.textLight }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  bubbleRowUser: { flexDirection: 'row-reverse' },
  bubbleAvatar: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: BorderRadius.large,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  bubbleText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  typingDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: Colors.textLight,
  },
});
