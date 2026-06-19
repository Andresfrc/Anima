import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Elimina console.log/info/debug del bundle de producción (conserva error/warn).
  compiler: {
    removeConsole: { exclude: ['error', 'warn'] },
  },
  // Headers de seguridad para producción
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Fuerza HTTPS durante 2 años (incluye subdominios). Seguro en hosts con TLS (Vercel).
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;
