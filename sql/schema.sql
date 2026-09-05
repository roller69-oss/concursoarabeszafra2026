-- ============================================================
-- ESQUEMA: Concurso Pura Raza Árabe · Zafra
-- Ejecutar esto en Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1) Datos generales del evento (portada: título, cartel, patrocinadores...)
create table if not exists evento (
  id int primary key default 1,
  titulo text not null default 'Concurso de Pura Raza Árabe',
  subtitulo text default 'Zafra · Badajoz',
  lugar text default 'Zafra, Badajoz',
  fechas text default '',
  descripcion text default '',
  cartel_url text default '',
  patrocinadores jsonb not null default '[]'::jsonb,
  colaboradores jsonb not null default '[]'::jsonb,
  juez1_general text,
  juez2_general text,
  constraint evento_single_row check (id = 1)
);
insert into evento (id) values (1) on conflict (id) do nothing;

-- 2) Clases / pruebas del concurso
create table if not exists clases (
  id serial primary key,
  codigo text unique not null,        -- '1A', '2B', '7', 'FUTURITY-H'...
  titulo text not null,               -- '1 AÑO · HEMBRAS'
  orden int not null default 0,       -- orden de aparición en la portada
  clasificacion_publicada boolean not null default false,
  juez1 text,
  juez2 text
);

-- 3) Caballos inscritos en cada clase
create table if not exists caballos (
  id serial primary key,
  clase_id int references clases(id) on delete cascade,
  dorsal int,                          -- número de salida (orden de salida)
  nombre text not null,
  fecha_nacimiento date,
  capa text,
  padre text,
  madre text,
  abuelo_materno text,
  criador text,
  propietario text,
  notas text,
  -- Puntuaciones: 5 criterios (T, CyC, C, E, M) x 2 jueces, igual que la hoja en papel
  j1_t numeric(5,2), j1_cyc numeric(5,2), j1_c numeric(5,2), j1_e numeric(5,2), j1_m numeric(5,2),
  j2_t numeric(5,2), j2_cyc numeric(5,2), j2_c numeric(5,2), j2_e numeric(5,2), j2_m numeric(5,2),
  posicion int,                        -- clasificación final (la coloca el admin a mano)
  no_presentado boolean not null default false
);

-- 6) Sorteo (ej. jamón entre los participantes)
create table if not exists sorteo (
  id int primary key default 1,
  premio text not null default 'Jamón',
  descripcion text not null default 'A lo largo del concurso se realizará un sorteo entre todos los participantes.',
  ganador text,
  constraint sorteo_single_row check (id = 1)
);
insert into sorteo (id) values (1) on conflict (id) do nothing;

alter table sorteo enable row level security;
create policy "lectura publica sorteo" on sorteo for select using (true);
create policy "admin escribe sorteo" on sorteo
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create index if not exists idx_caballos_clase on caballos(clase_id);

-- 4) Campeonatos: juntan a los 3 primeros de varias clases (sin fórmula, se elige a mano)
create table if not exists campeonatos (
  id serial primary key,
  codigo text unique not null,
  titulo text not null,
  orden int not null default 0,
  clases jsonb not null default '[]'::jsonb,   -- códigos de clase que alimentan este campeonato, ej: ["1A","1B"]
  oro_id int references caballos(id),
  plata_id int references caballos(id),
  bronce_id int references caballos(id),
  publicado boolean not null default false
);

-- 5) Trofeos especiales: un único ganador cada uno
create table if not exists trofeos (
  id serial primary key,
  codigo text unique not null,
  titulo text not null,
  orden int not null default 0,
  tipo text not null default 'animal',         -- 'animal' (se elige un caballo) o 'texto' (se escribe a mano)
  ganador_caballo_id int references caballos(id),
  ganador_texto text
);

alter table campeonatos enable row level security;
alter table trofeos enable row level security;

create policy "lectura publica campeonatos" on campeonatos for select using (true);
create policy "lectura publica trofeos" on trofeos for select using (true);

create policy "admin escribe campeonatos" on campeonatos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin escribe trofeos" on trofeos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- SEGURIDAD: todo el mundo puede leer, solo un usuario logueado
-- (tu cuenta admin) puede escribir.
-- ============================================================
alter table evento enable row level security;
alter table clases enable row level security;
alter table caballos enable row level security;

create policy "lectura publica evento" on evento
  for select using (true);
create policy "lectura publica clases" on clases
  for select using (true);
create policy "lectura publica caballos" on caballos
  for select using (true);

create policy "admin escribe evento" on evento
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin escribe clases" on clases
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin escribe caballos" on caballos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 7) Tablón de anuncios
create table if not exists anuncios (
  id serial primary key,
  titulo text,
  texto text not null,
  creado_en timestamptz not null default now()
);
alter table anuncios enable row level security;
create policy "lectura publica anuncios" on anuncios for select using (true);
create policy "admin escribe anuncios" on anuncios
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
