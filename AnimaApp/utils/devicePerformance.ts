import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type PerformanceTier = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Detects the device performance tier roughly based on OS and Age.
 */
export function getDeviceTier(): PerformanceTier {
  // 1. iOS Devices: Generally optimized, but older ones might struggle
  if (Platform.OS === 'ios') {
    // Basic heuristic: Assume recent iPhones (iPhone 11+) are HIGH
    // For now, let's treat almost all iOS as HIGH for this app's animations
    // unless it's very old (not easily detectable without mapping model ID)
    return 'HIGH';
  }

  // 2. Android Devices
  if (Platform.OS === 'android') {
    // Device.yearClass gives an estimation of the year the device would be considered "high end"
    // e.g., 2016, 2018, 2020...
    const year = Device.deviceYearClass; 
    
    // If year is null/undefined (emulator or unknown), fallback to MEDIUM
    if (!year) return 'MEDIUM';

    if (year >= 2021) return 'HIGH'; // Modern Androids (S21+, Pixel 6+, etc.)
    if (year >= 2018) return 'MEDIUM'; // Mid-range or older flagships
    return 'LOW'; // Older entry-level
  }

  // 3. Web / others
  return 'MEDIUM';
}

// Configuration based on Tier
export const PERFORMANCE_CONFIG = {
  HIGH: {
    starCount: 40,
    blurEnabled: true,
    particleEffects: true,
  },
  MEDIUM: {
    starCount: 25, // Increased from 15
    blurEnabled: false,
    particleEffects: true,
  },
  LOW: {
    starCount: 15, // Increased from 8
    blurEnabled: false,
    particleEffects: false,
  },
};

export const CURRENT_TIER = getDeviceTier();
export const CURRENT_CONFIG = PERFORMANCE_CONFIG[CURRENT_TIER];
