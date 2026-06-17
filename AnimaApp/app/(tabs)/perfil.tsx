import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Image, FlatList } from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, MoodConfig, Shadows } from '../../constants/theme';
import { GlassCard, SectionHeader, Mascot, JewelButton } from '../../components/ui';
import { useStore, MoodType } from '../../store/useStore';
import { useTheme } from '../../hooks/useTheme';
import { SoundService } from '../../utils/SoundService';
import * as Haptics from 'expo-haptics';
import { NotificationService } from '../../utils/NotificationService';
import { CLINICAL_DISCLAIMER } from '../../constants/clinicalContent';
import { AVATAR_CATEGORIES, getAvatarSource, AvatarItem } from '../../constants/avatars';
import { getCurrentLevel, getNextLevel, getLevelProgress, ROUTE_PROGRESSIONS } from '../../constants/progressionSystem';
import { supabase } from '../../lib/supabase';

export default function PerfilScreen() {
  const router = useRouter();
  const userName = useStore((s) => s.userName);
  const userEmail = useStore((s) => s.userEmail);
  const moodHistory = useStore((s) => s.moodHistory);
  const logout = useStore((s) => s.logout);
  const updateUser = useStore((s) => s.updateUser);
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);
  const toggleNotifications = useStore((s) => s.toggleNotifications);
  const profileAvatar = useStore((s) => s.profileAvatar);
  const setProfileAvatar = useStore((s) => s.setProfileAvatar);
  const userXP = useStore((s) => s.userXP);
  const currentPlan = useStore((s) => s.currentPlan);
  const activeTitle = useStore((s) => s.activeTitle);
  const unlockedTitles = useStore((s) => s.unlockedTitles);
  const currentStreak = useStore((s) => s.currentStreak);
  const setActiveTitle = useStore((s) => s.setActiveTitle);

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarCategory, setAvatarCategory] = useState(0);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const { toggleTheme, isDark, colors } = useTheme();

  // ── Cargar perfil desde Supabase al montar ─────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar')
        .eq('id', user.id)
        .single();

      if (error) return;

      // Actualizar store solo si hay datos en Supabase
      if (data?.username && data.username !== userName) updateUser(data.username);
      if (data?.avatar && data.avatar !== profileAvatar) setProfileAvatar(data.avatar);
    };

    loadProfile();
  }, []);

  const openEditModal = () => {
    setNewName(userName || '');
    setIsEditing(true);
  };

  // ── Guardar perfil en local + Supabase ─────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!newName.trim()) return;

    setIsSaving(true);
    try {
      // 1. Actualizar store local
      updateUser(newName.trim());

      // 2. Guardar en Supabase (upsert por si no existe la fila)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            username: newName.trim(),
          }, { onConflict: 'id' });

        if (error) {
          console.log('Error guardando nombre:', error);
          Alert.alert('Error', 'No se pudo guardar el nombre. Intenta de nuevo.');
          setIsSaving(false);
          return;
        }
      }

      setIsEditing(false);
      Alert.alert('¡Perfil Actualizado!', 'Tu nombre ha sido guardado correctamente.');
    } catch (e) {
      console.log('Error en handleSaveProfile:', e);
      Alert.alert('Error', 'Algo salió mal. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Guardar avatar en local + Supabase ─────────────────────────────────────
  // FIX: ahora se revisa el `error` que devuelve el upsert. Antes se ignoraba
  // silenciosamente — si fallaba (p. ej. por RLS o por una restricción NOT NULL
  // en alguna columna como `username` cuando todavía no existía la fila),
  // la app actuaba como si se hubiera guardado y el avatar nunca llegaba a Supabase.
  const handleSelectAvatar = useCallback(async (avatarId: string) => {
    setProfileAvatar(avatarId);
    setShowAvatarPicker(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ No hay usuario autenticado, no se puede guardar el avatar');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, avatar: avatarId },
          { onConflict: 'id' }
        );

      if (error) {
        console.log('❌ Error guardando avatar en Supabase:', error);
        Alert.alert(
          'Aviso',
          'El avatar se ve localmente pero no se pudo guardar en el servidor. Intenta de nuevo más tarde.'
        );
      } else {
        console.log('✅ Avatar guardado correctamente en Supabase');
      }
    } catch (e) {
      console.log('❌ Excepción guardando avatar:', e);
    }
  }, [setProfileAvatar]);

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          await SoundService.unloadAll();
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const avatarSource = getAvatarSource(profileAvatar);
  const plan = currentPlan || 'balance';
  const progression = ROUTE_PROGRESSIONS[plan];
  const currentLevel = useMemo(() => getCurrentLevel(plan, userXP), [plan, userXP]);
  const nextLevel = useMemo(() => getNextLevel(plan, userXP), [plan, userXP]);
  const progressPct = useMemo(() => getLevelProgress(plan, userXP), [plan, userXP]);
  const routeColor = progression?.color || colors.primary;
  const isMaxLevel = !nextLevel;

  const activeTitleName = useMemo(() => {
    if (!activeTitle) return null;
    for (const route of Object.values(ROUTE_PROGRESSIONS)) {
      for (const lvl of route.levels) {
        if (lvl.reward?.id === activeTitle) return lvl.reward.name;
      }
    }
    return null;
  }, [activeTitle]);

  const configItems = [
    { icon: 'compass-outline', label: 'Cambiar Mi Ruta', color: '#FCD34D', type: 'link', action: () => router.replace('/(onboarding)/select-plan') },
    { icon: 'moon-outline', label: 'Modo Lunar', color: colors.secondary, type: 'toggle', action: toggleTheme, active: isDark },
    { icon: 'notifications-outline', label: 'Notificaciones', color: colors.primary, type: 'toggle', action: () => toggleNotifications(!notificationsEnabled), active: notificationsEnabled },
    { icon: 'alert-circle-outline', label: 'Probar Notificación', color: colors.accent, type: 'link', action: async () => {
        Alert.alert('¡Prueba iniciada!', 'Sal de la app ahora. La notificación llegará en 5 segundos.');
        await NotificationService.scheduleTestNotification();
    }},
  ];

  const supportItems = [
    { icon: 'shield-checkmark-outline', label: 'Privacidad y Datos', color: colors.mint, type: 'link', action: () => setShowPrivacy(true), active: undefined },
    { icon: 'warning-outline', label: 'Aviso Médico (SOS)', color: '#EF4444', type: 'link', action: () => setShowDisclaimer(true), active: undefined },
    { icon: 'heart-outline', label: 'Invitar amigos', color: colors.accent, type: 'link', action: () => setShowInvite(true), active: undefined },
    { icon: 'help-buoy-outline', label: 'Ayuda y Soporte', color: colors.textLight, type: 'link', action: () => setShowHelp(true), active: undefined },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow} />
            <LinearGradient colors={['#FFF', '#F0F6FF']} style={styles.avatarBorder}>
              {avatarSource ? (
                <Image source={avatarSource} style={styles.avatarImage} />
              ) : (
                <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.avatarFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.avatarLetter}>{(userName || 'U').charAt(0).toUpperCase()}</Text>
                </LinearGradient>
              )}
            </LinearGradient>
            <Pressable style={styles.editBadge} onPress={() => setShowAvatarPicker(true)}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </Pressable>
          </View>

          <View style={{ gap: 4, alignItems: 'center' }}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{userName || 'Usuario'}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{userEmail || 'email@example.com'}</Text>
            {activeTitleName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="ribbon" size={12} color={routeColor} />
                <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: routeColor }}>{activeTitleName.replace('Título: ', '')}</Text>
              </View>
            )}
          </View>

          <Pressable
            style={[styles.editProfileBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            onPress={openEditModal}
          >
            <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.editProfileText, { color: colors.textSecondary }]}>Editar Perfil</Text>
          </Pressable>
        </Animated.View>

        {/* Progression Card */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)}>
          <SectionHeader title="Mi Progreso" />
          <View style={{ padding: 16, borderRadius: 20, marginBottom: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: routeColor + '18', borderWidth: 1.5, borderColor: routeColor, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={currentLevel.icon as any} size={22} color={routeColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.textPrimary }}>Lv.{currentLevel.level} — {currentLevel.title}</Text>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textLight }}>Ruta {progression?.routeName} {progression?.emoji}</Text>
              </View>
              {currentStreak > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F97316' + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                  <Ionicons name="flame" size={14} color="#F97316" />
                  <Text style={{ fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#F97316' }}>{currentStreak}</Text>
                </View>
              )}
            </View>
            <View style={{ marginBottom: activeTitleName ? 10 : 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textLight }}>
                  {isMaxLevel ? '¡Nivel Máximo!' : `${userXP} / ${nextLevel?.xpRequired} XP`}
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins_700Bold', color: routeColor }}>{Math.round(progressPct * 100)}%</Text>
              </View>
              <View style={{ height: 10, borderRadius: 5, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <LinearGradient colors={progression?.gradient || [routeColor, routeColor]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', borderRadius: 5, width: `${Math.max(progressPct * 100, 2)}%` }} />
              </View>
            </View>
            {activeTitleName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="ribbon" size={14} color={routeColor} />
                <Text style={{ fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: routeColor }}>{activeTitleName.replace('Título: ', '')}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)}>
          <SectionHeader title="Sistema" />
          <GlassCard style={styles.settingsCard}>
            {configItems.map((item, i) => (
              <Pressable key={i} onPress={() => { Haptics.selectionAsync(); item.action?.(); }}
                style={({ pressed }) => [styles.settingsItem, i < configItems.length - 1 && [styles.settingsBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }], pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                <View style={[styles.settingsIconWrap, { backgroundColor: item.color + '10' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={[styles.settingsLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                {item.type === 'toggle' ? (
                  <View style={[styles.toggleTrack, { backgroundColor: item.active ? Colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0') }]}>
                    <View style={[styles.toggleThumb, { left: item.active ? 22 : 2 }]} />
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                )}
              </Pressable>
            ))}
          </GlassCard>
        </Animated.View>

        {/* Support */}
        <Animated.View entering={FadeInUp.duration(500).delay(300)} style={{ marginTop: 24 }}>
          <SectionHeader title="Información y Soporte" />
          <GlassCard style={styles.settingsCard}>
            {supportItems.map((item, i) => (
              <Pressable key={i} onPress={() => { Haptics.selectionAsync(); item.action?.(); }}
                style={({ pressed }) => [styles.settingsItem, i < supportItems.length - 1 && [styles.settingsBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }], pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                <View style={[styles.settingsIconWrap, { backgroundColor: item.color + '10' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={[styles.settingsLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
              </Pressable>
            ))}
          </GlassCard>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInUp.duration(500).delay(400)} style={{ marginTop: 24 }}>
          <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}>
            <LinearGradient colors={['rgba(229,62,62,0.05)', 'rgba(229,62,62,0.1)']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Ionicons name="log-out-outline" size={20} color="#E53E3E" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.footerSection}>
          <Mascot size={100} variant="star" />
          <Text style={[styles.versionText, { color: colors.textLight }]}>Aníma v1.0.2 • Build 2026</Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── MODAL: Editar Perfil ── */}
      <Modal visible={isEditing} transparent animationType="slide" onRequestClose={() => setIsEditing(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={[styles.modalHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Editar Perfil</Text>
              <Pressable onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={24} color={colors.textLight} />
              </Pressable>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nombre de usuario</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F7FAFC', color: colors.textPrimary, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Tu nombre"
              autoFocus
              placeholderTextColor={colors.textLight}
              returnKeyType="done"
              onSubmitEditing={handleSaveProfile}
            />

            <JewelButton
              title={isSaving ? 'Guardando...' : 'Guardar Cambios'}
              onPress={handleSaveProfile}
              disabled={isSaving || !newName.trim()}
              style={{ marginTop: 20, opacity: isSaving || !newName.trim() ? 0.6 : 1 }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modales de info — sin cambios */}
      <Modal visible={showPrivacy} transparent animationType="fade" onRequestClose={() => setShowPrivacy(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Privacidad y Datos</Text>
              <Pressable onPress={() => setShowPrivacy(false)}><Ionicons name="close" size={24} color={colors.textLight} /></Pressable>
            </View>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>Tus datos están encriptados y guardados de forma segura. Nadie más tiene acceso a tu historial clínico o registros de emociones.</Text>
            <JewelButton title="Entendido" onPress={() => setShowPrivacy(false)} style={{ marginTop: 20 }} />
          </View>
        </View>
      </Modal>

      <Modal visible={showDisclaimer} transparent animationType="fade" onRequestClose={() => setShowDisclaimer(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(239,68,68,0.1)', alignSelf: 'center' }}>
              <Ionicons name="warning" size={32} color="#EF4444" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.textPrimary, textAlign: 'center', marginBottom: 12 }]}>{CLINICAL_DISCLAIMER.title}</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }]}>{CLINICAL_DISCLAIMER.content}</Text>
            <JewelButton title="Entendido" onPress={() => setShowDisclaimer(false)} style={{ width: '100%' }} />
          </View>
        </View>
      </Modal>

      <Modal visible={showInvite} transparent animationType="fade" onRequestClose={() => setShowInvite(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Invitar Amigos</Text>
              <Pressable onPress={() => setShowInvite(false)}><Ionicons name="close" size={24} color={colors.textLight} /></Pressable>
            </View>
            <Text style={[styles.modalText, { color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }]}>Comparte el bienestar con las personas que más te importan.</Text>
            <View style={[styles.inviteLinkBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F7FAFC', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <Text style={{ color: colors.textPrimary, fontFamily: 'Poppins_500Medium', flex: 1 }} numberOfLines={1}>anima.app/invitar/usuario123</Text>
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showHelp} transparent animationType="fade" onRequestClose={() => setShowHelp(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Ayuda y Soporte</Text>
              <Pressable onPress={() => setShowHelp(false)}><Ionicons name="close" size={24} color={colors.textLight} /></Pressable>
            </View>
            <Text style={[styles.modalText, { color: colors.textSecondary, marginBottom: 16 }]}>¿Tienes algún problema o duda sobre tu proceso en Anima?</Text>
            <Pressable style={[styles.supportActionBtn, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              <Text style={[styles.supportActionText, { color: Colors.primary }]}>Enviar un correo a soporte</Text>
            </Pressable>
            <Pressable style={[styles.supportActionBtn, { backgroundColor: Colors.secondary + '15' }]}>
              <Ionicons name="book-outline" size={20} color={Colors.secondary} />
              <Text style={[styles.supportActionText, { color: Colors.secondary }]}>Leer Preguntas Frecuentes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Avatar Picker */}
      <Modal visible={showAvatarPicker} transparent animationType="slide" onRequestClose={() => setShowAvatarPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.avatarPickerContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Elige tu Avatar</Text>
              <Pressable onPress={() => setShowAvatarPicker(false)}><Ionicons name="close" size={24} color={colors.textLight} /></Pressable>
            </View>
            <View style={styles.categoryTabs}>
              {AVATAR_CATEGORIES.map((cat, idx) => (
                <Pressable key={cat.title} onPress={() => setAvatarCategory(idx)}
                  style={[styles.categoryTab, avatarCategory === idx && { backgroundColor: Colors.primary + '20', borderColor: Colors.primary }]}>
                  <Ionicons name={cat.icon as any} size={18} color={avatarCategory === idx ? Colors.primary : colors.textLight} />
                  <Text style={[styles.categoryTabText, { color: avatarCategory === idx ? Colors.primary : colors.textLight }]}>{cat.title}</Text>
                </Pressable>
              ))}
            </View>
            <FlatList
              data={AVATAR_CATEGORIES[avatarCategory].data}
              keyExtractor={(item) => item.id}
              numColumns={4}
              contentContainerStyle={{ paddingBottom: 20 }}
              columnWrapperStyle={{ gap: 12, justifyContent: 'center' }}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              renderItem={({ item }) => (
                <Pressable onPress={() => handleSelectAvatar(item.id)}
                  style={({ pressed }) => [styles.avatarGridItem, profileAvatar === item.id && styles.avatarGridItemActive, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}>
                  <Image source={item.source} style={styles.avatarGridImage} />
                  {profileAvatar === item.id && (
                    <View style={styles.avatarCheckBadge}><Ionicons name="checkmark" size={14} color="#FFF" /></View>
                  )}
                </Pressable>
              )}
            />
            {profileAvatar && (
              <Pressable onPress={async () => {
                setProfileAvatar(null);
                setShowAvatarPicker(false);
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) {
                    console.log('⚠️ No hay usuario autenticado, no se puede quitar el avatar en el servidor');
                    return;
                  }
                  const { error } = await supabase
                    .from('profiles')
                    .upsert({ id: user.id, avatar: null }, { onConflict: 'id' });
                  if (error) {
                    console.log('❌ Error quitando avatar en Supabase:', error);
                  } else {
                    console.log('✅ Avatar removido correctamente en Supabase');
                  }
                } catch (e) {
                  console.log('❌ Excepción quitando avatar:', e);
                }
              }} style={styles.removeAvatarBtn}>
                <Ionicons name="trash-outline" size={16} color="#E53E3E" />
                <Text style={styles.removeAvatarText}>Quitar foto de perfil</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
  profileHeader: { alignItems: 'center', marginBottom: 32, gap: 12 },
  avatarContainer: { marginBottom: 8, position: 'relative' },
  avatarGlow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary, opacity: 0.15, transform: [{ scale: 1.2 }], top: 0, left: 0 },
  avatarBorder: { width: 100, height: 100, borderRadius: 50, padding: 3, ...Shadows.medium, overflow: 'hidden' },
  avatarFill: { flex: 1, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 50, resizeMode: 'cover' },
  avatarLetter: { fontSize: 40, fontWeight: '700', color: '#FFF', fontFamily: 'Poppins_700Bold' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity:0.2, shadowRadius:4, elevation:4 },
  userName: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Poppins_700Bold' },
  userEmail: { fontSize: 14, color: Colors.textLight, fontFamily: 'Poppins_400Regular' },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  editProfileText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, fontFamily: 'Poppins_600SemiBold' },
  settingsCard: { padding: 0, overflow: 'hidden' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 20 },
  settingsBorder: { borderBottomWidth: 1 },
  settingsIconWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingsLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontFamily: 'Poppins_500Medium' },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center' },
  toggleThumb: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', shadowColor: "#000", shadowOffset: {width:0,height:1}, shadowOpacity:0.2, shadowRadius:2, elevation:2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(229,62,62,0.15)' },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#E53E3E', fontFamily: 'Poppins_600SemiBold' },
  footerSection: { alignItems: 'center', marginTop: 32, gap: 8, opacity: 0.7 },
  versionText: { fontSize: 12, color: Colors.textLight, fontFamily: 'Poppins_400Regular' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 50, ...Shadows.large },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'Poppins_700Bold' },
  inputLabel: { fontSize: 14, color: Colors.textSecondary, fontFamily: 'Poppins_500Medium', marginBottom: 8 },
  input: { backgroundColor: '#F7FAFC', borderRadius: 16, padding: 16, fontSize: 16, color: Colors.textPrimary, fontFamily: 'Poppins_400Regular', borderWidth: 1 },
  modalText: { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  inviteLinkBox: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, width: '100%' },
  supportActionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, gap: 12 },
  supportActionText: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  avatarPickerContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, maxHeight: '80%', ...Shadows.large },
  categoryTabs: { flexDirection: 'row', gap: 10, marginBottom: 20, marginTop: 4 },
  categoryTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  categoryTabText: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  avatarGridItem: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', borderWidth: 3, borderColor: 'transparent' },
  avatarGridItemActive: { borderColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 6 },
  avatarGridImage: { width: '100%', height: '100%', borderRadius: 36, resizeMode: 'cover' },
  avatarCheckBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  removeAvatarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginTop: 8 },
  removeAvatarText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: '#E53E3E' },
});