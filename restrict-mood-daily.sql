-- =====================================================================
-- Ánima App - Restricción de Registro de Estado de Ánimo Diario
-- =====================================================================
-- Este script crea un índice único que impide registrar más de un
-- estado de ánimo por usuario al día en la tabla `mood_logs`.
--
-- Instrucciones de ejecución:
-- 1. Abre el Supabase Dashboard.
-- 2. Ve a la sección "SQL Editor" en el menú lateral.
-- 3. Abre un nuevo query ("New query").
-- 4. Pega este código y haz clic en "Run".
-- =====================================================================

-- Crea el índice único basado en el user_id y la porción de fecha de created_at (sin hora)
CREATE UNIQUE INDEX IF NOT EXISTS mood_logs_user_id_date_idx 
ON public.mood_logs (user_id, (created_at::date));
