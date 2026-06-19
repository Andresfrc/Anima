# AUDITORÍA TÉCNICA Y FUNCIONAL — PROYECTO ÁNIMA
**Alcance:** `AnimaApp` (React Native/Expo) + `anima-admin-dashboard` (Next.js) + backend Supabase compartido + servicio externo de chat (Render).
**Fecha:** 2026-06-19
**Postura:** Auditoría adversarial, sin filtros. Se asume que el producto va a producción con potencial de millones de usuarios.

---

## 0. CONTEXTO IMPORTANTE (no exime de severidad, pero la enmarca)

`DOCUMENTACION_CLINICA.md` y `README.md` revelan que este es un **proyecto académico** (universitarios 18–30 años, audiencia "evaluadores académicos, psicólogos revisores"). Esto no reduce la severidad técnica de los hallazgos — el usuario pidió evaluarlo como si fuera a producción con millones de usuarios e inversión de capital de riesgo — pero explica por qué ciertas piezas (CI/CD, tests, RLS) están ausentes: nunca se construyó con ese nivel de exigencia. El veredicto final se da bajo el estándar pedido (FAANG / VC-ready), no bajo el estándar de "proyecto de tesis".

---

## 1. CALIFICACIÓN GENERAL (0–10)

| Categoría | Nota | Justificación breve |
|---|---|---|
| Arquitectura | 5.0 | Estructura feature-based razonable (expo-router + carpetas por dominio), pero sin capa de servicios real, lógica de negocio mezclada en componentes de UI gigantes. |
| Calidad de código | 4.0 | TypeScript usado consistentemente, pero duplicación masiva, `as any` para evadir tipos, `console.log` en producción, archivos de 600–700 líneas. |
| Seguridad | **1.5** | RLS abierta (`USING (true)`), RBAC de admin solo en cliente, economía de XP 100% confiable en cliente, sin rate-limiting, enumeración de usuarios. |
| UX | 5.0 | Conceptualmente cuidada (rutas emocionales, triage, mascota empática) pero con race conditions de navegación, sin loading/error states consistentes. |
| UI | 6.5 | Visualmente ambiciosa (Aurora backgrounds, glassmorphism, gradientes) pero con sistema de diseño no respetado (colores hardcodeados en 15+ componentes). |
| Performance | 4.0 | Fondos animados con partículas sin mitigación real en gama baja, `devicePerformance.ts` infrautilizado, componentes sin memoización. |
| Escalabilidad | **2.0** | Sin paginación en queries de admin, sin índices documentados, sin separación de entornos, dependencia de un backend gratuito (Render free tier) para una función core (el chat). |
| Accesibilidad | **1.5** | Prácticamente cero `accessibilityLabel`/`accessibilityRole`, touch targets por debajo de 44×44px, sin soporte de reduce-motion — grave en una app para personas en crisis emocional. |
| Mantenibilidad | 3.0 | Cero tests automatizados, cero CI/CD, tipos de Supabase desincronizados del esquema real, duplicación DRY violada sistemáticamente. |
| **Calidad general** | **3.3** | Producto con buena intención de diseño y contenido clínico bien fundamentado, pero con cimientos técnicos no aptos para escalar ni para manejar datos sensibles de salud mental con responsabilidad. |

---

## 2. PROBLEMAS CRÍTICOS

### C1. Políticas RLS completamente abiertas en `app_settings`
**Archivo:** `anima-admin-dashboard/supabase-migration.sql:44-48`
```sql
CREATE POLICY "Admins pueden leer app_settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Admins pueden modificar app_settings" ON app_settings FOR ALL USING (true);
```
1. **Explicación:** El comentario dice "solo admins pueden leer/escribir", pero `USING (true)` no filtra nada — cualquier usuario con una sesión válida en el proyecto Supabase (incluida cualquier cuenta normal de la app móvil, porque comparten el mismo proyecto) puede leer y escribir esta tabla directamente vía la API REST de Supabase, sin pasar por el dashboard admin.
2. **Riesgo:** Cualquier usuario puede activar `maintenance_mode`, cambiar `api_url`, desactivar `require_mfa`, alterar `min_app_version`, etc., usando únicamente la anon key (que está hardcodeada en el bundle de la app, ver C3).
3. **Impacto:** Denegación de servicio global (maintenance_mode=true para todos), redirección de tráfico (api_url), degradación de seguridad (require_mfa=false). Con 1M usuarios, basta con que UNO ejecute un `fetch` con la anon key para tumbar la app para todos.
4. **Solución concreta:** Reescribir las políticas para verificar el rol real contra `profiles`:
5. **Ejemplo de implementación:**
```sql
DROP POLICY "Admins pueden leer app_settings" ON app_settings;
DROP POLICY "Admins pueden modificar app_settings" ON app_settings;

CREATE POLICY "Solo admins leen app_settings" ON app_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Solo admins escriben app_settings" ON app_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```
Si la app móvil necesita leer algún setting público (ej. `min_app_version`), expón solo esa fila vía una función `SECURITY DEFINER` o una vista filtrada, nunca la tabla completa.
6. **Prioridad:** P0 — Bloqueante de lanzamiento.
7. **Dificultad:** Baja (es una migración SQL de 15 minutos), pero requiere auditar TODAS las políticas RLS existentes en el proyecto Supabase (la mayoría no están versionadas, ver C7).
8. **Beneficio esperado:** Cierra una escalada de privilegios y un vector de DoS trivialmente explotable con cualquier cliente HTTP.

---

### C2. RBAC del admin dashboard existe solo en el login, nunca se revalida
**Archivos:** `anima-admin-dashboard/src/proxy.ts` (middleware) + `src/app/(auth)/login/page.tsx:43-66` + `src/app/users/page.tsx`, `cms/page.tsx`, `settings/page.tsx`

