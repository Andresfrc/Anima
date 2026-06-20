import { getStreak } from '../utils/streak';

function daysAgo(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe('getStreak', () => {
  it('historial vacío → 0', () => {
    expect(getStreak([])).toBe(0);
  });

  it('solo hoy → 1', () => {
    expect(getStreak([{ date: daysAgo(0) }])).toBe(1);
  });

  it('hoy + ayer + antier → 3', () => {
    expect(getStreak([{ date: daysAgo(0) }, { date: daysAgo(1) }, { date: daysAgo(2) }])).toBe(3);
  });

  it('ignora duplicados del mismo día', () => {
    expect(getStreak([{ date: daysAgo(0) }, { date: daysAgo(0) }, { date: daysAgo(1) }])).toBe(2);
  });

  it('si el último registro es de hace 2 días → 0 (racha cortada)', () => {
    expect(getStreak([{ date: daysAgo(2) }, { date: daysAgo(3) }])).toBe(0);
  });

  it('cuenta solo hasta el primer hueco', () => {
    // hoy, ayer, (hueco en día 2), hace 3 días → racha = 2
    expect(getStreak([{ date: daysAgo(0) }, { date: daysAgo(1) }, { date: daysAgo(3) }])).toBe(2);
  });

  it('ayer cuenta aunque no haya registro de hoy', () => {
    expect(getStreak([{ date: daysAgo(1) }, { date: daysAgo(2) }])).toBe(2);
  });
});
