import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// 1. Configuramos cómo se comporta la notificación cuando la app está abierta (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true, // Queremos que suene bajito y dreamy
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  /**
   * Solicita el permiso al Sistema Operativo para enviar push locales.
   */
  static async requestPermissionsAsync() {
    if (!Device.isDevice) {
      console.log('Las notificaciones Push requieren un dispositivo físico.');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      } catch (error) {
        console.warn('Expo Go limita notificaciones. Usa un build real para probar esto:', error);
        return false;
      }
    }

    if (finalStatus !== 'granted') {
      console.log('Permiso denegado para notificaciones.');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C8B6FF', // Dreamy Purple Light
      });
    }

    return true;
  }

  /**
   * Pilla todas las notificaciones agendadas y las borra (útil cuando el usuario desactiva la opción en Perfil).
   */
  static async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * [1] INSPIRACIÓN MATUTINA
   * Suena todos los días a las 9:00 AM para darle los buenos días al usuario.
   */
  static async scheduleMorningQuote(quote: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync('morning_quote');
      await Notifications.scheduleNotificationAsync({
        identifier: 'morning_quote',
        content: {
          title: "✨ Buenos días",
          body: `Aquí tienes tu frase para empezar bien: "${quote}"`,
          color: '#C8B6FF', // Color del iconito de push en Android
          sound: true,
        },
        trigger: {
          type: 'daily',
          hour: 9,
          minute: 0,
        } as any,
      });
    } catch (e) {
      console.log('Error notif matutina (Probablemente Expo Go)', e);
    }
  }

  /**
   * [2] CIERRE DEL DÍA
   * Suena todos los días a las 8:00 PM para invitar al Diario de Emociones.
   */
  static async scheduleEveningJournal() {
    try {
      await Notifications.cancelScheduledNotificationAsync('evening_journal');
      await Notifications.scheduleNotificationAsync({
        identifier: 'evening_journal',
        content: {
          title: "🌙 Es hora de tu reflejo",
          body: "¿Cómo te sentiste hoy? Tómate 1 minuto para registrar tu ánimo en tu viaje.",
          color: '#A8E6CF', // Mint
          sound: true,
        },
        trigger: {
          type: 'daily',
          hour: 20, // 8:00 PM
          minute: 0,
        } as any,
      });
    } catch (e) {
      console.log('Error notif nocturna (Probablemente Expo Go)', e);
    }
  }

  /**
   * [3] RECORDATORIO DE INACTIVIDAD
   * Suena exactamente en 48 horas si el usuario no ha entrado a la app.
   * Al abrir la app, llamamos a esta función para resetear este reloj de 48h constantemente.
   */
  static async scheduleInactivityReminder() {
    try {
      // 1. Borramos cualquier recordatorio de inactividad previo (para no spammarlo)
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.data?.type === 'inactivity') {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }

      // 2. Programamos el nuevo para dentro de 48 horas (172800 segundos)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Aníma te extraña 🍃",
          body: "Han pasado un par de días desde tu última visita. ¿Hacemos una pausa activa breve?",
          color: '#8BB8E8', // Soft Blue
          sound: true,
          data: { type: 'inactivity' },
        },
        trigger: {
          type: 'timeInterval',
          seconds: 48 * 60 * 60, // 48 horas
          repeats: false,
        } as any,
      });
    } catch (e) {
      console.log('Error notif inactividad (Probablemente Expo Go)', e);
    }
  }

  /**
   * [TEST] NOTIFICACIÓN DE PRUEBA
   * Suena en 5 segundos. Ideal para probar si la configuración nativa responde.
   */
  static async scheduleTestNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "¡Hola desde Aníma! 🌙",
          body: "Tus notificaciones locales están funcionando a la perfección.",
          color: '#C8B6FF', // Dreamy Purple
          sound: true,
        },
        trigger: {
          type: 'timeInterval',
          seconds: 5, // En 5 segundos
          repeats: false,
        } as any,
      });
      console.log('Notificación de prueba programada para dentro de 5 segundos.');
    } catch (e) {
      console.log('Error programando notificación de prueba', e);
    }
  }
}
