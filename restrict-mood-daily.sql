-- =====================================================================
-- Ánima App - Restricción de Registro de Estado de Ánimo Diario
-- =====================================================================
-- Este script limpia los duplicados existentes de estado de ánimo y
-- crea un índice único para impedir registrar más de un estado de ánimo
-- por usuario al día en la tabla `mood_logs`.
--
-- Instrucciones de ejecución:
-- 1. Abre el Supabase Dashboard.
-- 2. Ve a la sección "SQL Editor" en el menú lateral.
-- 3. Abre un nuevo query ("New query").
-- 4. Pega este código y haz clic en "Run".
-- =====================================================================

-- 1. Limpieza preventiva de duplicados (conserva el registro más reciente de cada día)
WITH duplicate_logs AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, (created_at::date)
           ORDER BY created_at DESC
         ) as rn
  FROM public.mood_logs
)
DELETE FROM public.mood_logs
WHERE id IN (
  SELECT id 
  FROM duplicate_logs 
  WHERE rn > 1
);

-- 2. Crea el índice único basado en el user_id y la porción de fecha de created_at (sin hora)
CREATE UNIQUE INDEX IF NOT EXISTS mood_logs_user_id_date_idx 
ON public.mood_logs (user_id, (created_at::date));
