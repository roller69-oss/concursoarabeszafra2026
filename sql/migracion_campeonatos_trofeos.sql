-- ============================================================
-- MIGRACIÓN: solo hace falta ejecutar esto si ya habías creado
-- la base de datos ANTES de tener campeonatos y trofeos.
-- (si es la primera vez que instalas todo, ignora este archivo:
-- sql/schema.sql y sql/seed.sql ya lo traen incluido).
-- ============================================================

-- 1) Nuevas tablas
create table if not exists campeonatos (
  id serial primary key,
  codigo text unique not null,
  titulo text not null,
  orden int not null default 0,
  clases jsonb not null default '[]'::jsonb,
  oro_id int references caballos(id),
  plata_id int references caballos(id),
  bronce_id int references caballos(id),
  publicado boolean not null default false
);

create table if not exists trofeos (
  id serial primary key,
  codigo text unique not null,
  titulo text not null,
  orden int not null default 0,
  tipo text not null default 'animal',
  ganador_caballo_id int references caballos(id),
  ganador_texto text
);

alter table campeonatos enable row level security;
alter table trofeos enable row level security;

drop policy if exists "lectura publica campeonatos" on campeonatos;
create policy "lectura publica campeonatos" on campeonatos for select using (true);
drop policy if exists "lectura publica trofeos" on trofeos;
create policy "lectura publica trofeos" on trofeos for select using (true);

drop policy if exists "admin escribe campeonatos" on campeonatos;
create policy "admin escribe campeonatos" on campeonatos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "admin escribe trofeos" on trofeos;
create policy "admin escribe trofeos" on trofeos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 2) Datos de los 6 campeonatos y 6 trofeos
insert into campeonatos (codigo, titulo, orden, clases) values
  ('potras-yearling', 'Campeonato Potras Yearling', 1, '["1A","1B"]'::jsonb),
  ('potras-junior',   'Campeonato Potras Junior',   2, '["3","4"]'::jsonb),
  ('potros-yearling', 'Campeonato Potros Yearling', 3, '["2A","2B"]'::jsonb),
  ('potros-junior',   'Campeonato Potros Junior',   4, '["5","6"]'::jsonb),
  ('yeguas',          'Campeonato de Yeguas',       5, '["7","8","9"]'::jsonb),
  ('sementales',      'Campeonato de Sementales',   6, '["10","11","12"]'::jsonb)
on conflict (codigo) do nothing;

insert into trofeos (codigo, titulo, orden, tipo) values
  ('mejor-cabeza',       'Mejor Cabeza',                 1, 'animal'),
  ('mejor-movimiento',   'Mejor Movimiento',             2, 'animal'),
  ('prueba-libertad',    'Prueba de Libertad',           3, 'animal'),
  ('mejor-presentador',  'Mejor Presentador',            4, 'texto'),
  ('mejor-puntuacion',   'Mejor Puntuación (Best Show)', 5, 'animal'),
  ('mejor-pure-spanish', 'Mejor Pure Spanish',           6, 'animal')
on conflict (codigo) do nothing;

-- 3) Actualizar los títulos de las clases a la nomenclatura oficial
update clases set titulo = '1 Año · Hembras A' where codigo = '1A';
update clases set titulo = '1 Año · Hembras B' where codigo = '1B';
update clases set titulo = '1 Año · Machos A' where codigo = '2A';
update clases set titulo = '1 Año · Machos B' where codigo = '2B';
update clases set titulo = '2 Años · Hembras' where codigo = '3';
update clases set titulo = '3 Años · Hembras' where codigo = '4';
update clases set titulo = '2 Años · Machos' where codigo = '5';
update clases set titulo = '3 Años · Machos' where codigo = '6';
update clases set titulo = 'Yeguas de 4 a 6 años' where codigo = '7';
update clases set titulo = 'Yeguas de 7 a 10 años' where codigo = '8';
update clases set titulo = 'Yeguas de 11 años en adelante' where codigo = '9';
update clases set titulo = 'Sementales de 4 a 6 años' where codigo = '10';
update clases set titulo = 'Sementales de 7 a 10 años' where codigo = '11';
update clases set titulo = 'Sementales de 11 años en adelante' where codigo = '12';
update clases set titulo = 'Futurity · Hembras' where codigo = '13';
update clases set titulo = 'Futurity · Machos' where codigo = '14';
