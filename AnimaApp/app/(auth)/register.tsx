import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Pressable, ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import Animated, {
  FadeInUp, FadeIn, FadeOut, ZoomIn, FadeInDown,
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, Easing, interpolate, cancelAnimation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Gradients } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { JewelButton, Mascot, GlassCard } from '../../components/ui';
import { ParticlesBackground } from '../../components/ui/ParticlesBackground';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';
import { isValidEmail, validatePassword, getPasswordStrength, friendlyAuthError } from '../../utils/validation';

const { width: SCREEN_W } = Dimensions.get('window');

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

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const login = useStore((s) => s.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  // ─── nuevo: para mostrar errores inline en lugar de alert() ───────────────
  const [authError, setAuthError] = useState<string | null>(null);
  // ─── nuevo: para el estado de "confirma tu correo" ────────────────────────
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !isValidEmail(email)) {
      setAuthError('Escribe tu nombre y un correo electrónico válido.');
      return;
    }
    const pwError = validatePassword(password.trim());
    if (pwError) {
      setAuthError(pwError);
      return;
    }

    setAuthError(null);
    setLoading(true);

    try {
      // ── 1. Crear usuario en Supabase Auth ──────────────────────────────────
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: { full_name: name.trim() },
        },
      });

      if (error) {
        setAuthError(friendlyAuthError(error.message));
        return;
      }

      const user = data.user;

      if (!user) {
        setAuthError('No se pudo crear el usuario. Intenta de nuevo.');
        return;
      }

      // ── 2. Guardar perfil en la tabla profiles ─────────────────────────────
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: email.trim(),
          username: name.trim(),
        });

      if (profileError) {
        // No bloqueamos el flujo, pero lo registramos
        console.warn('Error guardando perfil:', profileError.message);
      }

      // ── 3. Manejar confirmación de correo ──────────────────────────────────
      // Si "Confirm email" está activado en Supabase, data.session viene null.
      // En ese caso mostramos aviso y NO navegamos — el usuario debe confirmar primero.
      if (!data.session) {
        setPendingConfirmation(true);
        return;
      }

      // ── 4. Sesión activa ───────────────────────────────────────────────────
      // La navegación la decide el layout raíz (_layout.tsx) según
      // isAuthenticated + currentPlan. Aquí solo marcamos la sesión.
      login(
  user.id,
  email.trim(),
  name.trim()
);

    } catch (err: any) {
      setAuthError(friendlyAuthError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    name.trim().length > 0 &&
    isValidEmail(email) &&
    validatePassword(password) === null;

  const pwStrength = getPasswordStrength(password);

  // ── Pantalla de "confirma tu correo" ────────────────────────────────────────
  if (pendingConfirmation) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <LinearGradient
          colors={isDark ? ['#0F172A', '#1E1B4B'] : [...Gradients.loginBg]}
          locations={[0, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: 'center' }}>
          <Mascot size={110} variant="star" />
          <Text style={[styles.title, { color: colors.textPrimary, marginTop: 24, textAlign: 'center' }]}>
            ¡Casi listo, {name}!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: 12, textAlign: 'center' }]}>
            Te enviamos un correo a{'\n'}
            <Text style={{ color: colors.primary, fontFamily: 'Poppins_600SemiBold' }}>{email}</Text>
            {'\n\n'}Confirma tu cuenta y luego inicia sesión.
          </Text>
          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.confirmBtnText}>Ir a Iniciar Sesión</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E1B4B'] : [...Gradients.loginBg]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <FloatingOrb delay={0}   color="rgba(91,155,213,0.12)"  size={120} top={60}           left={-30} />
      <FloatingOrb delay={500} color="rgba(155,142,196,0.10)" size={100} top={140}          left={SCREEN_W - 60} />
      <FloatingOrb delay={1000} color="rgba(168,230,207,0.12)" size={80} top={SCREEN_W * 0.8} left={20} />
      <FloatingOrb delay={800} color="rgba(247,201,126,0.10)" size={60} top={SCREEN_W * 0.5} left={SCREEN_W - 40} />

      <ParticlesBackground count={15} />

      {loading && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.loadingOverlay, { backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(232,240,254,0.8)' }]}
        >
          <Animated.View entering={FadeInUp.duration(400)}>
            <GlassCard style={styles.loadingCard}>
              <View style={{ alignItems: 'center' }}>
                <Mascot size={90} variant="star" />
                <View style={styles.loadingDots}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
                <Text style={[styles.loadingTitle, { color: colors.textPrimary }]}>
                  ¡Bienvenido/a, {name || 'amigo'}!
                </Text>
                <Text style={[styles.loadingSubtext, { color: colors.textLight }]}>
                  Preparando tu espacio seguro...
                </Text>
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
          <Animated.View entering={FadeIn.duration(300)} style={styles.backRow}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)' }]}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(700)} style={styles.mascotSection}>
            <Mascot size={110} variant="greeting" />
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Crea tu cuenta</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Tu espacio seguro para crecer emocionalmente 💙
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.benefitsStrip}>
            {[
              { icon: 'shield-checkmark', label: 'Seguro',  color: Colors.primary },
              { icon: 'heart-circle',     label: 'Privado', color: '#E56B8A' },
              { icon: 'flash',            label: 'Gratis',  color: Colors.accent },
            ].map((b, i) => (
              <View key={i} style={styles.benefitItem}>
                <Ionicons name={b.icon as any} size={18} color={b.color} />
                <Text style={[styles.benefitText, { color: b.color }]}>{b.label}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(500).delay(400)}>
            <GlassCard style={styles.formCard}>
              <LinearGradient
                colors={[colors.primary, colors.secondary, Colors.mint]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.formTopLine}
              />

              {/* Name */}
              <View style={[
                styles.inputWrap,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F7FAFC',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                focusedField === 'name' && { borderColor: colors.primary + '40' },
              ]}>
                <Ionicons name="person-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="¿Cómo te llamas?"
                  placeholderTextColor={colors.textLight}
                  value={name}
                  onChangeText={(t) => { setName(t); setAuthError(null); }}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
                {name.length > 0 && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.mint} />
                )}
              </View>

              {/* Email */}
              <View style={[
                styles.inputWrap,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F7FAFC',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                focusedField === 'email' && { borderColor: colors.primary + '40' },
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
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
                {email.includes('@') && email.includes('.') && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.mint} />
                )}
              </View>

              {/* Password */}
              <View>
                <View style={[
                  styles.inputWrap,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F7FAFC',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                  focusedField === 'password' && { borderColor: colors.primary + '40' },
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="Contraseña"
                    placeholderTextColor={colors.textLight}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setAuthError(null); }}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textLight}
                    />
                  </Pressable>
                </View>

                {password.length > 0 && (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.strengthRow}>
                    <View style={styles.strengthTrack}>
                      {[1, 2, 3].map((level) => (
                        <View
                          key={level}
                          style={[
                            styles.strengthSegment,
                            { backgroundColor: pwStrength.level >= level ? pwStrength.color : 'rgba(0,0,0,0.06)' },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.strengthLabel, { color: pwStrength.color }]}>
                      {pwStrength.label}
                    </Text>
                  </Animated.View>
                )}
              </View>

              {/* ─── Error inline ──────────────────────────────────────────── */}
              {authError && (
                <Animated.View entering={FadeIn.duration(250)} style={styles.errorWrap}>
                  <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
                  <Text style={styles.errorText}>{authError}</Text>
                </Animated.View>
              )}

              <JewelButton
                title="Crear mi cuenta"
                onPress={handleRegister}
                disabled={loading || !isFormValid}
                icon="sparkles-outline"
                style={{ marginTop: 4 }}
              />
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.privacyWrap}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.textLight} />
            <Text style={[styles.privacyText, { color: colors.textLight }]}>
              Tus datos están seguros. No compartimos tu información.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(600)} style={styles.loginSection}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>¿Ya tienes cuenta? </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Iniciar Sesión</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24, paddingTop: 50, paddingBottom: 32,
  },
  backRow: { marginBottom: 4 },
  backBtn: {
    width: 38, height: 38, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
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
    marginTop: 14, fontSize: 18, fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
  },
  loadingSubtext: {
    marginTop: 4, fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  mascotSection: { alignItems: 'center', marginBottom: 12 },
  titleSection: { alignItems: 'center', marginBottom: 16 },
  title: {
    fontSize: 28, fontWeight: '700', color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold', letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14, color: Colors.textSecondary, marginTop: 6,
    fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22,
  },
  benefitsStrip: {
    flexDirection: 'row', justifyContent: 'center', gap: 20,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20,
  },
  benefitText: {
    fontSize: 12, fontWeight: '600', fontFamily: 'Poppins_600SemiBold',
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28, padding: 24,
    gap: 14, overflow: 'hidden',
    shadowColor: '#5B9BD5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 8,
  },
  formTopLine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3, borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, paddingHorizontal: 16,
    height: 56,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1, height: 50, fontSize: 14, color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  strengthRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, paddingHorizontal: 4,
  },
  strengthTrack: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthSegment: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  // ─── Error ────────────────────────────────────────────────────────────────
  errorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
  },
  errorText: {
    flex: 1, fontSize: 12, color: '#EF4444',
    fontFamily: 'Poppins_400Regular',
  },
  // ─── Confirm email ────────────────────────────────────────────────────────
  confirmBtn: {
    marginTop: 32, paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 20,
  },
  confirmBtnText: {
    color: '#fff', fontSize: 15, fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  privacyWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 20,
  },
  privacyText: {
    fontSize: 11, color: Colors.textLight, fontFamily: 'Poppins_400Regular',
  },
  loginSection: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 16,
  },
  loginText: { fontSize: 14, color: Colors.textSecondary },
  loginLink: {
    fontSize: 14, color: Colors.primary, fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
});
