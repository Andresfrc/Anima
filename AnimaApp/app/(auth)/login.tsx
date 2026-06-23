import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Pressable, ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, interpolate, cancelAnimation } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Gradients } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { Mascot } from '../../components/ui';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { ParticlesBackground } from '../../components/ui/ParticlesBackground';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';
import { isValidEmail, friendlyAuthError } from '../../utils/validation';

const { width: SCREEN_W } = Dimensions.get('window');

// Animated decorative orb
function FloatingOrb({ delay, color, size, top, left }: {
  delay: number; color: string; size: number; top: number; left: number;
}) {
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 + delay, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000 + delay, easing: Easing.inOut(Easing.ease) }),
      ), -1, true
    );
    return () => cancelAnimation(anim);
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(anim.value, [0, 1], [0, -15]) },
      { scale: interpolate(anim.value, [0, 1], [1, 1.15]) },
    ],
    opacity: interpolate(anim.value, [0, 0.5, 1], [0.3, 0.5, 0.3]),
  }));

  return (
    <Animated.View style={[{
      position: 'absolute', top, left,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color,
    }, orbStyle]} />
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async () => {
    // En login NO exigimos la política nueva de 8 caracteres: usuarios existentes
    // pueden tener contraseñas más cortas. Solo validamos formato básico; la
    // verificación real la hace Supabase.
    if (!isValidEmail(email) || password.length === 0) {
      setAuthError('Ingresa un correo válido y tu contraseña.');
      return;
    }

    setAuthError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setAuthError(friendlyAuthError(error.message));
        return;
      }

      const user = data.user;
      if (!user) {
        setAuthError('Correo o contraseña incorrectos.');
        return;
      }

      // Obtener nombre, plan y avatar desde profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, plan, avatar')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // No bloqueamos el login por esto; solo lo registramos en dev.
        console.warn('Profile fetch error:', profileError.message);
      }

      let username = user.email ? user.email.split('@')[0] : 'Usuario';
      let fetchedPlan: string | null = null;
      let fetchedAvatar: string | null = null;

      if (profile) {
        if (profile.username) username = profile.username;
        if (profile.plan) fetchedPlan = profile.plan;
        if (profile.avatar !== undefined && profile.avatar !== null) fetchedAvatar = profile.avatar;
      }

      // Restauramos estado local ANTES de marcar isAuthenticated.
      // La navegación la decide exclusivamente el layout raíz (_layout.tsx)
      // según isAuthenticated + currentPlan, evitando race conditions.
      if (fetchedPlan) useStore.getState().setPlan(fetchedPlan);
      if (fetchedAvatar !== null) useStore.getState().setProfileAvatar(fetchedAvatar);

      login(user.id, user.email || '', username); 
      // No navegamos aquí: el layout raíz redirige automáticamente.
    } catch (err: any) {
      setAuthError(friendlyAuthError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Premium gradient background */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E1B4B'] : [...Gradients.loginBg]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative floating orbs */}
      <FloatingOrb delay={0} color="rgba(91,155,213,0.12)" size={120} top={60} left={-30} />
      <FloatingOrb delay={500} color="rgba(155,142,196,0.10)" size={100} top={140} left={SCREEN_W - 60} />
      <FloatingOrb delay={1000} color="rgba(168,230,207,0.12)" size={80} top={SCREEN_W * 0.8} left={20} />
      <FloatingOrb delay={800} color="rgba(247,201,126,0.10)" size={60} top={SCREEN_W * 0.5} left={SCREEN_W - 40} />

      <ParticlesBackground count={15} />

      {/* Loading Overlay */}
      {loading && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.loadingOverlay, { backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(232,244,253,0.8)' }]}
        >
          <Animated.View entering={FadeInUp.duration(400)}>
            <GlassCard style={styles.loadingCard}>
              <View style={{ alignItems: 'center' }}>
                <Mascot size={90} variant="resting" />
                <View style={styles.loadingDots}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
                <Text style={[styles.loadingTitle, { color: colors.textPrimary }]}>Iniciando sesión</Text>
                <Text style={[styles.loadingSubtext, { color: colors.textLight }]}>Preparando tu espacio...</Text>
              </View>
            </GlassCard>
          </Animated.View>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mascot */}
          <AnimatedEntrance delay={0} from="top">
            <View style={styles.mascotSection}>
              <Mascot size={140} variant="greeting" />
            </View>
          </AnimatedEntrance>

          {/* Title */}
          <AnimatedEntrance delay={100} from="top">
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Bienvenido a Ánima</Text>
              <Text style={[styles.subtitle, { color: colors.textLight }]}>Tu compañero emocional</Text>
            </View>
          </AnimatedEntrance>

          {/* Form Card via GlassCard */}
          <AnimatedEntrance delay={200} from="bottom">
            <GlassCard style={styles.formContainer}>
              <View style={styles.formContent}>
                <View style={[
                  styles.inputWrap, 
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F7FAFC',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    borderWidth: 1 
                  }
                ]}>
                  <Ionicons name="mail-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="Correo electrónico"
                    placeholderTextColor={colors.textLight}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setAuthError(null); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    accessibilityLabel="Correo electrónico"
                  />
                </View>

                <View style={[
                  styles.inputWrap, 
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F7FAFC',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    borderWidth: 1 
                  }
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="Contraseña"
                    placeholderTextColor={colors.textLight}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setAuthError(null); }}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    accessibilityLabel="Contraseña"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textLight} />
                  </Pressable>
                </View>

                <Pressable style={styles.forgotLink} onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </Pressable>

                {authError && (
                  <Animated.View entering={FadeIn.duration(250)} style={styles.errorWrap}>
                    <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
                    <Text style={styles.errorText}>{authError}</Text>
                  </Animated.View>
                )}

                <PremiumButton
                  title="Iniciar Sesión"
                  onPress={handleLogin}
                  variant="primary"
                  icon={<Ionicons name="log-in-outline" size={24} color="#FFF" />}
                  style={{ marginTop: 8 }}
                />
              </View>
            </GlassCard>
          </AnimatedEntrance>

          {/* Register link */}
          <AnimatedEntrance delay={400}>
            <View style={styles.registerSection}>
              <Text style={[styles.registerText, { color: colors.textSecondary }]}>¿No tienes cuenta? </Text>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text style={[styles.registerLink, { color: colors.primary }]}>Crear Cuenta</Text>
              </Pressable>
            </View>
          </AnimatedEntrance>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: 40,
  },
  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 100,
  },
  loadingCard: {
    borderRadius: 32, paddingVertical: 36, paddingHorizontal: 40,
    alignItems: 'center',
  },
  loadingDots: { marginTop: 16 },
  loadingTitle: {
    marginTop: 14, fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  loadingSubtext: {
    marginTop: 4, fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  mascotSection: {
    alignItems: 'center', marginBottom: 20,
  },
  titleSection: {
    alignItems: 'center', marginBottom: 32,
  },
  title: {
    fontSize: 28, fontWeight: '700', color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16, color: Colors.textLight, marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },
  formContainer: {
    borderRadius: 28,
  },
  formContent: {
    padding: 24,
    gap: 16,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1, height: '100%', fontSize: 15, color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  eyeBtn: { padding: 4 },
  errorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
  },
  errorText: { flex: 1, fontSize: 12, color: '#EF4444', fontFamily: 'Poppins_400Regular' },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 8 },
  forgotText: {
    fontSize: 13, color: Colors.primary, fontFamily: 'Poppins_500Medium',
  },
  registerSection: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: 32,
  },
  registerText: { fontSize: 14, color: Colors.textSecondary },
  registerLink: {
    fontSize: 14, color: Colors.primary, fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
});
