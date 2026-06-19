import {
  getCurrentLevel,
  getNextLevel,
  getLevelProgress,
  getUnlockedRewards,
  XP_EVENTS,
} from '../constants/progressionSystem';

describe('progressionSystem', () => {
  it('empieza en nivel 1 con 0 XP', () => {
    expect(getCurrentLevel('renacer', 0).level).toBe(1);
  });

  it('sube de nivel exactamente en el umbral (sin off-by-one)', () => {
    expect(getCurrentLevel('renacer', 149).level).toBe(1);
    expect(getCurrentLevel('renacer', 150).level).toBe(2);
    expect(getCurrentLevel('renacer', 400).level).toBe(3);
  });

  it('llega al nivel máximo (5) con XP muy alto', () => {
    expect(getCurrentLevel('renacer', 999999).level).toBe(5);
  });

  it('ruta desconocida cae en un fallback seguro de nivel 1', () => {
    expect(getCurrentLevel('ruta-inexistente', 500).level).toBe(1);
  });

  it('getNextLevel devuelve el siguiente umbral y null en el tope', () => {
    expect(getNextLevel('renacer', 0)?.xpRequired).toBe(150);
    expect(getNextLevel('renacer', 1500)).toBeNull();
  });

  it('getLevelProgress queda acotado entre 0 y 1', () => {
    expect(getLevelProgress('renacer', 0)).toBeCloseTo(0);
    expect(getLevelProgress('renacer', 75)).toBeCloseTo(0.5);
    expect(getLevelProgress('renacer', 1500)).toBe(1);
  });

  it('las recompensas desbloqueadas crecen con el XP', () => {
    expect(getUnlockedRewards('renacer', 0)).toHaveLength(0);
    expect(getUnlockedRewards('renacer', 1500).length).toBeGreaterThan(0);
  });

  it('los valores de XP_EVENTS son los esperados', () => {
    expect(XP_EVENTS.mood.amount).toBe(10);
    expect(XP_EVENTS.activity.amount).toBe(25);
    expect(XP_EVENTS.journal.amount).toBe(15);
  });
});
