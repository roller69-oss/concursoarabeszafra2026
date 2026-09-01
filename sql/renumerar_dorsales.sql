-- ============================================================
-- RENUMERAR DORSALES: cierra huecos tras una baja
-- Úsalo cada vez que elimines un caballo y quieras que los
-- dorsales de todo el concurso vuelvan a ser correlativos.
--
-- Cómo funciona: ordena todos los caballos que quedan por su
-- dorsal actual, y les asigna 1, 2, 3... sin huecos.
--
-- Ejecutar en Supabase → SQL Editor → New query → pegar → Run
-- ============================================================

with recalculo as (
  select id, row_number() over (order by dorsal) as nuevo_dorsal
  from caballos
)
update caballos c
set dorsal = r.nuevo_dorsal
from recalculo r
where c.id = r.id;