1. **Explicación:** El middleware (`proxy.ts:6`) solo verifica `request.cookies.get('anima_admin_token')` — su **presencia**, no su validez ni el rol que representa. El chequeo de `role === 'admin'` ocurre **una sola vez**, en el formulario de login (`login.tsx:44-66`), después de lo cual simplemente se guarda el `access_token` de Supabase en una cookie. Ninguna página (`users/page.tsx`, `cms/page.tsx`, `settings/page.tsx`) vuelve a verificar el rol antes de ejecutar mutaciones.
2. **Riesgo:** Cualquier usuario de la app móvil (rol `user` o `pending`) que abra las devtools del navegador y ejecute:
```js
document.cookie = `anima_admin_token=${SU_PROPIO_ACCESS_TOKEN}; path=/`
```
y navegue a `anima-admin-dashboard.vercel.app/users`, pasa el middleware (porque la cookie existe) y llega a una página que ejecuta `supabase.from('profiles').update({ role: 'admin' }).eq('id', selectedUser.id)` sin ningún guard adicional en el componente.
3. **Impacto:** Escalada de privilegios completa. Combinado con C1, un atacante no necesita ni siquiera el dashboard: puede hacer todo por REST API directa.
4. **Solución concreta:** (a) el middleware debe decodificar y verificar el JWT (o llamar `supabase.auth.getUser(token)`) y consultar el rol en cada request a rutas protegidas; (b) cada acción mutante en cliente debe ir respaldada por una **política RLS server-side** que sea la verdadera barrera (la UI nunca es la barrera de seguridad, solo UX).
5. **Ejemplo de implementación:**
```ts
// proxy.ts
export async function proxy(request: NextRequest) {
  const token = request.cookies.get('anima_admin_token')?.value;
  if (!token) return redirectToLogin(request);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return redirectToLogin(request);
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', data.user.id).single();
  if (profile?.role !== 'admin') return redirectToLogin(request);
  return NextResponse.next();
}
```
Y en Postgres, una política real en `profiles`:
```sql
CREATE POLICY "Solo admins actualizan roles" ON profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (true);
```
6. **Prioridad:** P0.
7. **Dificultad:** Media (requiere mover la verificación a Edge Middleware con llamada a Supabase, lo que añade latencia — evaluar caching de la verificación de rol con TTL corto).
8. **Beneficio esperado:** Convierte la seguridad real de "ninguna" a "defensa en profundidad" (UI + RLS).

---

### C3. Economía de gamificación (XP, streak, nivel) 100% confiada al cliente
**Archivo:** `AnimaApp/store/useStore.ts:382-459` (`addCompletedActivity`, `addXP`), sincronizada sin validación en `utils/supabaseSync.ts:104-124`

1. **Explicación:** Todo el cálculo de XP, streak y desbloqueo de niveles ocurre en JavaScript en el dispositivo del usuario. El resultado se sube a Supabase con un `upsert` directo (`supabase.from('user_progress').upsert({ xp: newXP, ... })`) sin ninguna función de validación en el servidor.
2. **Riesgo:** Cualquier usuario con conocimientos mínimos puede:
```js
useStore.setState({ userXP: 999999, currentStreak: 9999 })
// o directamente:
localStorage.setItem('anima-app-storage', JSON.stringify({ state: { userXP: 999999 } }))
```
y luego disparar cualquier acción que llame `saveUserProgress()` para persistir el valor falso en Supabase.
3. **Impacto:** Si existe (o se planea) cualquier elemento competitivo, leaderboard, o recompensa desbloqueable por nivel, el sistema es trivialmente falseable. También contamina los analytics del admin dashboard (`mood-trends-chart`, `active-routes-chart`) con datos no confiables.
4. **Solución concreta:** Mover el cálculo de XP/nivel/streak a una función de base de datos (`Postgres function` o `Edge Function`) que reciba el evento (`mood_logged`, `activity_completed`) y calcule server-side, rechazando cualquier intento de escribir `xp`/`current_streak` directamente desde el cliente vía RLS.
5. **Ejemplo de implementación:**
```sql
CREATE OR REPLACE FUNCTION register_activity_completion(p_activity_id text, p_activity_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  INSERT INTO activity_logs(user_id, activity_id, activity_name, completed, started_at)
  VALUES (v_user, p_activity_id, p_activity_name, true, now());
  UPDATE user_progress SET xp = xp + 25, updated_at = now() WHERE user_id = v_user;
END; $$;

-- Y bloquear escritura directa de xp desde el cliente:
CREATE POLICY "Usuarios no pueden escribir xp directo" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (false); -- forzar uso de la función
```
6. **Prioridad:** P1 (no es explotable para robar datos de terceros, pero rompe la integridad del producto y de cualquier feature social/competitiva futura).
7. **Dificultad:** Media-Alta (requiere reescribir parte del store y mover lógica a Postgres/Edge Functions).
8. **Beneficio esperado:** Gamificación confiable, analytics de negocio reales, base sólida para features sociales futuras (rankings, retos grupales).

---

### C4. Esquema de base de datos sin control de versiones + tipos generados obsoletos
**Evidencia:** `AnimaApp/lib/database.types.ts` solo declara 4 tablas (`activity_logs`, `historial_chat`, `journal_entries`, `profiles`). El código (`useStore.ts`, `supabaseSync.ts`, `useAdminStore.ts`) consulta activamente **otras 4 tablas que no existen en ese archivo**: `mood_logs`, `user_progress`, `activities`, `app_settings`. No existe carpeta `supabase/migrations`, ni en `AnimaApp` ni en `anima-admin-dashboard` — solo dos scripts SQL sueltos (`restrict-mood-daily.sql`, `supabase-migration.sql`) versionados a mano.

1. **Explicación:** El esquema real de la base de datos vive únicamente dentro del dashboard de Supabase, fuera de git. Los "tipos" que el código TypeScript usa para creer que tiene type-safety en las queries a Supabase están desincronizados — para el 50% de las tablas usadas, **no hay tipos en absoluto** (el cliente las trata como `any` implícitamente).
2. **Riesgo:** Nadie puede reproducir el esquema desde cero (nuevo entorno, nuevo desarrollador, disaster recovery). Un cambio de columna en producción no se refleja en el código hasta que alguien recuerde correr `supabase gen types` manualmente — y evidentemente no lo ha hecho en mucho tiempo.
3. **Impacto:** Bugs silenciosos en producción (columna renombrada en Supabase rompe `mood_logs` sin que TypeScript avise jamás), imposibilidad de tener entornos dev/staging confiables, recuperación ante desastres dependiente 100% de backups de Supabase sin script de reconstrucción.
4. **Solución concreta:** Adoptar Supabase CLI con migraciones versionadas (`supabase migration new`, `supabase db push`) y regenerar tipos en cada cambio (`supabase gen types typescript --linked > lib/database.types.ts`), idealmente como hook de CI.
5. **Ejemplo de implementación:**
```bash
supabase init
supabase migration new init_schema   # pegar el DDL real extraído del dashboard
supabase db push
supabase gen types typescript --linked > AnimaApp/lib/database.types.ts
```
Y un paso de CI que falle si los tipos generados difieren de los versionados (detecta drift).
6. **Prioridad:** P0 para el negocio (sin esto no hay disaster recovery real), P1 técnicamente.
7. **Dificultad:** Media (trabajo mecánico pero requiere acceso completo al esquema actual de producción para no perder nada al migrar).
8. **Beneficio esperado:** Reproducibilidad de entornos, recuperación ante desastres real, type-safety verdadera, code review de cambios de esquema vía PRs.

