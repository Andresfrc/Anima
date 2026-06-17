import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Platform, Image, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useStore } from '../../store/useStore';
import { getAvatarSource } from '../../constants/avatars';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { AdaptiveSOSButton } from '../../components/AdaptiveSOS';
import LevelUpModal from '../../components/ui/LevelUpModal';
import { supabase } from '../../lib/supabase';

// Versión actual de la app — actualiza esto en cada release
const APP_VERSION = '1.0.2';

// Compara versiones semánticas "1.0.2" >= "1.0.0"
function isVersionAtLeast(current: string, minimum: string): boolean {
  const c = current.split('.').map(Number);
  const m = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((c[i] ?? 0) > (m[i] ?? 0)) return true;
    if ((c[i] ?? 0) < (m[i] ?? 0)) return false;
  }
  return true;
}

function TabIcon({ name, color, focused, size }: {
  name: string; color: string; focused: boolean; size: number;
}) {
  const scale = useSharedValue(focused ? 1.18 : 1);
  const translateY = useSharedValue(focused ? -2 : 0);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1, { damping: 12 });
    translateY.value = withSpring(focused ? -4 : 0, { damping: 12 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: withSpring(focused ? 1 : 0),
    transform: [{ scale: withSpring(focused ? 1 : 0) }],
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.tabIconWrap, animStyle]}>
        <Ionicons name={name as any} size={size || 24} color={color} />
      </Animated.View>
      <Animated.View style={[styles.activeDot, { backgroundColor: color }, indicatorStyle]} />
    </View>
  );
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const profileAvatar = useStore((s) => s.profileAvatar);
  const avatarSource = getAvatarSource(profileAvatar);
  const router = useRouter();

  // ── Estados para los modales de sistema ──────────────────────────────────
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showUpdateRequired, setShowUpdateRequired] = useState(false);
  const [showSuspended, setShowSuspended] = useState(false);

  // ── Leer app_settings en tiempo real ─────────────────────────────────────
  useEffect(() => {
    // 1. Carga inicial
    const checkAppSettings = async () => {
      // Verificar si el usuario está suspendido
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'suspended') {
          setShowSuspended(true);
          return;
        }
      }

      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'min_app_version']);

      if (error || !data) return;

      const settings: Record<string, any> = {};
      data.forEach(row => { settings[row.key] = row.value; });

      if (settings['maintenance_mode']?.enabled === true) {
        setShowMaintenance(true);
        return;
      }

      const minVersion = settings['min_app_version']?.version;
      if (minVersion && !isVersionAtLeast(APP_VERSION, minVersion)) {
        setShowUpdateRequired(true);
      }
    };

    checkAppSettings();

    // 2. Suscripción en tiempo real — detecta cambios del admin al instante
    const channel = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_settings' },
        (payload) => {
          const { key, value } = payload.new as { key: string; value: any };

          if (key === 'maintenance_mode') {
            if (value?.enabled === true) {
              setShowMaintenance(true);
            } else {
              setShowMaintenance(false);
            }
          }

          if (key === 'min_app_version') {
            const minVersion = value?.version;
            if (minVersion && !isVersionAtLeast(APP_VERSION, minVersion)) {
              setShowUpdateRequired(true);
            } else {
              setShowUpdateRequired(false);
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          sceneStyle: { backgroundColor: 'transparent' },
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: isDark ? colors.textLight : Colors.textLight,
          tabBarStyle: {
            position: 'absolute',
            bottom: 24,
            left: 24,
            right: 24,
            height: 72,
            borderRadius: 40,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            ...styles.shadow,
          },
          tabBarBackground: () => (
            <View style={{
              flex: 1,
              borderRadius: 40,
              overflow: 'hidden',
              backgroundColor: colors.bgCard,
              ...styles.shadow,
            }} />
          ),
          tabBarShowLabel: false,
          tabBarItemStyle: {
            height: 72,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 0,
            paddingTop: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="actividades"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'sparkles' : 'sparkles-outline'} color={color} focused={focused} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'chatbubbles' : 'chatbubbles-outline'} color={color} focused={focused} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="registro"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'journal' : 'journal-outline'} color={color} focused={focused} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            tabBarIcon: ({ color, focused }) => (
              avatarSource ? (
                <View style={styles.iconContainer}>
                  <Image
                    source={avatarSource}
                    style={{ width: 28, height: 28, borderRadius: 14, borderWidth: focused ? 2 : 0, borderColor: Colors.primary }}
                    resizeMode="cover"
                  />
                  <Animated.View style={[styles.activeDot, { backgroundColor: color, opacity: focused ? 1 : 0 }]} />
                </View>
              ) : (
                <TabIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} size={28} />
              )
            ),
          }}
        />
      </Tabs>

      <AdaptiveSOSButton />
      <LevelUpModal />

      {/* ── Modal: Usuario Suspendido ─────────────────────────────────────── */}
      <Modal visible={showSuspended} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <Ionicons name="ban" size={40} color="#EF4444" />
            </View>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1a1a2e' }]}>
              Cuenta Suspendida 🚫
            </Text>
            <Text style={[styles.modalDesc, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
              Tu cuenta ha sido suspendida por el equipo de Ánima. Si crees que es un error, contacta a soporte.
            </Text>
            <Pressable
              onPress={async () => {
                await supabase.auth.signOut();
                router.replace('/(auth)/login');
              }}
              style={[styles.modalBtn, { backgroundColor: '#EF4444' }]}
            >
              <Text style={styles.modalBtnText}>Cerrar sesión</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Modo Mantenimiento ─────────────────────────────────────── */}
      <Modal visible={showMaintenance} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="construct" size={40} color="#F97316" />
            </View>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1a1a2e' }]}>
              En Mantenimiento 🔧
            </Text>
            <Text style={[styles.modalDesc, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
              Aníma está temporalmente fuera de servicio para mejoras. Vuelve en unos minutos.
            </Text>
            <Pressable
              onPress={async () => {
                await supabase.auth.signOut();
                router.replace('/(auth)/login');
              }}
              style={styles.modalBtn}
            >
              <Text style={styles.modalBtnText}>Cerrar sesión</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Actualización Requerida ───────────────────────────────── */}
      <Modal visible={showUpdateRequired} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
              <Ionicons name="arrow-up-circle" size={40} color="#6366F1" />
            </View>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1a1a2e' }]}>
              Actualización Requerida 🚀
            </Text>
            <Text style={[styles.modalDesc, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
              Esta versión de Aníma ya no está soportada. Por favor actualiza la app para continuar.
            </Text>
            <Text style={{ color: '#6366F1', fontSize: 12, marginBottom: 16 }}>
              Versión actual: {APP_VERSION}
            </Text>
            <Pressable
              onPress={async () => {
                await supabase.auth.signOut();
                router.replace('/(auth)/login');
              }}
              style={[styles.modalBtn, { backgroundColor: '#6366F1' }]}
            >
              <Text style={styles.modalBtnText}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#5B9BD5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: 50,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: -10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(249,115,22,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
});