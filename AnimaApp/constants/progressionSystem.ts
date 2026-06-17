/**
 * Sistema de Progresión — Motor de niveles, XP y recompensas.
 *
 * Cada ruta tiene 5 niveles con nombres temáticos, umbrales de XP,
 * y recompensas desbloqueables. El sistema NUNCA castiga al usuario
 * por inactividad — solo celebra el esfuerzo.
 *
 * Fuentes de XP:
 *   - Registrar mood: +10 XP
 *   - Completar actividad: +25 XP
 *   - Escribir diario estelar: +15 XP
 *   - Racha de 3+ días: +50 XP bonus
 *   - Volver después de inactividad: +30 XP
 */

// ─── Types ─────────────────────────────────────────────
export interface RouteLevel {
  level: number;
  title: string;
  xpRequired: number;
  icon: string;         // Ionicons name
  color: string;
  lumiMessage: string;  // Lumi says this when you level up
  reward?: Reward;
}

export interface Reward {
  id: string;
  type: 'lumi_variant' | 'sound' | 'theme' | 'breathing' | 'title';
  name: string;
  description: string;
  icon: string;
}

export interface RouteProgression {
  routeId: string;
  routeName: string;
  emoji: string;
  color: string;
  gradient: [string, string];
  levels: RouteLevel[];
}

export interface XPEvent {
  type: 'mood' | 'activity' | 'journal' | 'streak' | 'comeback';
  amount: number;
  label: string;
  icon: string;
}

// ─── XP Values ─────────────────────────────────────────
export const XP_EVENTS: Record<string, XPEvent> = {
  mood:     { type: 'mood',     amount: 10, label: 'Registrar ánimo',     icon: 'heart' },
  activity: { type: 'activity', amount: 25, label: 'Actividad completada', icon: 'sparkles' },
  journal:  { type: 'journal',  amount: 15, label: 'Diario Estelar',      icon: 'star' },
  streak:   { type: 'streak',   amount: 50, label: 'Racha de constancia',  icon: 'flame' },
  comeback: { type: 'comeback', amount: 30, label: 'Volviste 💪',         icon: 'refresh' },
};

// ─── Route Progressions ────────────────────────────────

const RENACER_LEVELS: RouteLevel[] = [
  {
    level: 1, title: 'Semilla', xpRequired: 0,
    icon: 'leaf-outline', color: '#A8E6CF',
    lumiMessage: 'Toda transformación empieza con plantar la primera semilla. 🌱',
  },
  {
    level: 2, title: 'Brote', xpRequired: 150,
    icon: 'flower-outline', color: '#88D8B0',
    lumiMessage: '¡Algo está creciendo dentro de ti! Cada paso cuenta. 🌿',
    reward: { id: 'ren_r1', type: 'title', name: 'Título: Guerrero/a Silencioso/a', description: 'Un título que refleja tu fuerza interior', icon: 'ribbon-outline' },
  },
  {
    level: 3, title: 'Tallo Fuerte', xpRequired: 400,
    icon: 'trending-up-outline', color: '#4ADE80',
    lumiMessage: 'Mira lo lejos que has llegado. Eres más fuerte de lo que crees. 💚',
    reward: { id: 'ren_r2', type: 'sound', name: 'Sonido: Bosque Sereno', description: 'Nuevo ambiente para Pomodoro', icon: 'musical-notes-outline' },
  },
  {
    level: 4, title: 'Flor Abierta', xpRequired: 800,
    icon: 'sunny-outline', color: '#22C55E',
    lumiMessage: 'Tu luz empieza a brillar para otros también. ☀️',
    reward: { id: 'ren_r3', type: 'breathing', name: 'Respiración: Amanecer', description: 'Patrón de respiración de energía suave', icon: 'water-outline' },
  },
  {
    level: 5, title: 'Fénix', xpRequired: 1500,
    icon: 'flame-outline', color: '#15803D',
    lumiMessage: 'Has renacido. No eres la misma persona que empezó. Eres más. 🔥',
    reward: { id: 'ren_r4', type: 'lumi_variant', name: 'Lumi Fénix', description: 'Variante exclusiva de Lumi', icon: 'star-outline' },
  },
];

