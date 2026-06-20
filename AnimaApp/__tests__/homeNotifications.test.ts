import { buildHomeNotifications } from '../utils/homeNotifications';

describe('buildHomeNotifications', () => {
  it('usuario nuevo recibe bienvenida primero', () => {
    const n = buildHomeNotifications({ isNewUser: true, moodLoggedToday: false, streak: 0, xpToNext: 100, hasRecentActivity: false });
    expect(n[0].id).toBe('welcome');
  });

  it('si no registró ánimo hoy, incluye el check-in', () => {
    const n = buildHomeNotifications({ isNewUser: false, moodLoggedToday: false, streak: 0, xpToNext: null, hasRecentActivity: true });
    expect(n.some((x) => x.id === 'mood-checkin')).toBe(true);
  });

  it('muestra la racha si es >= 2', () => {
    const n = buildHomeNotifications({ isNewUser: false, moodLoggedToday: true, streak: 5, xpToNext: null, hasRecentActivity: true });
    expect(n.some((x) => x.id === 'streak')).toBe(true);
  });

  it('avisa si falta poco XP para subir de nivel', () => {
    const n = buildHomeNotifications({ isNewUser: false, moodLoggedToday: true, streak: 0, xpToNext: 30, hasRecentActivity: true });
    expect(n.some((x) => x.id === 'levelup-near')).toBe(true);
  });

  it('nunca devuelve una lista vacía (fallback)', () => {
    const n = buildHomeNotifications({ isNewUser: false, moodLoggedToday: true, streak: 0, xpToNext: null, hasRecentActivity: true });
    expect(n.length).toBeGreaterThan(0);
  });

  it('devuelve como máximo 4 notificaciones', () => {
    const n = buildHomeNotifications({ isNewUser: true, moodLoggedToday: false, streak: 10, xpToNext: 10, hasRecentActivity: false });
    expect(n.length).toBeLessThanOrEqual(4);
  });
});