---

### C5. Cero pruebas automatizadas y cero CI/CD en todo el monorepo
**Evidencia:** Ningún `test` script en `AnimaApp/package.json` ni `anima-admin-dashboard/package.json`; sin `jest`, `vitest`, `@testing-library/*` en dependencias; sin carpeta `.github/workflows` ni ningún otro archivo `.yml`/`.yaml` de CI en el repositorio.

1. **Explicación:** No existe una sola prueba unitaria, de integración o end-to-end. No hay pipeline que ejecute lint, type-check o build antes de mergear a `main`.
2. **Riesgo:** Cada cambio (incluyendo los relacionados con seguridad/RLS) se valida únicamente "a ojo" en local. Los commits recientes (`calidads`, `calidads1`, `calidads2`, `actualizaciones`) sugieren ciclos de "arreglar y rezar" sin red de seguridad.
3. **Impacto:** Con 1M usuarios, un regresión simple (ej. un `null` no manejado en `saveMoodEntry`) llega directo a producción sin que nadie lo detecte hasta que los usuarios reporten el bug.
4. **Solución concreta:** Mínimo viable: GitHub Actions con `npm run lint`, `tsc --noEmit`, y tests de las funciones puras críticas (`progressionSystem.ts`, cálculo de streak en `useStore.ts`).
5. **Ejemplo de implementación:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd AnimaApp && npm ci && npm run lint && npx tsc --noEmit
      - run: cd anima-admin-dashboard && npm ci && npm run lint && npx tsc --noEmit
```
6. **Prioridad:** P0 para escalar el equipo; P1 si el equipo sigue siendo 1-2 personas.
7. **Dificultad:** Baja para el esqueleto de CI; media-alta para alcanzar cobertura de tests significativa después (la lógica de `progressionSystem.ts` y `saveMoodEntry` son las primeras candidatas porque ya tienen bugs documentados, ver A6).
8. **Beneficio esperado:** Detección temprana de regresiones, confianza para refactorizar, prerequisito real para cualquier inversión seria.

---

### C6. Botón de emergencia (SOS) con números de crisis hardcodeados sin verificación regional
**Archivo:** `AnimaApp/components/AdaptiveSOS.tsx:212, 226`
```ts
Linking.openURL('tel:106')   // línea de salud mental
Linking.openURL('tel:123')   // emergencias
```
1. **Explicación:** Estos números son válidos en algunos países (ej. Colombia) pero no universalmente. No hay detección de región/país del usuario, ni fallback, ni disclaimer de que estos números pueden no funcionar fuera de un país específico.
2. **Riesgo:** Un usuario en crisis emocional real, en un país donde "106"/"123" no son líneas válidas, presiona el botón de ayuda y no consigue nada — en el peor momento posible.
3. **Impacto:** Esto es responsabilidad legal y ética real para una app que se posiciona como acompañamiento emocional. No es un bug cosmético: es el único botón de la app cuyo fallo tiene consecuencias humanas directas.
4. **Solución concreta:** Detectar el país (vía `expo-localization` o el código de región de la SIM/locale) y mapear a un directorio de líneas de crisis reales por país (ej. Befrienders Worldwide, IASP), con fallback genérico ("busca el número de emergencias de tu país") si no se reconoce la región.
5. **Ejemplo de implementación:**
```ts
import * as Localization from 'expo-localization';
const CRISIS_LINES: Record<string, { mental: string; emergency: string }> = {
  CO: { mental: '106', emergency: '123' },
  US: { mental: '988', emergency: '911' },
  MX: { mental: '800-290-0024', emergency: '911' },
  // ...
};
const region = Localization.getLocales()[0]?.regionCode ?? 'US';
const lines = CRISIS_LINES[region] ?? { mental: null, emergency: null };
```
Y si `lines.mental` es `null`, mostrar un mensaje claro en vez de intentar llamar a un número inválido.
6. **Prioridad:** P0 — es el hallazgo de mayor impacto humano de toda la auditoría, por encima incluso de las vulnerabilidades de seguridad.
7. **Dificultad:** Baja-Media (mapear países es trabajo de contenido, no técnico complejo).
8. **Beneficio esperado:** Elimina el riesgo legal/ético más grave del producto; es además un argumento de venta serio ("soporte de crisis localizado").

---

### C7. Chatbot depende de un servicio externo gratuito, sin auth, expuesto en el bundle
**Archivo:** `AnimaApp/services/ChatEngine.ts:3` y `AnimaApp/app/(tabs)/chat.tsx:48-64`
```ts
const API_URL = 'https://chatbot-lumi.onrender.com';
// fetch sin ningún header de autenticación, usuario_id es un string libre enviado por el cliente
```
y en `chat.tsx`:
```ts
// 🔥 PING para mantener el servidor despierto
const interval = setInterval(ping, 600000);
```
1. **Explicación:** El backend de IA conversacional (que maneja conversaciones potencialmente sobre crisis emocionales) corre en el tier gratuito de Render, que se "duerme" tras inactividad — por eso el código tiene un hack de "ping cada 10 minutos desde CADA teléfono de usuario" para mantenerlo despierto. La API no requiere autenticación: cualquiera con la URL (visible estáticamente en el bundle JS) puede llamarla con cualquier `usuario_id`.
2. **Riesgo:** (a) Abuso/flooding del servicio por terceros sin rate-limit visible; (b) suplantación de `usuario_id` (un usuario puede mandar mensajes "como" otro `usuario_id` si ese ID se usa para algo más que logging, ya que la tabla `historial_chat` referencia `usuario_id`); (c) disponibilidad pobre en el tier gratuito incluso con el hack de keep-alive (cold starts, límites de horas mensuales de Render free tier).
3. **Impacto:** Para una función central de la app (el chat de apoyo emocional), depender de infraestructura gratuita sin SLA es inaceptable a cualquier escala real. El hack de ping además desperdicia batería/datos de **todos** los usuarios para compensar una decisión de infraestructura.
4. **Solución concreta:** Mover el servicio a un hosting con SLA (Fly.io, Railway, un servidor dedicado, o serverless con autoscaling real), añadir autenticación (pasar el JWT de Supabase al backend y validar `auth.uid()` en vez de confiar en un `usuario_id` arbitrario), y eliminar el hack de ping del cliente.
5. **Ejemplo de implementación:** En el backend del chatbot, validar el JWT:
```python
# pseudo-código del servicio Lumi
from supabase import create_client
def verify_token(authorization_header):
    token = authorization_header.replace('Bearer ', '')
    user = supabase_admin.auth.get_user(token)
    return user.id  # usar esto, no el usuario_id que manda el cliente
