import '../utils/silenceLogs'; // Silencia console.log/info/debug en producción (primer efecto).
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
import { supabase } from '../lib/supabase'; // ← FIX: importar supabase para auto-migración
import XPToast from '../components/ui/XPToast';

// Silencia el falso error de Expo Go sobre notificaciones remotas
LogBox.ignoreLogs(['expo-notifications: Android Push notifications', 'Failed to schedule the notification']);

// Prevent native splash from auto-hiding (font loading)
SplashScreen.preventAutoHideAsync().catch(() => {});
import { ThemeProvider } from '../context/ThemeContext';
import { RootBackground } from '../components/RootBackground';
import { ErrorBoundary } from '../components/ErrorBoundary';

function AppLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const hasHydrated = useStore((s) => s._hasHydrated);
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

  // ── FIX: Auto-migración de userId para usuarios existentes ──────────────
  // Si el usuario está autenticado pero el store no tiene userId (loguearon
  // antes de que el store guardara userId), lo recuperamos de Supabase Auth.
  // Corre solo una vez: después de hidratación y cuando isAuthenticated es true.
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;

    const userId = useStore.getState().userId;
    if (userId) return; // Ya tiene UUID, nada que hacer

    // userId es null pero está autenticado → recuperar de Supabase
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) return;
      useStore.getState().login(
        user.id,
        user.email || useStore.getState().userEmail,
        useStore.getState().userName
      );
      console.log('[Layout] userId sincronizado desde Supabase Auth:', user.id);
    });
  }, [hasHydrated, isAuthenticated]);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Solo redirigir cuando (1) el splash terminó —garantiza que el Stack ya se
    // montó en el commit de este cambio, así router.replace no truena con
    // "navigate before mounting"— y (2) el store hidrató desde AsyncStorage —si
    // no, isAuthenticated aún es false y se ve un flash del login antes de entrar.
    if (showSplash || !hasHydrated) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else if (!currentPlan) {
      router.replace('/(onboarding)/triage');
    } else {
      router.replace('/(tabs)');
    }
  }, [showSplash, hasHydrated, isAuthenticated, currentPlan]);

  // Initialize notifications — recordatorios diarios personalizados según la ruta.
  useEffect(() => {
    if (notificationsEnabled && isAuthenticated) {
      NotificationService.requestPermissionsAsync().then((granted) => {
        if (granted) {
          NotificationService.scheduleDailyReminders(currentPlan);
        }
      });
    }
  }, [notificationsEnabled, isAuthenticated, currentPlan]);

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

  // FIX: mientras el splash esté activo O el store no haya hidratado, mostramos
  // el splash a pantalla completa y NO montamos el Stack. Así:
  //  - el flash del login desaparece (no se decide la ruta con datos a medias)
  //  - router.replace nunca corre antes de que exista el navegador
  if (showSplash || !hasHydrated) {
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
      <XPToast />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <RootBackground>
          <AppLayout />
        </RootBackground>
      </ThemeProvider>
    </ErrorBoundary>
  );
}