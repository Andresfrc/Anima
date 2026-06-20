/**
 * homeNotifications.ts — Genera las notificaciones del Home a partir del estado
 * REAL del usuario (no un mock). Cada una es contextual y puede llevar a una
 * pantalla al tocarla.
 */
export interface HomeNotification {
  id: string;
  title: string;
  desc: string;
  icon: string;   // nombre de Ionicons
  color: string;
  route?: string; // destino opcional al tocar
}

export interface HomeNotificationInput {
  userName?: string;
  isNewUser: boolean;        // sin historial de ánimo todavía
  moodLoggedToday: boolean;
  streak: number;
  xpToNext: number | null;   // null si está en nivel máximo
  hasRecentActivity: boolean;
}

/**
 * Devuelve hasta 4 notificaciones relevantes, ordenadas por prioridad.
 */
export function buildHomeNotifications(input: HomeNotificationInput): HomeNotification[] {
  const list: HomeNotification[] = [];

  if (input.isNewUser) {
    list.push({
      id: 'welcome',
      title: `¡Bienvenido/a a Ánima${input.userName ? ', ' + input.userName : ''}! 🌱`,
      desc: 'Empieza registrando cómo te sientes hoy. Cada paso cuenta.',
      icon: 'sparkles',
      color: '#A78BFA',
      route: '/(tabs)/registro',
    });
  } else if (!input.moodLoggedToday) {
    list.push({
      id: 'mood-checkin',
      title: 'Tu check-in de hoy 💙',
      desc: '¿Cómo te sientes? Registra tu ánimo en un toque.',
      icon: 'heart-outline',
      color: '#F472B6',
      route: '/(tabs)/registro',
    });
  }

  if (input.streak >= 2) {
    list.push({
      id: 'streak',
      title: `¡Racha de ${input.streak} días! 🔥`,
      desc: input.moodLoggedToday
        ? 'Vas increíble. Mantén el ritmo mañana.'
        : 'No la pierdas: registra tu ánimo hoy.',
      icon: 'flame',
      color: '#F97316',
      route: input.moodLoggedToday ? undefined : '/(tabs)/registro',
    });
  }

  if (input.xpToNext !== null && input.xpToNext <= 50) {
    list.push({
      id: 'levelup-near',
      title: 'Estás a punto de subir de nivel ✨',
      desc: `Te faltan ${input.xpToNext} XP. Completa una actividad y lo logras.`,
      icon: 'trending-up',
      color: '#4ADE80',
      route: '/(tabs)/actividades',
    });
  }

  if (!input.hasRecentActivity) {
    list.push({
      id: 'activity-suggestion',
      title: 'Un momento para ti 🍃',
      desc: 'Prueba un ejercicio de calma. Bastan unos minutos.',
      icon: 'leaf-outline',
      color: '#A8E6CF',
      route: '/(tabs)/actividades',
    });
  }

  // Fallback: si nada aplica, una invitación amable a hablar con Lumi.
  if (list.length === 0) {
    list.push({
      id: 'chat',
      title: 'Lumi está aquí 💙',
      desc: 'Cuéntame cómo va tu día cuando quieras.',
      icon: 'chatbubbles-outline',
      color: '#73AEE3',
      route: '/(tabs)/chat',
    });
  }

  return list.slice(0, 4);
}