```
6. **Prioridad:** P0 (disponibilidad) / P1 (suplantación de identidad).
7. **Dificultad:** Media (migrar hosting es sencillo; añadir auth requiere coordinar el repo del backend, que no está en este monorepo auditado).
8. **Beneficio esperado:** Disponibilidad real del feature más usado de la app, eliminación de un vector de suplantación, ahorro de batería/datos para todos los usuarios.

---

### C8. Anon key y URL de Supabase hardcodeadas en el código fuente del cliente móvil
**Archivo:** `AnimaApp/lib/supabase.ts:4-5`
```ts
const SUPABASE_URL = 'https://osyfrqqbdhuvbmpobtol.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...'; // JWT completo en texto plano
```
1. **Explicación:** Técnicamente la `anon key` de Supabase está **diseñada** para ser pública (va en cualquier app cliente) — esto en sí mismo no es la vulnerabilidad. El problema real es que toda la seguridad del backend depende de que las políticas RLS sean correctas, y ya demostramos en C1/C2 que no lo son. Además, está hardcodeada en el código fuente en vez de inyectarse vía `app.config.js` + variables de entorno de EAS, lo que significa que rotar la key requiere un cambio de código y un rebuild completo de la app (no un cambio de configuración).
2. **Riesgo:** Bajo en sí mismo (es el diseño esperado de Supabase), pero combinado con RLS rota, es la llave que destapa todo lo demás.
3. **Impacto:** Operacional: rotar credenciales es lento y requiere release a las stores. De seguridad: ninguno adicional más allá de lo ya descrito en C1-C3.
4. **Solución concreta:** Mover a `app.config.ts` con `process.env.EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`, gestionados vía EAS Secrets, y sobre todo, **arreglar las políticas RLS** — eso es lo que realmente protege los datos, no ocultar la anon key.
5. **Ejemplo de implementación:**
```ts
// lib/supabase.ts
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```
6. **Prioridad:** P2 (mejora de higiene operacional; la prioridad real de seguridad está en C1-C3).
7. **Dificultad:** Baja.
8. **Beneficio esperado:** Rotación de credenciales sin rebuild, separación de entornos dev/prod real.

---

### C9. Validación de contraseña débil + enumeración de usuarios en recuperación
**Archivos:** `AnimaApp/app/(auth)/register.tsx:71-74`, `AnimaApp/app/(auth)/forgot-password.tsx:81-91`

```ts
if (!name.trim() || !email.trim() || password.trim().length < 6) { ... }
```
```ts
if (profileError || !profile) {
  setError('No encontramos una cuenta con ese correo. Verifica e intenta de nuevo.');
  return;
}
```
1. **Explicación:** Contraseña mínima de 6 caracteres sin requisitos de complejidad (OWASP recomienda ≥8 con verificación contra listas de contraseñas filtradas). El flujo de "olvidé mi contraseña" revela explícitamente si un correo está o no registrado.
2. **Riesgo:** Cuentas comprometibles por fuerza bruta/diccionario; enumeración masiva de la base de usuarios (un atacante puede determinar qué emails de una lista filtrada en otra brecha tienen cuenta en Ánima — grave tratándose de una app de salud mental, donde solo el hecho de "tener cuenta" ya es información sensible).
3. **Impacto:** Cuentas comprometidas, fuga de la lista de "personas que usan una app de salud mental" — esto último es por sí mismo un dato sensible bajo cualquier regulación de privacidad de datos de salud.
4. **Solución concreta:** Subir el mínimo a 8-10 caracteres con medidor de fuerza; en forgot-password, responder siempre igual independientemente de si el correo existe.
5. **Ejemplo de implementación:**
```ts
// forgot-password.tsx — respuesta uniforme
await supabase.auth.resetPasswordForEmail(email); // Supabase ya no revela si existe o no
setMessage('Si el correo está registrado, recibirás un código de recuperación.');
// Eliminar el SELECT previo a profiles que sí revela existencia.
```
6. **Prioridad:** P1.
7. **Dificultad:** Baja.
8. **Beneficio esperado:** Cierra una fuga de privacidad de alto valor simbólico para una app de salud mental.

---

## 3. PROBLEMAS ALTOS

### A1. Memory leaks por timers/intervals sin limpiar
- `relajacion.tsx:44-62` — el `useEffect` que crea el `setInterval` depende de `[phase, timeLeft]`, por lo que **se recrea cada segundo**, acumulando intervalos no limpiados correctamente entre renders.
- `botella.tsx:61-84` — tres `setTimeout` anidados (2000ms → 3000ms → 2000ms) sin guardarse en `ref`, por lo que si el usuario navega fuera de la pantalla antes de que terminen, ejecutan `setState` sobre un componente desmontado.
- `astillero.tsx:137-143` — `setTimeout` de 500ms que llama `addCompletedActivity` sin cleanup; salir rápido duplica o corrompe el registro de actividad completada.
- **Riesgo/Impacto:** Warnings de React en producción, posibles crashes en low-end devices al acumularse listeners zombi, doble registro de XP.
- **Solución:** patrón único: `const timeoutRef = useRef<NodeJS.Timeout>(); useEffect(() => () => clearTimeout(timeoutRef.current), [])`. Ya existe el patrón correcto en `meditacion.tsx:40-50` y `respiracion.tsx:45-56` — úsenlo como plantilla para los demás.
- **Prioridad:** P1. **Dificultad:** Baja. **Beneficio:** Elimina una clase entera de bugs intermitentes difíciles de reproducir en QA.

### A2. Duplicación de código masiva entre las 10+ pantallas de actividades
- Patrón de header (botón volver + título + botón finalizar) repetido casi idéntico en `abrazo.tsx`, `astillero.tsx`, `botella.tsx`, `meditacion.tsx`, `relajacion.tsx`, `respiracion.tsx`, `capsula.tsx`, `diario-ciego.tsx`, `pomodoro.tsx`.
- Formato de timer (`Math.floor(t/60).padStart(2,'0')`) duplicado en al menos 4 archivos.
- **Impacto:** Cualquier cambio de diseño del header (ej. agregar accesibilidad, cambiar el ícono de volver) requiere editar 10 archivos en vez de 1. Alto riesgo de inconsistencia futura (ya ocurre: ver discrepancias de tamaño de botón "back" entre `respiracion.tsx` de 36×36 y otros de 44×44).
- **Solución:** extraer `<ActivityHeader />`, `useActivityTimer(durationSec)`, `useActivitySound(trackId)` a `components/ui/` y `hooks/`.
- **Prioridad:** P1. **Dificultad:** Media (refactor mecánico pero tocando 10+ archivos). **Beneficio:** Reduce ~30-40% del código de la carpeta `actividades/`, acelera futuras actividades nuevas.

### A3. Animaciones Reanimated infinitas sin cancelación completa
- `gratitud.tsx:62-86` (`FloatingStar`) — `withRepeat(..., -1, true)` en rotación y opacidad por cada estrella en el diario de gratitud; si hay 20 entradas, son 20 instancias con 2-3 animaciones infinitas cada una. El cleanup cancela `rotation`/`glow` pero el `scale` inicial vía `withDelay(withSpring(...))` no siempre se cancela limpiamente.
- **Impacto:** Con un diario de gratitud con muchas entradas (uso normal a los pocos meses), la pantalla acumula decenas de animaciones nativas corriendo, degradando FPS y batería — justo el tipo de problema que solo aparece "en producción con usuarios reales", no en demos cortas de QA.
- **Solución:** capar el número de `FloatingStar` renderizadas simultáneamente (virtualizar/paginar el diario) y asegurar `cancelAnimation` para los tres shared values en el cleanup.
- **Prioridad:** P1. **Dificultad:** Media. **Beneficio:** Evita degradación progresiva de performance a medida que el usuario acumula contenido (esto es un riesgo de escalabilidad *por usuario*, no solo por cantidad de usuarios).

### A4. Fondos de partículas sin respetar `devicePerformance.ts`
- `AuroraBackground.tsx:115` (`<FloatingParticles count={15} />`) y `ParticlesBackground.tsx:89` (`count = 15` default) — **ninguno de los dos consulta `devicePerformance.ts`**, que existe en el repo precisamente para detectar gama baja y ajustar la carga visual, pero solo lo usa `AuroraBackgroundDark.tsx`.
- **Impacto:** Código muerto de facto (`devicePerformance.ts` parcialmente sin usar) + jank real en dispositivos de gama baja en las pantallas que usan `AuroraBackground`/`ParticlesBackground` en modo claro.
- **Solución:** centralizar: todo fondo animado debe leer `CURRENT_CONFIG` de `devicePerformance.ts` para decidir cantidad de partículas/estrellas.
- **Prioridad:** P1. **Dificultad:** Baja. **Beneficio:** Performance consistente en el ~40-60% de dispositivos Android de gama media/baja que probablemente representen buena parte de la base de usuarios reales en Latinoamérica (mercado objetivo implícito por el idioma/contexto).

### A5. Sistema de diseño no respetado: colores hardcodeados en 15+ componentes
Ejemplos citados por la auditoría de componentes: `ActivityCard.tsx:49,109` (`'#FFD700'`), `AuroraBackground.tsx:34-42` y `AuroraBackgroundDark.tsx:152-161` (mismos colores de ruta repetidos en dos archivos en vez de una fuente compartida), `ChatBubble.tsx:32,39,106`, `ClinicalWidgets.tsx:93,100-101`, `XPToast.tsx:114,120`, `GlassCard.tsx:38-39`.
- **Impacto:** `constants/theme.ts` existe como "fuente única de verdad" pero no lo es en la práctica. Un rebranding o ajuste de modo oscuro requiere grep manual por todo el código en vez de cambiar un archivo.
- **Solución:** lint rule custom (ESLint `no-restricted-syntax` para literales de color hexadecimal/rgba fuera de `theme.ts`) que falle el build si se introduce un color hardcodeado nuevo.
- **Prioridad:** P2. **Dificultad:** Baja (la regla de lint) / Media (la migración de los existentes). **Beneficio:** Theming consistente y mantenible a largo plazo, prerequisito para dark mode real y para temas de marca blanca si el producto se licencia a instituciones (caso de uso plausible para una app de bienestar universitario).

### A6. Race conditions en el flujo de navegación post-login/onboarding
**Archivos:** `AnimaApp/app/_layout.tsx:42-56`, `AnimaApp/app/(auth)/login.tsx:93-114`
- `login()` marca `isAuthenticated: true` en el store, lo cual dispara el efecto de `_layout.tsx` que decide a dónde redirigir basado en `currentPlan` — pero `login.tsx` **también** intenta redirigir explícitamente según `fetchedPlan`. Ambas rutas de decisión compiten sin una máquina de estados clara.
- **Impacto:** Splash indefinido o redirección a la pantalla equivocada del onboarding (triage vs. select-plan) de forma intermitente — el tipo de bug que es casi imposible de reproducir consistentemente en QA manual pero que generará tickets de soporte constantes en producción.
- **Solución:** una única fuente de verdad para el "routing decision" (idealmente un solo `useEffect` en el layout raíz que reaccione a `isAuthenticated` + `currentPlan` + `_hasHydrated`, y que las pantallas de login/registro NUNCA naveguen explícitamente — solo actualicen el store).
- **Prioridad:** P1. **Dificultad:** Media. **Beneficio:** Elimina una clase de bugs de navegación intermitentes, mejora drásticamente la primera impresión del usuario (el onboarding es la parte más sensible al abandono).

### A7. Sin paginación en consultas administrativas
**Archivo:** `anima-admin-dashboard/src/app/users/page.tsx:69-72`
```ts
const { data, error } = await supabase.from("profiles").select("id, email, username, plan, role, created_at").order("created_at", { ascending: false })
// sin .range() ni .limit()
```
- **Impacto:** Con 10K+ usuarios esto ya degrada notablemente; con 100K+ usuarios el navegador del admin probablemente cuelga al intentar renderizar/exportar a CSV (`handleExportCSV`, línea ~158, construye el CSV completo en memoria sin streaming).
- **Solución:** paginación server-side con `.range(from, to)` + búsqueda server-side en vez de cliente, y exportación CSV vía Edge Function que genere el archivo sin cargarlo todo en el navegador.
- **Prioridad:** P1 (se vuelve P0 en el momento en que la base de usuarios supere ~5-10K). **Dificultad:** Media. **Beneficio:** Dashboard usable a cualquier escala de usuarios.

### A8. `console.log`/`console.error` extensivo en producción (ambos proyectos)
- Solo en `useAdminStore.ts` se contaron ~35 ocurrencias; sumando `cms/page.tsx`, `users/page.tsx`, `register/page.tsx` llegan a ~47 en el admin dashboard. En la app móvil, prácticamente cada función de `supabaseSync.ts`, `useStore.ts`, `ChatEngine.ts` deja rastros de `console.log`.
- **Impacto:** Exposición de estructura de datos internos (IDs, conteos, payloads) en la consola del navegador/Metro de cualquier usuario o admin. Además, en RN estos logs no son gratis en el JS thread bajo carga.
- **Solución:** reemplazar por un logger condicional (`if (__DEV__)`) o una librería como `consola`/`pino` con niveles, y un babel plugin (`babel-plugin-transform-remove-console`) que los elimine en builds de producción automáticamente.
- **Prioridad:** P2. **Dificultad:** Baja. **Beneficio:** Higiene de producción, menor superficie de exposición de información interna.

### A9. Sin error tracking ni analytics de producto
**Evidencia:** Ausencia de Sentry/Bugsnag/Crashlytics y de PostHog/Amplitude/Mixpanel en ambos `package.json`.
- **Impacto:** Cero visibilidad de crashes reales de usuarios, cero datos de qué actividades se usan más/menos, cero capacidad de priorizar el roadmap con datos. Para una app que pretende justificarse clínicamente, esto también significa que no hay forma de medir si las intervenciones (rutas emocionales, actividades) tienen impacto real en los usuarios reales — toda la justificación clínica del documento académico queda sin poder validarse empíricamente en producción.
- **Solución:** Sentry (RN + Next.js tienen SDKs maduros) para errores, y un evento mínimo de analytics (`activity_completed`, `mood_logged`, `route_assigned`) — sin necesariamente identificar al usuario, solo agregados, para no agravar el problema de privacidad ya señalado.
- **Prioridad:** P1. **Dificultad:** Baja-Media. **Beneficio:** Visibilidad operacional real + capacidad de validar (o refutar) las hipótesis clínicas del producto con datos.

### A10. Accesibilidad prácticamente inexistente en una app para personas en crisis emocional
**Evidencia transversal:** ninguno de los ~35 archivos de pantallas/componentes auditados usa `accessibilityLabel`, `accessibilityRole` o `accessibilityHint` de forma consistente; botones táctiles por debajo de 44×44px (ej. `respiracion.tsx:115-125`, botón de volver de 36×36); sin soporte para `reduceMotion` a pesar de que la app está construida casi enteramente sobre animaciones.
- **Impacto:** Una persona con temblores (ansiedad aguda), baja visión, o que depende de un lector de pantalla, literalmente no puede usar el botón de SOS, el chat, ni las actividades de grounding — que son precisamente las funciones diseñadas para ayudarla en el momento que más lo necesita. Esto es una contradicción directa entre el propósito declarado del producto y su implementación.
- **Solución:** auditoría de accesibilidad completa + `accessibilityLabel` en todo elemento interactivo + respetar `AccessibilityInfo.isReduceMotionEnabled()` para desactivar animaciones decorativas (partículas, auroras) cuando el sistema lo indique.
- **Prioridad:** P0 desde la óptica de propósito de producto, P1 técnicamente.
- **Dificultad:** Media (mecánico pero extenso — toca casi todos los archivos).
- **Beneficio:** Esto no es "nice to have" en esta app específica: es coherencia entre la misión declarada y el producto real, además de cumplimiento legal (ADA/EAA) si se comercializa en EEUU/UE.

---

## 4. PROBLEMAS MEDIOS

| # | Hallazgo | Archivo(s) | Impacto | Prioridad |
|---|---|---|---|---|
| M1 | `SoundService` genera keys con `Date.now()` que pueden colisionar si se reproduce el mismo sonido 2 veces en el mismo ms; errores de carga de audio se tragan en silencio (`catch {}`) | `utils/SoundService.ts:52-72` | Fuga leve de memoria con clicks rápidos; feedback sonoro roto sin indicación | P2 |
| M2 | Mezcla de `Audio.Sound` manual y `SoundService` abstracto entre distintas pantallas de actividades, sin guard contra solapamiento de sonidos al navegar rápido entre actividades | `capsula.tsx`, `pomodoro.tsx` vs `meditacion.tsx`, `AuralGrounding.tsx` | Sonidos superpuestos, UX confusa | P2 |
| M3 | Componentes/archivos gigantes sin descomponer: `gratitud.tsx` (599 líneas, 3 componentes en 1 archivo), `pomodoro.tsx` (631), `registro.tsx` (702), `perfil.tsx` (709), `index.tsx` home (515), `users/page.tsx` (455) | múltiples | Mantenibilidad, testabilidad, revisión de código difícil | P2 |
| M4 | `triage.tsx`: el algoritmo de asignación de ruta emocional usa "gana el score más alto" sin manejo explícito de empates ni umbral de confianza | `app/(onboarding)/triage.tsx:106-111` | Asignación de ruta clínica potencialmente arbitraria en casos límite | P2 |
| M5 | Disclaimer clínico (`CLINICAL_DISCLAIMER` en `clinicalContent.ts:222-225`) existe en código pero no se confirmó que se muestre de forma prominente antes/durante el triage en las pantallas auditadas | `constants/clinicalContent.ts` | Riesgo de percepción de "diagnóstico" sin el disclaimer visible en el momento correcto | P2 |
| M6 | "Cambiar Mi Ruta" en `perfil.tsx` lleva a `select-plan` directamente, saltándose el triage — el usuario puede re-elegir una ruta sin pasar por la re-evaluación que en teoría la fundamenta clínicamente | `app/(tabs)/perfil.tsx:327` | Inconsistencia entre la justificación clínica del producto y su implementación | P3 |
| M7 | Notificaciones mostradas en el modal de la home son un array mock hardcodeado, nunca conectado a Supabase | `app/(tabs)/index.tsx:19-22` | Apariencia de funcionalidad que no existe; confusión de usuario | P2 |
| M8 | `journal_entries.id` es generado en cliente (no UUID de Postgres) según el tipo `Insert: { id: string }` (requerido, no `id?`) | `lib/database.types.ts:91` | Riesgo de colisión de IDs entre dispositivos/usuarios, antipatrón de diseño de esquema | P2 |
| M9 | Setting `retention_days` declarado en `app_settings` pero sin ningún job/función que efectivamente borre datos antiguos — configuración "de adorno" | `supabase-migration.sql:29` | Falsa sensación de cumplimiento de retención de datos (relevante si se alega cumplimiento normativo) | P2 |
| M10 | Cambio de contraseña de admin (`profile/page.tsx`) solo valida longitud ≥6, ignorando el setting `require_mfa: {enabled:true}` que existe pero no se aplica en ningún flujo | `anima-admin-dashboard/src/app/profile/page.tsx:57-79` | Setting de seguridad declarado pero no enforced | P2 |
| M11 | OTP de recuperación de contraseña sin rate-limiting visible en cliente (solo valida longitud del código) | `(auth)/forgot-password/page.tsx:52-98` | Fuerza bruta de OTP más fácil (mitigado parcialmente por límites de Supabase, pero sin defensa explícita en la app) | P2 |
| M12 | Falta de manejo de error de red explícito: fallos de fetch a `activities`/`journal_entries` degradan silenciosamente a datos vacíos/mock sin avisar al usuario que está viendo datos potencialmente desactualizados | `actividades.tsx:35-45`, `registro.tsx:168-193` | Confusión sobre consistencia de datos | P2 |
| M13 | Casts `as any` para nombres de íconos de Ionicons en múltiples componentes (`perfil.tsx:457`, `MoodButton.tsx:47`, `ActivityCard.tsx:27`) | múltiples | Pérdida de chequeo de tipos en tiempo de compilación | P3 |
| M14 | Barrel file `components/ui/index.ts` no re-exporta `XPToast` ni `LevelUpModal`, generando un patrón de import inconsistente (algunos directos, algunos vía barrel) | `components/ui/index.ts` | Fricción de mantenimiento menor | P3 |
| M15 | `tsconfig.json` del admin dashboard tiene `allowJs: true` sin necesidad aparente, debilitando la garantía de tipado estricto en todo el proyecto | `anima-admin-dashboard/tsconfig.json:4` | Posibilidad de introducir código sin tipos | P3 |

---

## 5. PROBLEMAS BAJOS

- Inconsistencia de sombras: algunos componentes usan `shadowColor: '#5B9BD5'`, otros `'#000'`; `elevation: 8` vs `10` sin patrón.
- Nombre de archivo de asset con espacio: `assets/images/mascot/lumi-star .png` (rompe convenciones, riesgo de problemas de bundling en algunas plataformas/herramientas).
- Imágenes mascota con duplicados aparentes de propósito similar (`lumi-celebrando.png` y `lumi-celebrating.png`, `lumi-empatico.png` y `empatico.png` en dos carpetas distintas) — sugiere falta de limpieza de assets.
- `DAILY_AFFIRMATIONS` en `constants/theme.ts:177-185` no referenciado en ningún componente auditado — código muerto.
- `devicePerformance.ts` parcialmente código muerto (solo lo consume `AuroraBackgroundDark`, no `FloatingParticles`/`ParticlesBackground`).
- Próximo a software de terceros: `next.config.ts` define buenos headers de seguridad (`X-Frame-Options`, `X-Content-Type-Options`, etc.) pero le falta `Content-Security-Policy` y `Strict-Transport-Security`.
- Comentarios de código que documentan decisiones de arquitectura/seguridad interna quedan en el bundle de producción (ej. `// FIX: guarda TODO incluyendo maintenance_mode al presionar el botón`) — inocuo pero indica falta de limpieza pre-release.
- Versión de app y mensajes de soporte hardcodeados (`APP_VERSION = '1.0.2'` en `(tabs)/_layout.tsx:19`) en vez de venir de `app.json`/Constants.

