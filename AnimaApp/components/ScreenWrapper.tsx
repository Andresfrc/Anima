import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenWrapper({ children, style }: ScreenWrapperProps) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
