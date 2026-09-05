-- ============================================================
-- AÑADIR: votos de campeonato (Oro/Plata/Bronce por juez)
-- Ejecutar en Supabase → SQL Editor → New query → pegar → Run
-- ============================================================

create table if not exists campeonato_votos (
  id serial primary key,
  campeonato_id int references campeonatos(id) on delete cascade,
  caballo_id int references caballos(id) on delete cascade,
  juez1_medalla text,
  juez2_medalla text,
  posicion_final int,
  unique (campeonato_id, caballo_id)
);

alter table campeonato_votos enable row level security;

drop policy if exists "lectura publica campeonato_votos" on campeonato_votos;
create policy "lectura publica campeonato_votos" on campeonato_votos for select using (true);

drop policy if exists "admin escribe campeonato_votos" on campeonato_votos;
create policy "admin escribe campeonato_votos" on campeonato_votos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