---

## 6. TOP 20 MEJORAS PRIORITARIAS (ordenadas por impacto real)

1. **Arreglar políticas RLS de `app_settings`** (C1) — la más barata de arreglar y la más grave.
2. **Implementar verificación de rol real en middleware + páginas del admin dashboard** (C2).
3. **Localizar y verificar los números de la línea de crisis del botón SOS** (C6) — mayor impacto humano de todo el informe.
4. **Migrar el chatbot a hosting con SLA y autenticación real** (C7).
5. **Versionar el esquema de base de datos con Supabase CLI y regenerar tipos** (C4).
6. **Mover el cálculo de XP/streak/nivel a funciones server-side** (C3).
7. **Implementar CI mínimo (lint + type-check) en GitHub Actions** (C5).
8. **Eliminar la enumeración de usuarios en forgot-password + subir requisitos de contraseña** (C9).
9. **Auditoría y remediación de accesibilidad transversal** (A10).
10. **Arreglar memory leaks de timers (relajacion, botella, astillero)** (A1).
11. **Resolver race conditions de navegación post-login/onboarding** (A6).
12. **Añadir Sentry (errores) y analítica de producto mínima** (A9).
13. **Extraer hooks/componentes compartidos para pantallas de actividades** (A2).
14. **Paginación server-side en el listado de usuarios del admin** (A7).
15. **Centralizar control de partículas/animaciones vía `devicePerformance.ts`** (A4).
16. **Eliminar `console.log` de producción con babel plugin** (A8).
17. **Enforcar el sistema de diseño con lint rule anti-colores-hardcodeados** (A5).
18. **Decisión de producto sobre Premium: implementar IAP real o quitar la UI de "Premium"** (ver sección 8).
19. **Implementar `expo-updates` (OTA) para poder parchear sin esperar revisión de stores.**
20. **Mostrar el disclaimer clínico de forma prominente y obligatoria antes del triage** (M5).

