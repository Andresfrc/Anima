import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Comportamiento cuando la app está en primer plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Mensajes personalizados por ruta emocional ──────────────────────────────
interface Reminders {
  morning: string;
  midday: string;
  evening: string;
}

const ROUTE_REMINDERS: Record<string, Reminders> = {
  ansiedad: {
    morning: 'Empieza con 3 respiraciones lentas. Estás a salvo. 🍃',
    midday: 'Pausa: suelta los hombros y respira hondo una vez. 🌬️',
    evening: '¿Cómo estuvo tu cuerpo hoy? Registra tu ánimo antes de dormir. 🌙',
  },
  soledad: {
    morning: 'Buenos días. No estás solo/a, aquí estoy contigo. 💜',
    midday: 'Un gesto pequeño cuenta: escríbele a alguien hoy. ✨',
    evening: 'Cierra el día contándome cómo te sentiste. 🌙',
  },
  inseguridad: {
    morning: 'Hoy recuerda algo que hiciste bien. Eres capaz. 🌟',
    midday: 'Eres suficiente, justo como eres ahora. 💪',
    evening: 'Anota una pequeña victoria de hoy en tu diario. ⭐',
  },
  renacer: {
    morning: 'Un paso minúsculo ya es avanzar. Bebe un vaso de agua. 🌱',
    midday: 'La acción primero, la motivación después. Muévete 1 minuto. ☀️',
    evening: 'Reconoce tu esfuerzo de hoy. Registra tu ánimo. 🌙',
  },
  autocompasion: {
    morning: 'Trátate hoy con la bondad que le darías a un amigo. 💗',
    midday: 'Una mano en el pecho y un respiro amable. Te lo mereces. 🤍',
    evening: 'Antes de dormir, date las gracias por hoy. 🌙',
  },
  balance: {
    morning: 'Tu paz importa. Empieza el día sin prisa. 🌙',
    midday: 'Haz una pausa real de 2 minutos. Tu energía es sagrada. ⚖️',
    evening: 'Desconecta. Registra tu ánimo y descansa. 😴',
  },
  descubrimiento: {
    morning: 'Hoy explora una pequeña curiosidad. 🧭',
    midday: 'No necesitas el mapa completo para dar un paso. 🗺️',
    evening: '¿Qué descubriste hoy de ti? Anótalo. 🌙',
  },
  depresion: {
    morning: 'Solo levantarte ya es valiente. Un paso a la vez. 🌅',
    midday: 'Bebe agua y respira. Estoy orgulloso/a de ti. 💧',
    evening: 'Registra cómo te sentiste hoy, sin juzgarte. 🌙',
  },
};

const DEFAULT_REMINDERS: Reminders = {
  morning: 'Buenos días. Date un momento de calma para empezar. ☀️',
  midday: 'Pausa breve: respira hondo una vez. 🍃',
  evening: '¿Cómo te sentiste hoy? Registra tu ánimo. 🌙',
};

function getReminders(plan: string | null): Reminders {
  return (plan && ROUTE_REMINDERS[plan]) || DEFAULT_REMINDERS;
}

export class NotificationService {
  /**
   * Solicita el permiso al SO y configura el canal de Android.
   */
  static async requestPermissionsAsync() {
    if (!Device.isDevice) {
      console.log('Las notificaciones push requieren un dispositivo físico.');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      } catch (error) {
        console.warn('Expo Go limita notificaciones. Usa un build real para probarlas:', error);
        return false;
      }
    }

    if (finalStatus !== 'granted') {
      console.log('Permiso denegado para notificaciones.');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Recordatorios de Ánima',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C8B6FF',
      });
    }

    return true;
  }

  /**
   * Cancela todas las notificaciones agendadas (al desactivar la opción en Perfil).
   */
  static async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Programa TODOS los recordatorios diarios, personalizados según la ruta del
   * usuario. Es idempotente: cancela los previos y vuelve a agendar, así se
   * puede llamar en cada arranque o cuando el usuario cambia de ruta.
   *
   *  - 09:00  Motivación matutina (según ruta)
   *  - 14:00  Pausa de autocuidado (según ruta)
   *  - 20:00  Cierre del día / registrar ánimo (según ruta)
   *  - Domingo 19:00  Reflexión semanal
   *  - +48h   Recordatorio de inactividad
   */
  static async scheduleDailyReminders(plan: string | null) {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const r = getReminders(plan);

      await Notifications.scheduleNotificationAsync({
        identifier: 'morning_motivation',
        content: { title: '✨ Buenos días', body: r.morning, color: '#C8B6FF', sound: true, data: { type: 'morning' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 0 },
      });

      await Notifications.scheduleNotificationAsync({
        identifier: 'midday_selfcare',
        content: { title: '🍃 Una pausa para ti', body: r.midday, color: '#A8E6CF', sound: true, data: { type: 'midday' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 14, minute: 0 },
      });

      await Notifications.scheduleNotificationAsync({
        identifier: 'evening_checkin',
        content: { title: '🌙 Cierre del día', body: r.evening, color: '#8BB8E8', sound: true, data: { type: 'evening' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0 },
      });

      await Notifications.scheduleNotificationAsync({
        identifier: 'weekly_reflection',
        content: {
          title: '🌌 Reflexión de la semana',
          body: 'Mira tu semana con cariño. ¿Qué aprendiste de ti?',
          color: '#C8B6FF', sound: true, data: { type: 'weekly' },
        },
        // weekday: 1 = domingo en expo-notifications
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 19, minute: 0 },
      });

      await NotificationService.scheduleInactivityReminder();
    } catch (e) {
      console.log('Error programando recordatorios (probablemente Expo Go):', e);
    }
  }

  /**
   * Recordatorio de inactividad: suena en 48h. Se reprograma cada vez que el
   * usuario abre/cierra la app, reiniciando el reloj.
   */
  static async scheduleInactivityReminder() {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.data?.type === 'inactivity') {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Ánima te extraña 🍃',
          body: 'Han pasado un par de días. ¿Hacemos una pausa breve juntos?',
          color: '#8BB8E8', sound: true, data: { type: 'inactivity' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 48 * 60 * 60, repeats: false },
      });
    } catch (e) {
      console.log('Error notif inactividad (probablemente Expo Go):', e);
    }
  }
}
