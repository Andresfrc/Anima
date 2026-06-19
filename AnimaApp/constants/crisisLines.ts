/**
 * crisisLines.ts — Directorio de líneas de crisis por país.
 *
 * SEGURIDAD DEL USUARIO: estos números se muestran en el botón SOS a personas
 * que pueden estar en crisis. Un número incorrecto es una falla con consecuencias
 * humanas reales. Por eso:
 *   - Solo incluimos números de fuentes oficiales verificadas.
 *   - Para regiones no mapeadas usamos el fallback internacional (112, número de
 *     emergencia universal en redes móviles GSM) + un directorio mundial, en
 *     lugar de marcar un número local potencialmente inválido.
 *
 * Mantén esta lista revisada. Si añades un país, verifica la línea oficial vigente.
 */

export interface CrisisLine {
  /** Etiqueta visible, ej. "Línea 106" */
  name: string;
  /** Número marcable (solo dígitos/símbolos válidos para tel:) */
  dial: string;
  /** Descripción corta visible */
  desc: string;
}

export interface CountryCrisisInfo {
  /** Línea de salud mental / prevención del suicidio. Null si no hay una verificada. */
  mentalHealth: CrisisLine | null;
  /** Línea de emergencias generales. */
  emergency: CrisisLine;
}

/**
 * Directorio internacional de respaldo (findahelpline.com — agregador de IASP /
 * Befrienders Worldwide). Se muestra cuando no hay línea local verificada.
 */
export const INTERNATIONAL_DIRECTORY_URL = 'https://findahelpline.com';

const DIRECTORY: Record<string, CountryCrisisInfo> = {
  CO: {
    mentalHealth: { name: 'Línea 106', dial: '106', desc: 'Salud mental • Gratuita • 24/7' },
    emergency: { name: 'Línea 123', dial: '123', desc: 'Emergencias • Nacional' },
  },
  MX: {
    mentalHealth: { name: 'Línea de la Vida', dial: '8009112000', desc: 'Salud mental • Gratuita • 24/7' },
    emergency: { name: 'Emergencias 911', dial: '911', desc: 'Emergencias • Nacional' },
  },
  AR: {
    mentalHealth: { name: 'Centro de Asistencia al Suicida', dial: '135', desc: 'Salud mental • Gratuita' },
    emergency: { name: 'Emergencias 911', dial: '911', desc: 'Emergencias • Nacional' },
  },
  CL: {
    mentalHealth: { name: 'Salud Responde', dial: '6003607777', desc: 'Salud mental • 24/7' },
    emergency: { name: 'Emergencias 131', dial: '131', desc: 'Ambulancia • Nacional' },
  },
  ES: {
    mentalHealth: { name: 'Línea 024', dial: '024', desc: 'Conducta suicida • Gratuita • 24/7' },
    emergency: { name: 'Emergencias 112', dial: '112', desc: 'Emergencias • Nacional' },
  },
  US: {
    mentalHealth: { name: '988 Lifeline', dial: '988', desc: 'Suicide & Crisis • 24/7' },
    emergency: { name: 'Emergency 911', dial: '911', desc: 'Emergencias • Nacional' },
  },
};

/** Fallback para regiones sin línea local verificada. */
const INTERNATIONAL_FALLBACK: CountryCrisisInfo = {
  mentalHealth: null,
  emergency: { name: 'Emergencias 112', dial: '112', desc: 'Número de emergencia móvil universal' },
};

/**
 * Devuelve las líneas de crisis para un código de región ISO ("CO", "MX", ...).
 * Si la región es desconocida o no está mapeada, devuelve el fallback internacional.
 */
export function getCrisisLinesForRegion(regionCode?: string | null): CountryCrisisInfo {
  if (!regionCode) return INTERNATIONAL_FALLBACK;
  return DIRECTORY[regionCode.toUpperCase()] ?? INTERNATIONAL_FALLBACK;
}
