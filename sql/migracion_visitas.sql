-- ============================================================
-- AÑADIR: contador de visitas orientativo (solo lo ves tú)
-- Ejecutar en Supabase → SQL Editor → New query → pegar → Run
-- ============================================================

create table if not exists visitas (
  id int primary key default 1,
  total bigint not null default 0,
  constraint visitas_single_row check (id = 1)
);
insert into visitas (id) values (1) on conflict (id) do nothing;

alter table visitas enable row level security;

drop policy if exists "lectura admin visitas" on visitas;
create policy "lectura admin visitas" on visitas for select using (auth.role() = 'authenticated');

create or replace function incrementar_visitas()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  nuevo_total bigint;
begin
  update visitas set total = total + 1 where id = 1 returning total into nuevo_total;
  return nuevo_total;
end;
$$;

grant execute on function incrementar_visitas() to anon, authenticated;
