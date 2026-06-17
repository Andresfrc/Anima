import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, AppState, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import SplashScreenComponent from '../components/SplashScreen';
import { useStore } from '../store/useStore';
import { NotificationService } from '../utils/NotificationService';

// Silencia el falso error de Expo Go sobre notificaciones remotas
LogBox.ignoreLogs(['expo-notifications: Android Push notifications', 'Failed to schedule the notification']);

// Prevent native splash from auto-hiding (font loading)
SplashScreen.preventAutoHideAsync().catch(() => {});
import { ThemeProvider } from '../context/ThemeContext';
import { RootBackground } from '../components/RootBackground';

function AppLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const currentPlan = useStore((s) => s.currentPlan);
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);

  // Load premium fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!showSplash) {
      if (!isAuthenticated) {
        router.replace('/(auth)/login');
      } else if (!currentPlan) {
        router.replace('/(onboarding)/triage');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [showSplash, isAuthenticated, currentPlan]);

  // Initialize notifications
  useEffect(() => {
    if (notificationsEnabled && isAuthenticated) {
      NotificationService.requestPermissionsAsync().then((granted) => {
        if (granted) {
          NotificationService.scheduleMorningQuote('Tu cuerpo y mente merecen un momento de paz hoy.');
          NotificationService.scheduleEveningJournal();
          NotificationService.scheduleInactivityReminder();
        }
      });
    }
  }, [notificationsEnabled, isAuthenticated]);

  // Handle AppState to reset inactivity reminder
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/) && notificationsEnabled) {
        NotificationService.scheduleInactivityReminder();
      }
    });
    return () => subscription.remove();
  }, [notificationsEnabled]);

  // Wait for fonts to load before anything
  if (!fontsLoaded) {
    return null;
  }

  if (showSplash) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <StatusBar style="dark" />
        <SplashScreenComponent onFinish={() => setShowSplash(false)} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: 'transparent' },
      }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="actividades/respiracion"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="actividades/gratitud"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootBackground>
        <AppLayout />
      </RootBackground>
    </ThemeProvider>
  );
}
