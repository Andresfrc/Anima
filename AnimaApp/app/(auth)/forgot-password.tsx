import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Pressable, ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import Animated, {
  FadeIn, FadeOut, FadeInUp, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing, interpolate, cancelAnimation,
} from 'react-native-reanimated';
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
import { supabase } from '../../lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');

// Animated decorative orb — idéntico al del login para mantener coherencia visual
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

type Step = 'email' | 'reset' | 'done';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputBg = isDark ? 'rgba(255,255,255,0.02)' : '#F7FAFC';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  // ── Paso 1: enviar código de recuperación al correo ─────────────────────────
  const handleSendCode = async () => {
    if (!email.includes('@')) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setStep('reset');
    } catch {
      setError('No pudimos enviar el código. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 2: verificar código + establecer nueva contraseña ──────────────────
  const handleResetPassword = async () => {
    if (code.trim().length < 6 || code.trim().length > 10) {
      setError('El código de seguridad debe tener entre 6 y 10 dígitos.');
      return;
    }
    if (password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Verificar el código de recuperación — esto crea una sesión temporal
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'recovery',
      });
      if (otpError) {
        setError('Código inválido o expirado. Solicita uno nuevo.');
        return;
      }
      // Con la sesión activa, actualizamos la contraseña
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      // Cerramos la sesión temporal: el usuario debe entrar con su nueva contraseña
      await supabase.auth.signOut();
      setStep('done');
    } catch {
      setError('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = (() => {
    if (password.length === 0) return { level: 0, label: '', color: '' };
    if (password.length < 6) return { level: 1, label: 'Muy corta', color: '#E53E3E' };
    if (password.length < 8) return { level: 2, label: 'Media', color: Colors.accent };
    return { level: 3, label: 'Fuerte', color: Colors.mint };
  })();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E1B4B'] : [...Gradients.loginBg]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

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
                <View style={{ marginTop: 16 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
                <Text style={[styles.loadingTitle, { color: colors.textPrimary }]}>
                  {step === 'email' ? 'Enviando código' : 'Actualizando'}
                </Text>
                <Text style={[styles.loadingSubtext, { color: colors.textLight }]}>Un momento...</Text>
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
          {/* Back button */}
          <AnimatedEntrance delay={0} from="top">
            <View style={styles.backRow}>
              <Pressable
                onPress={() => (step === 'reset' ? setStep('email') : router.replace('/(auth)/login'))}
                style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)' }]}
              >
                <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
          </AnimatedEntrance>

          {/* Mascot */}
          <AnimatedEntrance delay={100} from="top">
            <View style={styles.mascotSection}>
              <Mascot size={120} variant={step === 'done' ? 'celebrating' : 'empathetic'} />
            </View>
          </AnimatedEntrance>

          {step === 'done' ? (
            // ── Pantalla de éxito ───────────────────────────────────────────────
            <AnimatedEntrance delay={200} from="bottom">
              <View style={styles.titleSection}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>¡Contraseña actualizada!</Text>
                <Text style={[styles.subtitle, { color: colors.textLight }]}>
                  Ya puedes iniciar sesión con tu nueva contraseña.
                </Text>
              </View>
              <GlassCard style={styles.formContainer}>
                <View style={styles.formContent}>
                  <View style={styles.successIconWrap}>
                    <Ionicons name="checkmark-circle" size={56} color={Colors.mint} />
                  </View>
                  <PremiumButton
                    title="Iniciar Sesión"
                    onPress={() => router.replace('/(auth)/login')}
                    variant="primary"
                    icon={<Ionicons name="log-in-outline" size={24} color="#FFF" />}
                    style={{ marginTop: 8 }}
                  />
                </View>
              </GlassCard>
            </AnimatedEntrance>
          ) : (
            <>
              {/* Title */}
              <AnimatedEntrance delay={200} from="top">
                <View style={styles.titleSection}>
                  <Text style={[styles.title, { color: colors.textPrimary }]}>Recuperar contraseña</Text>
                  <Text style={[styles.subtitle, { color: colors.textLight }]}>
                    {step === 'email'
                      ? 'Te enviaremos un código de seguridad a tu correo.'
                      : `Escribe el código que enviamos a ${email}.`}
                  </Text>
                </View>
              </AnimatedEntrance>

              {/* Form Card */}
              <AnimatedEntrance delay={300} from="bottom">
                <GlassCard style={styles.formContainer}>
                  <View style={styles.formContent}>
                    {step === 'email' ? (
                      <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder, borderWidth: 1 }]}>
                        <Ionicons name="mail-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, { color: colors.textPrimary }]}
                          placeholder="Correo electrónico"
                          placeholderTextColor={colors.textLight}
                          value={email}
                          onChangeText={(t) => { setEmail(t); setError(null); }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoFocus
                        />
                      </View>
                    ) : (
                      <>
                        {/* Código OTP — centrado, sin icono para no descentrar */}
                        <View style={[styles.inputWrap, styles.codeWrap, { backgroundColor: inputBg, borderColor: inputBorder, borderWidth: 1 }]}>
                          <TextInput
                            style={[styles.input, styles.codeInput, { color: colors.textPrimary }]}
                            placeholder="Código"
                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.22)'}
                            value={code}
                            onChangeText={(t) => { setCode(t.replace(/[^0-9]/g, '').slice(0, 10)); setError(null); }}
                            keyboardType="number-pad"
                            maxLength={10}
                            autoFocus
                          />
                        </View>

                        {/* Nueva contraseña */}
                        <View>
                          <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder, borderWidth: 1 }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                            <TextInput
                              style={[styles.input, { color: colors.textPrimary }]}
                              placeholder="Nueva contraseña"
                              placeholderTextColor={colors.textLight}
                              value={password}
                              onChangeText={(t) => { setPassword(t); setError(null); }}
                              secureTextEntry={!showPassword}
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textLight} />
                            </Pressable>
                          </View>

                          {password.length > 0 && (
                            <Animated.View entering={FadeIn.duration(200)} style={styles.strengthRow}>
                              <View style={styles.strengthTrack}>
                                {[1, 2, 3].map((level) => (
                                  <View
                                    key={level}
                                    style={[styles.strengthSegment, {
                                      backgroundColor: pwStrength.level >= level ? pwStrength.color : 'rgba(150,150,150,0.18)',
                                    }]}
                                  />
                                ))}
                              </View>
                              <Text style={[styles.strengthLabel, { color: pwStrength.color }]}>{pwStrength.label}</Text>
                            </Animated.View>
                          )}
                        </View>
                      </>
                    )}

                    {/* Error inline */}
                    {error && (
                      <Animated.View entering={FadeIn.duration(250)} style={styles.errorWrap}>
                        <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                      </Animated.View>
                    )}

                    <PremiumButton
                      title={step === 'email' ? 'Enviar código' : 'Cambiar contraseña'}
                      onPress={step === 'email' ? handleSendCode : handleResetPassword}
                      variant="primary"
                      icon={<Ionicons name={step === 'email' ? 'paper-plane-outline' : 'checkmark-outline'} size={22} color="#FFF" />}
                      style={{ marginTop: 8 }}
                    />

                    {step === 'reset' && (
                      <Pressable onPress={handleSendCode} style={styles.resendLink}>
                        <Text style={[styles.resendText, { color: colors.primary }]}>Reenviar código</Text>
                      </Pressable>
                    )}
                  </View>
                </GlassCard>
              </AnimatedEntrance>

              {/* Back to login */}
              <AnimatedEntrance delay={400}>
                <View style={styles.loginSection}>
                  <Text style={[styles.loginText, { color: colors.textSecondary }]}>¿La recordaste? </Text>
                  <Pressable onPress={() => router.replace('/(auth)/login')}>
                    <Text style={[styles.loginLink, { color: colors.primary }]}>Iniciar Sesión</Text>
                  </Pressable>
                </View>
              </AnimatedEntrance>
            </>
          )}
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 100,
  },
  loadingCard: {
    borderRadius: 32, paddingVertical: 36, paddingHorizontal: 40,
    alignItems: 'center',
  },
  loadingTitle: {
    marginTop: 14, fontSize: 18, fontFamily: 'Poppins_700Bold',
  },
  loadingSubtext: {
    marginTop: 4, fontSize: 13, fontFamily: 'Poppins_400Regular',
  },
  backRow: { marginBottom: 8 },
  backBtn: {
    width: 38, height: 38, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  mascotSection: { alignItems: 'center', marginBottom: 16 },
  titleSection: { alignItems: 'center', marginBottom: 28, paddingHorizontal: 8 },
  title: {
    fontSize: 26, fontWeight: '700', color: Colors.textPrimary,
    fontFamily: 'Poppins_700Bold', textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14, color: Colors.textLight, marginTop: 8,
    fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20,
  },
  formContainer: { borderRadius: 28 },
  formContent: { padding: 24, gap: 16 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, paddingHorizontal: 16, height: 56,
  },
  codeWrap: {
    justifyContent: 'center',
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1, height: '100%', fontSize: 15, color: Colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  codeInput: {
    fontSize: 20, letterSpacing: 6, fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    paddingLeft: 6,
  },
  strengthRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, paddingHorizontal: 4,
  },
  strengthTrack: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthSegment: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  errorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
  },
  errorText: {
    flex: 1, fontSize: 12, color: '#EF4444', fontFamily: 'Poppins_400Regular',
  },
  successIconWrap: { alignItems: 'center', paddingVertical: 8 },
  resendLink: { alignSelf: 'center', paddingVertical: 4 },
  resendText: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  loginSection: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 28,
  },
  loginText: { fontSize: 14, color: Colors.textSecondary },
  loginLink: {
    fontSize: 14, color: Colors.primary, fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
});
