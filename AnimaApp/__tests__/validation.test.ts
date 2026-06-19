// Mockeamos el theme para no cargar react-native en un test de lógica pura.
jest.mock('../constants/theme', () => ({
  Colors: { accent: '#FFB020', mint: '#A8E6CF' },
}));

import {
  isValidEmail,
  validatePassword,
  getPasswordStrength,
  PASSWORD_MIN_LENGTH,
} from '../utils/validation';

describe('validation', () => {
  it('valida correos correctamente', () => {
    expect(isValidEmail('persona@dominio.com')).toBe(true);
    expect(isValidEmail('sin-arroba')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('  ')).toBe(false);
  });

  it('la política mínima de contraseña es 8 caracteres', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });

  it('rechaza contraseñas débiles y acepta las fuertes', () => {
    expect(validatePassword('corto1')).not.toBeNull();    // < 8
    expect(validatePassword('abcdefgh')).not.toBeNull();  // sin números
    expect(validatePassword('12345678')).not.toBeNull();  // sin letras
    expect(validatePassword('abcd1234')).toBeNull();      // válida
  });

  it('el medidor de fuerza escala con la complejidad', () => {
    expect(getPasswordStrength('').level).toBe(0);
    expect(getPasswordStrength('abc').level).toBe(1);
    expect(getPasswordStrength('Abcd1234!').level).toBe(3);
  });
});
