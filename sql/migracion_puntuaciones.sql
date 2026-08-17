-- ============================================================
-- MIGRACIÓN: solo hace falta ejecutar esto si ya habías creado
-- la base de datos ANTES de tener las 10 notas de los jueces
-- (si es la primera vez que instalas todo, ignora este archivo:
-- sql/schema.sql ya lo trae incluido).
-- ============================================================

alter table caballos drop column if exists puntuacion;

alter table caballos add column if not exists j1_t   numeric(5,2);
alter table caballos add column if not exists j1_cyc numeric(5,2);
alter table caballos add column if not exists j1_c   numeric(5,2);
alter table caballos add column if not exists j1_e   numeric(5,2);
alter table caballos add column if not exists j1_m   numeric(5,2);
alter table caballos add column if not exists j2_t   numeric(5,2);
alter table caballos add column if not exists j2_cyc numeric(5,2);
alter table caballos add column if not exists j2_c   numeric(5,2);
alter table caballos add column if not exists j2_e   numeric(5,2);
alter table caballos add column if not exists j2_m   numeric(5,2);
