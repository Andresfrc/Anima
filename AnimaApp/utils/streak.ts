/**
 * streak.ts — Cálculo único y canónico de la racha (días consecutivos).
 *
 * Fuente única de verdad: antes la racha se calculaba de dos formas distintas
 * (una derivada del historial en la pantalla de progreso, y otra "a mano" en el
 * store que se mostraba en Perfil), lo que producía números diferentes.
 *
 * Definición: número de días CONSECUTIVOS, hasta hoy (o ayer), en los que el
 * usuario registró su estado de ánimo. Si el último registro es de hace más de
 * un día, la racha es 0.
 */
export function getStreak(history: { date: string }[]): number {
  if (!history || history.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Días únicos (sin hora), ordenados del más reciente al más antiguo.
  const uniqueDays = [...new Set(
    history.map((e) => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  )].sort((a, b) => b - a);

  const mostRecent = uniqueDays[0];
  const diffFromToday = Math.floor((today.getTime() - mostRecent) / 86400000);
  // Si el último registro no es de hoy ni de ayer, la racha se cortó.
  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = Math.floor((uniqueDays[i - 1] - uniqueDays[i]) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}