const AUTOCOMPASION_LEVELS: RouteLevel[] = [
  {
    level: 1, title: 'Primer Abrazo', xpRequired: 0,
    icon: 'heart-outline', color: '#F9A8D4',
    lumiMessage: 'El primer paso es decidir que mereces cariño. Ya lo diste. 💕',
  },
  {
    level: 2, title: 'Voz Amable', xpRequired: 150,
    icon: 'chatbubble-heart-outline', color: '#F472B6',
    lumiMessage: 'Estás aprendiendo a hablarte diferente. Eso cambia todo. 🌸',
    reward: { id: 'aut_r1', type: 'title', name: 'Título: Corazón Valiente', description: 'Porque tratarte bien es lo más valiente', icon: 'ribbon-outline' },
  },
  {
    level: 3, title: 'Escudo de Bondad', xpRequired: 400,
    icon: 'shield-checkmark-outline', color: '#EC4899',
    lumiMessage: 'Tu autocompasión ya es un escudo contra la autocrítica. 🛡️',
    reward: { id: 'aut_r2', type: 'sound', name: 'Sonido: Lluvia Suave', description: 'Ambiente reconfortante para meditar', icon: 'musical-notes-outline' },
  },
  {
    level: 4, title: 'Espejo Compasivo', xpRequired: 800,
    icon: 'eye-outline', color: '#DB2777',
    lumiMessage: 'Ahora puedes mirarte y ver algo hermoso. Siempre estuvo ahí. ✨',
    reward: { id: 'aut_r3', type: 'breathing', name: 'Respiración: Abrazo Interior', description: 'Respiración que abraza por dentro', icon: 'water-outline' },
  },
  {
    level: 5, title: 'Alma Liberada', xpRequired: 1500,
    icon: 'sparkles-outline', color: '#BE185D',
    lumiMessage: 'Te liberaste de la culpa. Ahora vives. 🦋',
    reward: { id: 'aut_r4', type: 'lumi_variant', name: 'Lumi Mariposa', description: 'Lumi transformado, como tú', icon: 'star-outline' },
  },
];

const BALANCE_LEVELS: RouteLevel[] = [
  {
    level: 1, title: 'Aprendiz del Silencio', xpRequired: 0,
    icon: 'moon-outline', color: '#93C5FD',
    lumiMessage: 'Has decidido que tu paz importa. Ese es el primer paso. 🌙',
  },
  {
    level: 2, title: 'Guardián de Límites', xpRequired: 150,
    icon: 'shield-outline', color: '#60A5FA',
    lumiMessage: 'Ya sabes decir "no". Tu energía es sagrada. 🕊️',
    reward: { id: 'bal_r1', type: 'title', name: 'Título: Centinela de Paz', description: 'Guardas tu paz como un tesoro', icon: 'ribbon-outline' },
  },
  {
    level: 3, title: 'Ojo de la Tormenta', xpRequired: 400,
    icon: 'thunderstorm-outline', color: '#3B82F6',
    lumiMessage: 'El caos sigue afuera, pero tú estás en calma. Eso es poder. ⚡',
    reward: { id: 'bal_r2', type: 'sound', name: 'Sonido: Olas de Paz', description: 'El mar como fondo de concentración', icon: 'musical-notes-outline' },
  },
  {
    level: 4, title: 'Maestro Interior', xpRequired: 800,
    icon: 'planet-outline', color: '#2563EB',
    lumiMessage: 'Tu mente es tu aliada, no tu enemiga. Lo lograste. 🧠',
    reward: { id: 'bal_r3', type: 'breathing', name: 'Respiración: Equilibrio Total', description: 'Patrón de coherencia cardíaca', icon: 'water-outline' },
  },
  {
    level: 5, title: 'Alma Serena', xpRequired: 1500,
    icon: 'diamond-outline', color: '#1D4ED8',
    lumiMessage: 'La serenidad no es la ausencia de tormenta, es tu poder dentro de ella. 💎',
    reward: { id: 'bal_r4', type: 'lumi_variant', name: 'Lumi Zen', description: 'La versión más sabia de Lumi', icon: 'star-outline' },
  },
];

