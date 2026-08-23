-- ============================================================
-- AÑADIR: Abuelo materno de cada caballo
-- Ejecutar en Supabase → SQL Editor → New query → pegar → Run
-- ============================================================

alter table caballos add column if not exists abuelo_materno text;

update caballos set abuelo_materno = 'EXCALIBUR E.A.' where trim(nombre) ilike trim('DONNA H.V.');
update caballos set abuelo_materno = 'COLISEUM E.A.' where trim(nombre) ilike trim('ALIRA DE CARO');
update caballos set abuelo_materno = 'STIVAL (US)' where trim(nombre) ilike trim('MZ SHAMS');
update caballos set abuelo_materno = 'SHANGHAI E.A.' where trim(nombre) ilike trim('LAA DAMARIS');
update caballos set abuelo_materno = 'EXCALIBUR E.A.' where trim(nombre) ilike trim('BELA DE LABA');
update caballos set abuelo_materno = 'L.C. HAREM' where trim(nombre) ilike trim('SG TRENZA');
update caballos set abuelo_materno = 'COLISEUM E.A.' where trim(nombre) ilike trim('SG TRIPOLI');
update caballos set abuelo_materno = 'EB JAMAL' where trim(nombre) ilike trim('AZHIR SAHIB NE');
update caballos set abuelo_materno = 'KANZ ALBIDAYER' where trim(nombre) ilike trim('OBIXENTH AL ZUBI');
update caballos set abuelo_materno = 'ADAGIO DE LUC' where trim(nombre) ilike trim('SOÑADOR A.A.');
update caballos set abuelo_materno = 'FLAVIO DE LUC' where trim(nombre) ilike trim('MZ SHAMAL');
update caballos set abuelo_materno = 'QR MARC' where trim(nombre) ilike trim('SHIO ISAL');
update caballos set abuelo_materno = 'JYAR MEIA LUA' where trim(nombre) ilike trim('SUNDAR AA');
update caballos set abuelo_materno = 'ABHA VOLTAIRE' where trim(nombre) ilike trim('NUNO R.C.');
update caballos set abuelo_materno = 'CLASSIC KARIM' where trim(nombre) ilike trim('L.G. UNIKA');
update caballos set abuelo_materno = 'MAKISA ADAGGIO' where trim(nombre) ilike trim('LAA CASSANDRA');
update caballos set abuelo_materno = 'ABHA ORIX' where trim(nombre) ilike trim('MZ ANNA ALISHEEBA');
update caballos set abuelo_materno = 'KHIDAR' where trim(nombre) ilike trim('JAMAL YAMIRA');
update caballos set abuelo_materno = 'QR MARC' where trim(nombre) ilike trim('SHIO JAVA');
update caballos set abuelo_materno = 'QUIMONANT' where trim(nombre) ilike trim('MAGIC DE MI SUEÑO');
update caballos set abuelo_materno = 'QR MARC' where trim(nombre) ilike trim('SHIO JULIA');
update caballos set abuelo_materno = 'SHAEL DREAM DESERT' where trim(nombre) ilike trim('LEENA AL SHIRAA');
update caballos set abuelo_materno = 'SHAMIL AL CAPÉ' where trim(nombre) ilike trim('AMS AL ZAHRA');
update caballos set abuelo_materno = 'FA EL RASHEEM' where trim(nombre) ilike trim('LUANA AL SHIRAA');
update caballos set abuelo_materno = 'KHIDAR' where trim(nombre) ilike trim('EROS PB');
update caballos set abuelo_materno = 'FLAVIO DE LUC' where trim(nombre) ilike trim('SG SAMOS');
update caballos set abuelo_materno = 'AJMAN MONISCIONE' where trim(nombre) ilike trim('LAA CYRO');
update caballos set abuelo_materno = 'IZABAL' where trim(nombre) ilike trim('VOLCAN DE TAGORO*');
update caballos set abuelo_materno = 'WH JUSTICE' where trim(nombre) ilike trim('JAMAL XANDROS');
update caballos set abuelo_materno = 'D KHATTAF' where trim(nombre) ilike trim('JOAN');
update caballos set abuelo_materno = 'MARWAN AL SHAQAB (QA)' where trim(nombre) ilike trim('AMEIXENDA DE LUC');
update caballos set abuelo_materno = 'IZABAL' where trim(nombre) ilike trim('VOLCAN DE ISORA*');
update caballos set abuelo_materno = 'ABHA PESHAWAR' where trim(nombre) ilike trim('AL-QAHIRA GA');
update caballos set abuelo_materno = 'MF ARYAN EL THESSA (DE)' where trim(nombre) ilike trim('TCHAATA LADY MONA');
update caballos set abuelo_materno = 'TIMUR' where trim(nombre) ilike trim('ULMARIA B');
update caballos set abuelo_materno = 'MILORD AL SHAQAB (PL)' where trim(nombre) ilike trim('REINA A.A.');
update caballos set abuelo_materno = 'ALFABIA DAMASCUS (IT)' where trim(nombre) ilike trim('BERNARDINA DE LABA');
update caballos set abuelo_materno = 'BORNEO' where trim(nombre) ilike trim('AMS ARALIA');
update caballos set abuelo_materno = 'HAIF' where trim(nombre) ilike trim('ESCITIA*');
update caballos set abuelo_materno = 'AQIR IBN TADJIRA' where trim(nombre) ilike trim('PM SANIS');
update caballos set abuelo_materno = 'GAZAL AL SHAQAB (QA)' where trim(nombre) ilike trim('MARCO POLO EA');
update caballos set abuelo_materno = 'EXCALIBUR E.A.' where trim(nombre) ilike trim('AD DHALI GA');
update caballos set abuelo_materno = 'JAVIER EL JAMAAL (DE)' where trim(nombre) ilike trim('MESIAS R.C.');
update caballos set abuelo_materno = 'DIAVOLO' where trim(nombre) ilike trim('L.G. RAP');
update caballos set abuelo_materno = 'EL PERFECTO' where trim(nombre) ilike trim('ABHA CALIFA');
update caballos set abuelo_materno = 'DRAGO 1984' where trim(nombre) ilike trim('RA YM');
update caballos set abuelo_materno = 'SUSPIRO' where trim(nombre) ilike trim('GORO*');
update caballos set abuelo_materno = 'MADRAS KOSSACK (NL)' where trim(nombre) ilike trim('CNOSOS E.A.');
update caballos set abuelo_materno = 'OLIMPICO' where trim(nombre) ilike trim('LANCEADOR*');
update caballos set abuelo_materno = 'IZAN AL CAPE' where trim(nombre) ilike trim('SG UGANDA');
update caballos set abuelo_materno = 'EXCALIBUR E.A.' where trim(nombre) ilike trim('GHAZAL GA');
