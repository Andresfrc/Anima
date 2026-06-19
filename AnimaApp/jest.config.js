/**
 * Configuración de Jest para tests de lógica pura (sin React Native).
 * Usa ts-jest con un tsconfig propio mínimo para no heredar la config de Expo
 * (que es para la app, no para Node) y mantener los tests rápidos y aislados.
 */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
          esModuleInterop: true,
          module: 'commonjs',
          target: 'es2019',
          moduleResolution: 'node',
          isolatedModules: false,
          skipLibCheck: true,
        },
      },
    ],
  },
};
