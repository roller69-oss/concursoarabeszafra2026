-- ============================================================
-- AÑADIR: clases "sin puntuación" (clasificación directa a mano,
-- sin hoja de notas) — pensado para Futurity, o cualquier clase
-- con pocos animales que no necesite jueces con notas.
-- Ejecutar en Supabase → SQL Editor → New query → pegar → Run
-- ============================================================

alter table clases add column if not exists sin_puntuacion boolean not null default false;

update clases set sin_puntuacion = true where codigo in ('13', '14');
