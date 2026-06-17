-- ============================================================
-- Script de migración para Anima Admin Dashboard
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Políticas de Seguridad (RLS) para la tabla perfiles
-- Permite a los administradores modificar el rol y datos de otros usuarios
CREATE POLICY "Admins pueden actualizar perfiles" ON profiles
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );



-- 3. Tabla de configuración global del sistema (clave-valor)
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Insertar configuraciones default
INSERT INTO app_settings (key, value)
VALUES
  ('mask_identity', '{"enabled": true}'::jsonb),
  ('require_mfa', '{"enabled": true}'::jsonb),
  ('retention_days', '{"days": 30}'::jsonb),
  ('api_url', '{"url": "https://api.anima-app.com/v1"}'::jsonb),
  ('sync_interval', '{"ms": 15000}'::jsonb),
  ('min_app_version', '{"version": "1.2.4"}'::jsonb),
  ('maintenance_mode', '{"enabled": false}'::jsonb),
  ('notif_diary_reminder', '{"enabled": true}'::jsonb),
  ('notif_progress_alerts', '{"enabled": true}'::jsonb),
  ('notif_sos_checkins', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Políticas: solo admins pueden leer/escribir

CREATE POLICY "Admins pueden leer app_settings" ON app_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins pueden modificar app_settings" ON app_settings
  FOR ALL USING (true);