const DESCUBRIMIENTO_LEVELS: RouteLevel[] = [
  {
    level: 1, title: 'Explorador/a', xpRequired: 0,
    icon: 'compass-outline', color: '#FCD34D',
    lumiMessage: 'La curiosidad es la puerta a conocerte. ¡Bienvenido/a! 🧭',
  },
  {
    level: 2, title: 'Cartógrafo/a Interior', xpRequired: 150,
    icon: 'map-outline', color: '#FBBF24',
    lumiMessage: 'Estás mapeando territorios emocionales que antes eran desconocidos. 🗺️',
    reward: { id: 'des_r1', type: 'title', name: 'Título: Buscador/a de Verdades', description: 'Buscas tu verdad con valentía', icon: 'ribbon-outline' },
  },
  {
    level: 3, title: 'Alquimista', xpRequired: 400,
    icon: 'flask-outline', color: '#F59E0B',
    lumiMessage: 'Conviertes cada experiencia en conocimiento. Eso es alquimia. ⚗️',
    reward: { id: 'des_r2', type: 'sound', name: 'Sonido: Noche Estrellada', description: 'Ambiente cósmico para reflexionar', icon: 'musical-notes-outline' },
  },
  {
    level: 4, title: 'Visionario/a', xpRequired: 800,
    icon: 'telescope-outline', color: '#D97706',
    lumiMessage: 'Ves lo que otros no ven. Tu sensibilidad es tu superpoder. 🔭',
    reward: { id: 'des_r3', type: 'breathing', name: 'Respiración: Expansión', description: 'Respiración que abre la mente', icon: 'water-outline' },
  },
  {
    level: 5, title: 'Sabio/a Interior', xpRequired: 1500,
    icon: 'bulb-outline', color: '#B45309',
    lumiMessage: 'Te encontraste. Y lo que encontraste es extraordinario. 💡',
    reward: { id: 'des_r4', type: 'lumi_variant', name: 'Lumi Cósmico', description: 'Lumi conectado con las estrellas', icon: 'star-outline' },
  },
];

const SOLEDAD_LEVELS: RouteLevel[] = [
  {
    level: 1, title: 'Primer Paso', xpRequired: 0,
    icon: 'footsteps-outline', color: '#C4B5FD',
    lumiMessage: 'No estás solo/a. Nunca lo estuviste. Estoy aquí. 💜',
  },
  {
    level: 2, title: 'Voz Propia', xpRequired: 150,
    icon: 'mic-outline', color: '#A78BFA',
    lumiMessage: 'Estás aprendiendo que tu compañía tiene valor. Y lo tiene. 🎤',
    reward: { id: 'sol_r1', type: 'title', name: 'Título: Compañero/a de Viaje', description: 'Ya no caminas solo/a', icon: 'ribbon-outline' },
  },
  {
    level: 3, title: 'Constructor/a de Puentes', xpRequired: 400,
    icon: 'git-merge-outline', color: '#8B5CF6',
    lumiMessage: 'Cada conexión que haces construye un puente. Y tú los construyes bien. 🌉',
    reward: { id: 'sol_r2', type: 'sound', name: 'Sonido: Fogata Cálida', description: 'El calor de estar acompañado/a', icon: 'musical-notes-outline' },
  },
  {
    level: 4, title: 'Tejedor/a de Lazos', xpRequired: 800,
    icon: 'link-outline', color: '#7C3AED',
    lumiMessage: 'Tus lazos son fuertes porque nacen de la autenticidad. 🧶',
    reward: { id: 'sol_r3', type: 'breathing', name: 'Respiración: Conexión', description: 'Respiración que conecta contigo', icon: 'water-outline' },
  },
  {
    level: 5, title: 'Puente Humano', xpRequired: 1500,
    icon: 'people-outline', color: '#6D28D9',
    lumiMessage: 'Te convertiste en alguien que ilumina la soledad de otros. Eso es trascender. 🌟',
    reward: { id: 'sol_r4', type: 'lumi_variant', name: 'Lumi Guardián', description: 'El Lumi que cuida a otros', icon: 'star-outline' },
  },
];

