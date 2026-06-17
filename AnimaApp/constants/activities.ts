/**
 * constants/activities.ts — Definición estática de actividades.
 *
 * ¿POR QUÉ se movió aquí?
 * Las actividades son datos estáticos (catálogo), no estado mutable.
 * Definirlas en el store las persistía innecesariamente. Además:
 * - Aquí es fácil de encontrar y editar por diseñadores/PMs
 * - Se puede importar en tests sin inicializar el store
 * - La ruta de navegación por ID está junto a los datos
 */

export interface ActivityDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient?: [string, string];
  duration: string;
}

/**
 * Catálogo de actividades de la app.
 */
export const DEFAULT_ACTIVITIES: ActivityDefinition[] = [
  { id: '1', title: 'Respiración Guiada', description: 'Respira y relaja tu mente.', icon: 'water-outline', color: '#87CEEB', gradient: ['#89F7FE', '#66A6FF'], duration: '5 min' },
  { id: '2', title: 'Diario Estelar', description: 'Escribe cosas positivas del día.', icon: 'journal-outline', color: '#FFD93D', gradient: ['#FFD200', '#F7971E'], duration: '10 min' },
  { id: '3', title: 'Relajación Progresiva', description: 'Libera la tensión de tu cuerpo.', icon: 'leaf-outline', color: '#C4B7EB', gradient: ['#E0C3FC', '#8EC5FC'], duration: '8 min' },
  { id: '4', title: 'Conexión 5 Sentidos', description: 'Atención plena interactiva para la ansiedad.', icon: 'planet-outline', color: '#A8E6CF', gradient: ['#D4FC79', '#96E6A1'], duration: '5 min' },
  { id: '5', title: 'Cápsula de Papel', description: 'Desahoga y quema tus pensamientos negativos.', icon: 'flame-outline', color: '#FF7E67', gradient: ['#FF9A44', '#FC6076'], duration: 'Actividad libre' },
  { id: '6', title: 'Pomodoro de Paz', description: 'Céntrate con descansos activos y sonidos de lluvia.', icon: 'timer-outline', color: '#4ADE80', gradient: ['#4ADE80', '#38BDF8'], duration: '25 min' },
  { id: '7', title: 'Diario Ciego', description: 'Escribe sin censura ni edición. Tus palabras desaparecerán solas.', icon: 'eye-off-outline', color: '#B39DDB', gradient: ['#D1C4E9', '#9575CD'], duration: 'Ruta Descubrimiento' },
  { id: '8', title: 'Astillero de Victorias', description: 'Avanza tu barco celebrando cada pequeño paso.', icon: 'boat-outline', color: '#FFB74D', gradient: ['#FFE082', '#FF8A65'], duration: 'Ruta Renacer' },
  { id: '9', title: 'Abrazo de Mariposa', description: 'Estimulación bilateral para calmar tu sistema nervioso.', icon: 'heart-half-outline', color: '#F48FB1', gradient: ['#FFCDD2', '#F06292'], duration: 'Ruta Autocompasión' },
  { id: '10', title: 'Mensaje en una Botella', description: 'Lanza un mensaje al mar y recibe aliento anónimo.', icon: 'paper-plane-outline', color: '#4FC3F7', gradient: ['#81D4FA', '#29B6F6'], duration: 'Ruta Soledad' },
];

/**
 * Mapa ID → Ruta de navegación.
 *
 * ¿POR QUÉ esto en vez de string matching por título?
 * Si alguien cambia el título de "Respiración Guiada" a "Guía de Respiración",
 * el routing se rompería silenciosamente con string matching.
 * Con un mapa por ID, el routing es estable e inmune a cambios de texto.
 */
export const ACTIVITY_ROUTES: Record<string, string> = {
  '1': '/actividades/respiracion',
  '2': '/actividades/gratitud',
  '3': '/actividades/relajacion',
  '4': '/actividades/grounding',
  '5': '/actividades/capsula',
  '6': '/actividades/pomodoro',
  '7': '/actividades/diario-ciego',
  '8': '/actividades/astillero',
  '9': '/actividades/abrazo',
  '10': '/actividades/botella',
};

/**
 * Actividades que requieren estar en una ruta específica para acceder.
 */
export const EXCLUSIVE_ACTIVITIES: Record<string, { plans: string[]; message: string }> = {
  '7': {
    plans: ['descubrimiento'],
    message: 'El Diario Ciego es una herramienta clínica diseñada terapéuticamente solo para la Ruta del Descubrimiento.\n\nPuedes cambiar tu ruta actual en la pantalla de Perfil para acceder a ella.',
  },
  '8': {
    plans: ['renacer', 'depresion'],
    message: 'El Astillero de Victorias es un mini-juego terapéutico para recuperar la motivación, exclusivo de la Ruta Renacer.\n\nPuedes cambiar tu ruta actual en la pantalla de Perfil para acceder a ella.',
  },
  '9': {
    plans: ['autocompasion'],
    message: 'El Abrazo de Mariposa es una técnica de regulación háptica exclusiva de la Ruta Autocompasión.\n\nPuedes cambiar tu ruta actual en la pantalla de Perfil para acceder a ella.',
  },
  '10': {
    plans: ['soledad'],
    message: 'El Mensaje en una Botella es un espacio de conexión anónima, exclusivo de la Ruta Soledad.\n\nPuedes cambiar tu ruta actual en la pantalla de Perfil para acceder a ella.',
  },
};