---

## 7. QUÉ REESCRIBIRÍA DESDE CERO

- **Capa de persistencia/sincronización con Supabase** (`useStore.ts` + `supabaseSync.ts`): hoy la lógica de negocio (cálculo de XP, streak, niveles) vive mezclada con el store de UI y se sincroniza con escritura directa desde el cliente. Debería ser: store de UI (solo estado de presentación) + capa de "dominio" que llama a funciones de Postgres/Edge Functions para todo lo que tenga valor de negocio o gamificación.
- **Carpeta `app/actividades/*`**: no por estar mal hecha individualmente, sino porque el 60-70% de cada archivo es boilerplate idéntico. Reescribir como un motor de actividades parametrizado (`<ActivityRunner config={...} />`) con 10 archivos de configuración en vez de 10 archivos de implementación completa reduciría la superficie de mantenimiento drásticamente.
- **Capa de autorización del admin dashboard**: el middleware actual (`proxy.ts`) y la ausencia total de checks en página son un diseño fundamentalmente inseguro, no un bug puntual. Reescribir con: middleware que valida JWT + rol en cada request, RLS como única fuente real de verdad, y páginas que asumen "cero confianza" del lado cliente.
- **Esquema de base de datos**: no porque las tablas estén mal modeladas (son razonables), sino porque no existe como código. Reescribir = formalizar como migraciones versionadas desde cero, partiendo de un dump del esquema actual.