// ─── Exported Map ──────────────────────────────────────
export const ROUTE_PROGRESSIONS: Record<string, RouteProgression> = {
  renacer: {
    routeId: 'renacer', routeName: 'Renacer', emoji: '🔥',
    color: '#4ADE80', gradient: ['#4ADE80', '#22C55E'],
    levels: RENACER_LEVELS,
  },
  autocompasion: {
    routeId: 'autocompasion', routeName: 'Autocompasión', emoji: '💕',
    color: '#F472B6', gradient: ['#F9A8D4', '#EC4899'],
    levels: AUTOCOMPASION_LEVELS,
  },
  balance: {
    routeId: 'balance', routeName: 'Balance', emoji: '⚖️',
    color: '#60A5FA', gradient: ['#93C5FD', '#3B82F6'],
    levels: BALANCE_LEVELS,
  },
  descubrimiento: {
    routeId: 'descubrimiento', routeName: 'Descubrimiento', emoji: '🧭',
    color: '#FBBF24', gradient: ['#FCD34D', '#F59E0B'],
    levels: DESCUBRIMIENTO_LEVELS,
  },
  soledad: {
    routeId: 'soledad', routeName: 'Soledad', emoji: '💜',
    color: '#A78BFA', gradient: ['#C4B5FD', '#8B5CF6'],
    levels: SOLEDAD_LEVELS,
  },
};

// ─── Helper Functions ──────────────────────────────────

/** Get current level info for a route given XP */
export function getCurrentLevel(routeId: string, xp: number): RouteLevel {
  const progression = ROUTE_PROGRESSIONS[routeId];
  if (!progression) return BALANCE_LEVELS[0]; // fallback
  
  let current = progression.levels[0];
  for (const level of progression.levels) {
    if (xp >= level.xpRequired) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}

/** Get next level info (or null if max) */
export function getNextLevel(routeId: string, xp: number): RouteLevel | null {
  const progression = ROUTE_PROGRESSIONS[routeId];
  if (!progression) return null;
  
  for (const level of progression.levels) {
    if (xp < level.xpRequired) return level;
  }
  return null; // max level
}

/** Get XP progress percentage to next level (0-1) */
export function getLevelProgress(routeId: string, xp: number): number {
  const current = getCurrentLevel(routeId, xp);
  const next = getNextLevel(routeId, xp);
  if (!next) return 1; // max level = full bar
  
  const range = next.xpRequired - current.xpRequired;
  const progress = xp - current.xpRequired;
  return Math.min(Math.max(progress / range, 0), 1);
}

/** Get all unlocked rewards for a route */
export function getUnlockedRewards(routeId: string, xp: number): Reward[] {
  const progression = ROUTE_PROGRESSIONS[routeId];
  if (!progression) return [];
  
  return progression.levels
    .filter(l => l.reward && xp >= l.xpRequired)
    .map(l => l.reward!);
}

/** Get all rewards for a route (locked + unlocked based on XP) */
export function getAllRewards(routeId: string, xp: number = 0): { reward: Reward; unlocked: boolean; level: number; xpRequired: number }[] {
  const progression = ROUTE_PROGRESSIONS[routeId];
  if (!progression) return [];
  
  return progression.levels
    .filter(l => l.reward)
    .map(l => ({ reward: l.reward!, unlocked: xp >= l.xpRequired, level: l.level, xpRequired: l.xpRequired }));
}
