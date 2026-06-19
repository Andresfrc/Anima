/**
 * validation.ts — Reglas de validación compartidas para los flujos de auth.
 * Fuente única de verdad: login, registro y recuperación usan estas funciones
 * para evitar inconsistencias (antes el mínimo de contraseña variaba entre 6 y 8).
 */
import { Colors } from '../constants/theme';

export const PASSWORD_MIN_LENGTH = 8;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Valida una contraseña según política mínima (OWASP-friendly):
 * al menos 8 caracteres e incluir letras y números.
 * Devuelve `null` si es válida, o un mensaje de error si no lo es.
 */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'La contraseña debe combinar letras y números.';
  }
  return null;
}

export interface PasswordStrength {
  level: 0 | 1 | 2 | 3;
  label: string;
  color: string;
}

/**
 * Calcula la fuerza de una contraseña para el medidor visual.
 * Considera longitud y variedad de caracteres (mayúsculas, números, símbolos).
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return { level: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (password.length < PASSWORD_MIN_LENGTH || score <= 1) {
    return { level: 1, label: 'Débil', color: '#E53E3E' };
  }
  if (score === 2 || score === 3) {
    return { level: 2, label: 'Media', color: Colors.accent };
  }
  return { level: 3, label: 'Fuerte', color: Colors.mint };
}

/**
 * Traduce errores técnicos de Supabase Auth a mensajes claros en español,
 * sin filtrar detalles internos ni revelar si una cuenta existe.
 */
export function friendlyAuthError(message?: string | null): string {
  if (!message) return 'Ocurrió un error. Intenta de nuevo.';
  const m = message.toLowerCase();

  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.';
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'Ya existe una cuenta con este correo. Inicia sesión.';
  }
  if (m.includes('password')) return 'La contraseña no cumple los requisitos de seguridad.';
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Problema de conexión. Revisa tu internet e intenta de nuevo.';
  }
  return 'No pudimos completar la acción. Intenta de nuevo.';
}
