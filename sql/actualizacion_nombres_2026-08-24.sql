-- ============================================================
-- ACTUALIZACIÓN DE NOMBRES: clases (2 líneas, estilo Excel)
-- y campeonatos (sin el prefijo 'Campeonato')
-- Ejecutar en Supabase → SQL Editor → New query → pegar → Run
-- ============================================================

-- Clases: el título ahora lleva dos partes separadas por '|'
-- (la web las reparte en dos líneas dentro de la tarjeta)
update clases set titulo = 'Potras 1 Año|1A' where codigo = '1A';
update clases set titulo = 'Potras 1 Año|1B' where codigo = '1B';
update clases set titulo = 'Potros 1 Año|2A' where codigo = '2A';
update clases set titulo = 'Potros 1 Año|2B' where codigo = '2B';
update clases set titulo = 'Potras|2 Años' where codigo = '3';
update clases set titulo = 'Potras|3 Años' where codigo = '4';
update clases set titulo = 'Potros|2 Años' where codigo = '5';
update clases set titulo = 'Potros|3 Años' where codigo = '6';
update clases set titulo = 'Yeguas|4 - 6 Años' where codigo = '7';
update clases set titulo = 'Yeguas|7 - 11 Años' where codigo = '8';
update clases set titulo = 'Yeguas|Más 11 Años' where codigo = '9';
update clases set titulo = 'Sementales|4 - 6 Años' where codigo = '10';
update clases set titulo = 'Sementales|7 - 11 Años' where codigo = '11';
update clases set titulo = 'Sementales|Más 11 Años' where codigo = '12';
update clases set titulo = 'Futurity|Hembra' where codigo = '13';
update clases set titulo = 'Futurity|Macho' where codigo = '14';

-- Campeonatos: sin el prefijo "Campeonato"
update campeonatos set titulo = 'Potras Yearling' where codigo = 'potras-yearling';
update campeonatos set titulo = 'Potras Junior' where codigo = 'potras-junior';
update campeonatos set titulo = 'Potros Yearling' where codigo = 'potros-yearling';
update campeonatos set titulo = 'Potros Junior' where codigo = 'potros-junior';
update campeonatos set titulo = 'Yeguas' where codigo = 'yeguas';
update campeonatos set titulo = 'Sementales' where codigo = 'sementales';
