import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { ActivityCard, SectionHeader, Mascot } from '../../components/ui';
import { useStore } from '../../store/useStore';
import {
  ACTIVITY_ROUTES, EXCLUSIVE_ACTIVITIES, DEFAULT_ACTIVITIES, ActivityDefinition
} from '../../constants/activities';
import { supabase } from '../../lib/supabase';
import { saveUserProgress } from '../../utils/supabaseSync';
import { XP_EVENTS } from '../../constants/progressionSystem';

export default function ActividadesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const currentPlan = useStore((s) => s.currentPlan);
  const mockLateNight = useStore((s) => s.mockLateNight);
  const isNavigatingRef = useRef(false);

  // FIX: estado local de actividades — se carga desde Supabase
  // y se mergea con los datos visuales de DEFAULT_ACTIVITIES
  const [activities, setActivities] = useState<ActivityDefinition[]>(DEFAULT_ACTIVITIES);

  useFocusEffect(
    React.useCallback(() => {
      isNavigatingRef.current = false;
    }, [])
  );

  // ── Cargar actividades desde Supabase al montar ───────────────────────────
  useEffect(() => {
    const loadActivities = async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        // Si hay error o tabla vacía, usar las locales como fallback
        setActivities(DEFAULT_ACTIVITIES);
        return;
      }

      // FIX: deduplicar por id antes de mapear. Si por algún motivo Supabase
      // devuelve dos filas con el mismo id (p. ej. un "editar" que hizo insert
      // en vez de update), evita que React reciba dos elementos con la misma
      // key — eso es lo que causaba que una tarjeta se renderizara encima de otra.
      // Nos quedamos con la última fila de cada id (la más reciente según el orden).
      const dedupedMap = new Map<string, any>();
      for (const remote of data) {
        dedupedMap.set(String(remote.id), remote);
      }

      if (dedupedMap.size !== data.length) {
        console.log(
          `⚠️ Se detectaron IDs duplicados en 'activities' (${data.length} filas, ${dedupedMap.size} únicas). Revisa el flujo de editar/agregar.`
        );
      }

      // Mergear: Supabase manda title/description/icon/color/duration/route
      // Para actividades existentes (id 1-10), combinamos con datos locales
      // Para actividades nuevas del admin, usamos lo que viene de Supabase
      // FIX: se fuerza String(id) en ambos lados para evitar que una comparación
      // number vs string (típico si la columna id en Supabase es numérica)
      // rompa el merge con DEFAULT_ACTIVITIES.
      const merged: ActivityDefinition[] = Array.from(dedupedMap.values()).map((remote) => {
        const remoteId = String(remote.id);
        const local = DEFAULT_ACTIVITIES.find(a => a.id === remoteId);
        // FIX: se limpian saltos de línea y espacios repetidos. Si el texto se
        // pegó desde un Word/chat con \n incluidos, antes esto generaba huecos
        // enormes en la tarjeta (cada línea en blanco ocupa espacio real) y la
        // tarjeta siguiente terminaba pareciendo "superpuesta" con la cola del texto.
        const cleanText = (s: string) => s.replace(/\s*\n+\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
        return {
          id:          remoteId,
          title:       cleanText(remote.title       || local?.title       || ''),
          description: cleanText(remote.description || local?.description || ''),
          icon:        remote.icon        || local?.icon        || 'sparkles-outline',
          color:       remote.color       || local?.color       || '#87CEEB',
          duration:    remote.duration    || local?.duration    || '5 min',
          gradient:    local?.gradient, // gradient solo viene del local
        };
      });

      // DEBUG TEMPORAL: para ver exactamente qué está llegando y armando el merge.
      // Quita este log una vez resuelto el problema de huecos/superposición.
      console.log('ACTIVITIES DEBUG:', JSON.stringify(merged.map(a => ({ id: a.id, title: a.title }))));

      setActivities(merged);
    };

    loadActivities();
  }, []);

  const isLateNight = React.useMemo(() => {
    if (mockLateNight) return true;
    const hour = new Date().getHours();
    return hour >= 22 || hour < 5;
  }, [mockLateNight]);

  const syncActivityCompletion = async (activity: ActivityDefinition) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('activity_logs').insert({
        user_id:       user.id,
        activity_id:   activity.id,
        activity_name: activity.title,
        plan:          currentPlan ?? null,
        started_at:    new Date().toISOString(),
        completed:     true,
      });
      await saveUserProgress(user.id);
    } catch (err) {
      console.log('Error registrando actividad:', err);
    }
  };

  const logAndNavigate = (activity: ActivityDefinition, route: string) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    useStore.getState().addXP(XP_EVENTS.activity.amount);
    router.push(route as any);

    void syncActivityCompletion(activity);
  };

  const handleActivityPress = (activity: ActivityDefinition) => {
    if (currentPlan === 'balance' && isLateNight && activity.id !== '1') {
      Alert.alert(
        "Semáforo de Energía 🚦",
        "Has llegado al final del día. Tu mente necesita detenerse y desconectar.\n\nPor tu bienestar clínico, todas las actividades intensas han sido bloqueadas. Solo tienes acceso a la Respiración Guiada."
      );
      return;
    }

    const exclusive = EXCLUSIVE_ACTIVITIES[activity.id];
    if (exclusive && !exclusive.plans.includes(currentPlan || '')) {
      Alert.alert("Actividad Exclusiva 🔒", exclusive.message);
      return;
    }

    const route = ACTIVITY_ROUTES[activity.id];
    if (route) logAndNavigate(activity, route);
  };

  const sortedActivities = React.useMemo(() => {
    let topPriorityId = '';
    switch (currentPlan) {
      case 'ansiedad':       topPriorityId = '4';  break;
      case 'balance':        topPriorityId = '6';  break;
      case 'autocompasion':  topPriorityId = '9';  break;
      case 'descubrimiento': topPriorityId = '7';  break;
      case 'renacer':
      case 'depresion':      topPriorityId = '8';  break;
      case 'soledad':        topPriorityId = '10'; break;
      case 'inseguridad':    topPriorityId = '2';  break;
      default:               topPriorityId = '1';  break;
    }
    return [...activities].sort((a, b) => {
      if (a.id === topPriorityId) return -1;
      if (b.id === topPriorityId) return 1;
      return 0;
    });
  }, [activities, currentPlan]);

  const mascotText = React.useMemo(() => {
    switch (currentPlan) {
      case 'ansiedad':    return 'Un paso a la vez. Tú tienes el control 🍃';
      case 'soledad':     return 'No estás solo en esto. Hagamos algo juntos 🫂';
      case 'inseguridad': return 'Cada pequeño logro cuenta. Tú puedes 🌟';
      default:            return 'Elige una actividad y encuentra tu calma interior ✨';
    }
  }, [currentPlan]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(400)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionHeader
            title="Actividades"
            subtitle="Herramientas para tu bienestar emocional"
          />
          {currentPlan === 'balance' && (
            <Pressable
              onPress={() => useStore.getState().setMockLateNight(!mockLateNight)}
              style={{ padding: 8, backgroundColor: mockLateNight ? colors.primary : 'transparent', borderRadius: 8 }}
            >
              <Ionicons name="time-outline" size={24} color={mockLateNight ? '#FFF' : colors.textSecondary} />
            </Pressable>
          )}
        </Animated.View>

        {(currentPlan === 'balance' && isLateNight) && (
          <Animated.View entering={FadeInUp.duration(500)} style={styles.semaforoBanner}>
            <Ionicons name="moon" size={24} color="#B39DDB" />
            <View style={{ flex: 1 }}>
              <Text style={styles.semaforoTitle}>Semáforo en Rojo</Text>
              <Text style={styles.semaforoText}>Es tarde. El acceso a herramientas complejas está bloqueado para proteger tu descanso.</Text>
            </View>
          </Animated.View>
        )}

        {sortedActivities.map((activity, i) => (
          <ActivityCard
            key={activity.id}
            title={activity.title}
            description={activity.description}
            icon={activity.icon}
            color={activity.color}
            gradient={activity.gradient}
            duration={activity.duration}
            delay={i * 100}
            isRecommended={i === 0}
            onPress={() => handleActivityPress(activity)}
          />
        ))}

        <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.mascotSection}>
          <Mascot size={120} variant={(currentPlan === 'balance' && isLateNight) ? "sleeping" : "meditating"} />
          <Text style={[styles.mascotText, { color: colors.textLight }]}>
            {(currentPlan === 'balance' && isLateNight) ? "Es hora de soltar el día. Lumi ya está descansando 🌙" : mascotText}
          </Text>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
  mascotSection: { alignItems: 'center', marginTop: 24, gap: 12 },
  mascotText: { fontSize: 13, textAlign: 'center', fontFamily: 'Poppins_400Regular' },
  semaforoBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(179, 157, 219, 0.15)',
    padding: 16, borderRadius: 16, marginBottom: 24, gap: 12,
    borderWidth: 1, borderColor: 'rgba(179, 157, 219, 0.3)',
  },
  semaforoTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#B39DDB', marginBottom: 4 },
  semaforoText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#A0AEC0', lineHeight: 18 },
});