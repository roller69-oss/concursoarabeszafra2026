-- ============================================================
-- AÑADIR: tablón de anuncios
-- Ejecutar en Supabase → SQL Editor → New query → pegar → Run
-- ============================================================

create table if not exists anuncios (
  id serial primary key,
  titulo text,
  texto text not null,
  creado_en timestamptz not null default now()
);

alter table anuncios enable row level security;

drop policy if exists "lectura publica anuncios" on anuncios;
create policy "lectura publica anuncios" on anuncios for select using (true);

drop policy if exists "admin escribe anuncios" on anuncios;
create policy "admin escribe anuncios" on anuncios
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
