-- ============================================================
-- AÑADIR: enlace para ver el concurso en directo (YouTube)
-- Ejecutar en Supabase → SQL Editor → New query → pegar → Run
-- ============================================================

alter table evento add column if not exists directo_url text;