---

## 8. RIESGOS FUTUROS POR ESCALA

| Usuarios | Qué se rompe primero |
|---|---|
| **10** | Nada visible — todo funciona "a mano". Es el estado actual de facto. |
| **1,000** | El admin dashboard empieza a sentir lentitud en `users/page.tsx` (sin paginación); el chatbot gratuito en Render empieza a tener cold-starts molestos fuera de las horas en que el ping lo mantiene despierto; primeros reportes de bugs de navegación intermitentes (A6) sin manera de diagnosticarlos (sin error tracking, A9). |
| **100,000** | `users/page.tsx` se vuelve inusable (carga todos los perfiles en memoria del navegador); el costo de Supabase crece sin que nadie tenga visibilidad de qué queries son caras (sin índices documentados, sin monitoreo); la ausencia de RLS correcta en `app_settings` deja de ser un riesgo teórico — a esta escala, basta con que un usuario curioso inspeccione el tráfico de red de la app (trivial con un proxy como mitmproxy) para descubrir y explotar el endpoint abierto; el chatbot gratuito definitivamente no aguanta el volumen concurrente. |
| **1,000,000** | Reescritura forzada bajo presión de varias piezas (esquema no versionado, RLS, paginación, backend del chat) en modo incendio, en vez de evolución planeada — porque ninguna de ellas escala linealmente y todas fallan de forma repentina (no degradan gradualmente, colapsan). El costo de Supabase en el tier que corresponda a este volumen sin índices ni queries optimizadas sería significativamente mayor de lo necesario. La falta de analítica de producto significaría que, a pesar de tener 1M usuarios, el equipo seguiría sin saber qué funciona y qué no del producto. |

