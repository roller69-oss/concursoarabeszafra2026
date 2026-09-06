-- ============================================================
-- AÑADIR: aviso informativo sobre los resultados (debajo de la cabecera)
-- Ejecutar en Supabase → SQL Editor → New query → pegar → Run
-- ============================================================

alter table evento add column if not exists aviso_resultados text;

update evento set aviso_resultados =
  'Esta web tiene carácter exclusivamente informativo y se limita a mostrar las puntuaciones y resultados otorgados por los jueces conforme a la normativa del concurso. Durante el desarrollo de las pruebas, la información mostrada puede actualizarse hasta la publicación de los resultados definitivos.'
where id = 1 and aviso_resultados is null;
