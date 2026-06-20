/**
 * faq.ts — Preguntas frecuentes mostradas en Perfil → Ayuda y Soporte.
 * Fuente única de verdad para el contenido del FAQ.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export const SUPPORT_EMAIL = 'animaapp.soporte@gmail.com';

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: '¿Qué es Ánima?',
    a: 'Ánima es una app de acompañamiento emocional. Te ayuda a registrar cómo te sientes, practicar ejercicios de calma y construir hábitos de bienestar a tu ritmo, con la compañía de Lumi.',
  },
  {
    q: '¿Ánima reemplaza a un psicólogo o a la terapia?',
    a: 'No. Ánima es una herramienta de autocuidado y psicoeducación, no un servicio médico ni un sustituto de atención profesional. Si atraviesas una crisis o tu malestar persiste, busca ayuda de un profesional o usa el botón SOS.',
  },
  {
    q: '¿Cómo funciona el registro de ánimo?',
    a: 'Cada día puedes registrar tu estado de ánimo con un toque. Con el tiempo verás tu tendencia semanal y podrás notar patrones. Solo se guarda un registro por día.',
  },
  {
    q: '¿Qué son las rutas emocionales?',
    a: 'Son caminos personalizados (Renacer, Autocompasión, Balance, Descubrimiento, Soledad) que adaptan las actividades y el tono de Lumi a tu momento. Se eligen tras el cuestionario inicial.',
  },
  {
    q: '¿Puedo cambiar mi ruta?',
    a: 'Sí. Ve a Perfil → Sistema → "Cambiar Mi Ruta" para elegir otra cuando lo necesites.',
  },
  {
    q: '¿Qué es el XP y los niveles?',
    a: 'Ganas experiencia (XP) al registrar tu ánimo, completar actividades y escribir en tu diario. El XP sube tu nivel dentro de tu ruta y desbloquea recompensas como sonidos y variantes de Lumi.',
  },
  {
    q: '¿Quién puede ver mis registros y mi diario?',
    a: 'Tu información está asociada a tu cuenta personal y se usa únicamente para ofrecerte la experiencia dentro de la app. No vendemos tus datos ni los compartimos con fines publicitarios.',
  },
  {
    q: '¿Cómo activo o desactivo las notificaciones?',
    a: 'En Perfil → Sistema → "Notificaciones" puedes activarlas o desactivarlas cuando quieras.',
  },
  {
    q: '¿Para qué sirve el botón SOS?',
    a: 'Es un acceso rápido a ejercicios de calma inmediata y a líneas de ayuda profesional de tu país. Úsalo si te sientes sobrepasado/a. Ánima no reemplaza a los servicios de emergencia.',
  },
  {
    q: '¿Ánima funciona sin internet?',
    a: 'Algunas funciones (como ver tus registros guardados) funcionan sin conexión, pero el chat con Lumi y la sincronización de tu progreso necesitan internet.',
  },
  {
    q: '¿Cómo elimino mi cuenta y mis datos?',
    a: `Escríbenos a ${SUPPORT_EMAIL} desde el correo de tu cuenta y procesaremos la eliminación de tu cuenta y tus datos asociados.`,
  },
  {
    q: '¿Cómo contacto con soporte?',
    a: `Desde Perfil → Ayuda y Soporte → "Enviar un correo a soporte", o directamente a ${SUPPORT_EMAIL}. Respondemos lo antes posible.`,
  },
];