---

## 9. VEREDICTO FINAL

**¿Estaría cómodo lanzando este proyecto a producción para miles o millones de usuarios?**

**No, en su estado actual no.**

No por falta de visión de producto — la app tiene una propuesta de valor coherente, una fundamentación clínica con citas reales (Terapia Cognitivo-Conductual, ACT, Mindfulness, Activación Conductual, Autodeterminación) y un cuidado visual genuino (Aurora backgrounds, sistema de mascota, gamificación). Eso está bien pensado.

El problema es que los **cimientos técnicos no están a la altura de la ambición del producto**:

- La seguridad no es "mejorable", está **fundamentalmente rota** en el punto donde más importa (RBAC del panel admin + RLS de configuración global). Esto no es una opinión: es una política SQL que literalmente dice `USING (true)` donde el comentario al lado dice "solo admins".
- El producto maneja **datos de salud mental** (estado de ánimo diario, diario personal, ruta de "perfil emocional" asignada) sin que exista un control real de acceso a esos datos más allá de "confiamos en que la UI no deje hacer cosas malas" — eso no es seguridad, es una ilusión de seguridad.
- El único botón cuya función es literalmente salvar vidas en un momento de crisis (SOS) tiene números hardcodeados sin verificación regional.
- No hay una sola prueba automatizada, ni un pipeline de CI, en un producto que se está evaluando bajo el estándar de "miles o millones de usuarios".
- La accesibilidad —crítica precisamente porque el público objetivo incluye personas en momentos de baja capacidad funcional (ansiedad, crisis)— es casi inexistente.

Ninguno de estos problemas es difícil de arreglar individualmente (la mayoría son de prioridad P0-P1 pero de dificultad baja-media, ver sección 2 y 3). El verdadero riesgo no es la dificultad técnica de la remediación — es que, en su forma actual, **nada en el proceso de desarrollo (sin tests, sin CI, sin code review automatizado, sin RLS real) impediría que un problema igual de grave vuelva a aparecer la próxima semana**. Eso es lo que realmente preocuparía a un evaluador de FAANG o a un inversionista de VC: no el bug puntual, sino la ausencia de los mecanismos que evitan que los bugs puntuales lleguen a producción.

**Condición para un veredicto positivo:** resolver los 9 hallazgos críticos (sección 2) — la mayoría son cuestión de días, no de meses — y establecer CI/CD + tests mínimos antes de cualquier lanzamiento público real. Con eso resuelto, el producto pasa de "no apto para producción" a "apto con deuda técnica conocida y gestionada", que es un estado perfectamente normal y financiable.
