-- ============================================================
-- AÑADIR: jueces por clase + jueces generales del evento
-- Ejecutar en Supabase → SQL Editor → New query → pegar → Run
-- ============================================================

alter table clases add column if not exists juez1 text;
alter table clases add column if not exists juez2 text;

alter table evento add column if not exists juez1_general text;
alter table evento add column if not exists juez2_general text;
