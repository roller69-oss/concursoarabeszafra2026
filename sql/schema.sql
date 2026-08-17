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
  constraint evento_single_row check (id = 1)
);
insert into evento (id) values (1) on conflict (id) do nothing;

-- 2) Clases / pruebas del concurso
create table if not exists clases (
  id serial primary key,
  codigo text unique not null,        -- '1A', '2B', '7', 'FUTURITY-H'...
  titulo text not null,               -- '1 AÑO · HEMBRAS'
  orden int not null default 0,       -- orden de aparición en la portada
  clasificacion_publicada boolean not null default false
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
  criador text,
  propietario text,
  notas text,
  -- Puntuaciones: 5 criterios (T, CyC, C, E, M) x 2 jueces, igual que la hoja en papel
  j1_t numeric(5,2), j1_cyc numeric(5,2), j1_c numeric(5,2), j1_e numeric(5,2), j1_m numeric(5,2),
  j2_t numeric(5,2), j2_cyc numeric(5,2), j2_c numeric(5,2), j2_e numeric(5,2), j2_m numeric(5,2),
  posicion int                         -- clasificación final (la coloca el admin a mano)
);

create index if not exists idx_caballos_clase on caballos(clase_id);

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
