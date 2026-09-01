-- ============================================================
-- AÑADIR: sorteo del jamón + marca de "no presentado" en caballos
-- Ejecutar en Supabase → SQL Editor → New query → pegar → Run
-- ============================================================

alter table caballos add column if not exists no_presentado boolean not null default false;

create table if not exists sorteo (
  id int primary key default 1,
  premio text not null default 'Jamón',
  descripcion text not null default 'A lo largo del concurso se realizará un sorteo entre todos los participantes.',
  ganador text,
  constraint sorteo_single_row check (id = 1)
);
insert into sorteo (id) values (1) on conflict (id) do nothing;

alter table sorteo enable row level security;

drop policy if exists "lectura publica sorteo" on sorteo;
create policy "lectura publica sorteo" on sorteo for select using (true);

drop policy if exists "admin escribe sorteo" on sorteo;
create policy "admin escribe sorteo" on sorteo
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
