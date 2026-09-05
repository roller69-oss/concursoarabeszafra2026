-- ============================================================
-- Jueces del concurso: D. Ramón Salas (Juez I) y D. Rubén Lago (Juez II)
-- para todas las clases y como jueces generales del evento
-- Ejecutar en Supabase → SQL Editor → New query → pegar → Run
-- ============================================================

update clases set juez1 = 'D. Ramón Salas', juez2 = 'D. Rubén Lago';

update evento set juez1_general = 'D. Ramón Salas', juez2_general = 'D. Rubén Lago' where id = 1;
