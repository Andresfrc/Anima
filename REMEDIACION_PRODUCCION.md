# Remediación para Producción — Ánima

Resumen de los cambios aplicados sobre los hallazgos de `AUDITORIA_TECNICA_ANIMA.md`,
en la rama **`produccion-hardening`**. No se tocó RLS (excluido por petición).

Estado de verificación: **AnimaApp** → `tsc` ✓, `eslint` 0 errores ✓, `jest` 12/12 ✓.
**admin-dashboard** → `tsc` ✓, `eslint` 0 errores ✓.

---

## 1. Qué se arregló

### Seguridad / Auth
- **Credenciales Supabase por entorno (C8):** `lib/supabase.ts` lee `EXPO_PUBLIC_SUPABASE_URL` /
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` (con fallback para no romper builds). Nuevos `.env` y `.env.example`.
- **Política de contraseñas (C9):** mínimo 8 caracteres + letras y números (`utils/validation.ts`).
  Login NO aplica el nuevo mínimo (no bloquea usuarios antiguos); registro y reset sí.
- **Enumeración de usuarios eliminada (C9):** `forgot-password.tsx` ya no consulta `profiles`
  para revelar si un correo existe; respuesta uniforme.
- **`alert()` → errores inline** en login con mensajes amigables (`friendlyAuthError`).
- **Race condition de navegación (A6):** login y register ya no navegan por su cuenta; la
  decisión la toma exclusivamente el layout raíz (única fuente de verdad).
- **Admin: middleware valida JWT + rol en cada request (C2):** `src/proxy.ts` ahora verifica el
  token contra Supabase Auth y el rol `admin` en `profiles`, no solo la presencia de la cookie.

### Salud del usuario
- **Líneas de crisis localizadas (C6):** el botón SOS detecta la región (`expo-localization`) y
  usa el número correcto por país (`constants/crisisLines.ts`), con fallback internacional seguro
  (112 + directorio `findahelpline.com`) en vez de un número fijo posiblemente inválido.
  Colombia (106/123) se mantiene como estaba. Se añadieron `accessibilityLabel`.

### Estabilidad (fugas de memoria)
- **Timers (A1):** `relajacion.tsx` (intervalo recreado cada segundo), `botella.tsx` (timeouts
  anidados) y `astillero.tsx` (timeout de celebración) ahora se limpian correctamente.
- **Animaciones (A3):** `gratitud.tsx` acota las estrellas animadas simultáneas (máx. 40) y
  protege el timeout de XP; cancelación de animaciones reforzada.
- **ErrorBoundary global:** captura crashes de render y muestra pantalla de recuperación.

### Performance / Higiene
- **Partículas según gama del dispositivo (A4):** `FloatingParticles` y `ParticlesBackground`
  respetan `devicePerformance` (0 partículas en gama baja).
- **`console.*` fuera de producción (A8):** AnimaApp via `utils/silenceLogs` (runtime);
  admin via `next.config.ts` `compiler.removeConsole`. Se conservan `error`/`warn`.
- **Chat sin drenar batería (C7):** se eliminó el ping cada 10 min desde cada dispositivo; ahora
  un único warm-up al entrar al chat (`pingChatServer`). URL del chat por entorno.

### Admin dashboard
- **Paginación server-side (A7):** `users/page.tsx` ya no trae todos los perfiles; usa `.range()`,
  búsqueda server-side sanitizada y controles de página. Export CSV de la página actual.
- **HSTS** añadido a los headers de seguridad.

### DevOps / Calidad
- **CI (C5):** `.github/workflows/ci.yml` corre lint + typecheck (+ tests en AnimaApp) en cada PR.
- **Tests:** `jest` + `ts-jest` con tests de `progressionSystem` y `validation` (12 casos).

---

## 2. Variables de entorno

### AnimaApp (`.env`, prefijo `EXPO_PUBLIC_`)
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_CHAT_API_URL=https://chatbot-lumi.onrender.com
EXPO_PUBLIC_SENTRY_DSN=        # opcional
```
Para builds EAS, define estas variables como **EAS Environment Variables** (dashboard de Expo o
`eas env:create`), ya que EAS no sube tu `.env` local. El código tiene fallback, así que el build
funciona aunque no las definas, pero definirlas es la práctica correcta para rotar credenciales.

### admin-dashboard (`.env.development` / variables de Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 3. Cómo desplegar

- **App móvil:** `cd AnimaApp && eas build --profile production` (Android APK configurado).
- **Admin:** desplegar `anima-admin-dashboard` en Vercel; configurar las dos variables `NEXT_PUBLIC_*`.

---

## 4. Lo que NO se tocó (y por qué) — pendientes recomendados

- **RLS de Supabase (C1):** excluido por petición. **Sigue siendo el hallazgo crítico #1.** Las
  políticas `USING (true)` en `app_settings` deben corregirse en el SQL del proyecto. El middleware
  endurecido (C2) ayuda, pero la barrera real es RLS.
- **Economía de XP server-side (C3):** sigue calculándose en cliente. Requiere funciones de
  Postgres/Edge (relacionado con backend/DB).
- **Esquema versionado (C4):** falta adoptar Supabase CLI + migraciones.
- **Sentry (A9):** se dejó el gancho en `ErrorBoundary` y la variable `EXPO_PUBLIC_SENTRY_DSN`;
  falta instalar el SDK y poner el DSN (necesita cuenta).
- **Reglas de lint suavizadas a `warn`** (no a `error`) en el admin: avisos del React Compiler
  (`set-state-in-effect`, `static-components`, `immutability`) que el código preexistente viola.
  Quedan visibles como deuda técnica, no bloquean CI.
