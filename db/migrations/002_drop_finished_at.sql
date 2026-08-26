-- Parte 2 de la migración 001. Correr SOLO después de verificar que
-- `finished_year` quedó correcto en todos los libros. Es irreversible.
ALTER TABLE books DROP COLUMN IF EXISTS finished_at;
