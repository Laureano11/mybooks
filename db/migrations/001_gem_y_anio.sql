-- Migración: joyita + año de lectura (reemplaza la fecha exacta).
--
-- Se ejecuta en dos partes para no perder datos: la parte 1 copia las fechas
-- al nuevo campo y deja `finished_at` intacta. Recién después de verificar que
-- los años quedaron bien se corre la parte 2, que elimina la columna vieja.

BEGIN;

-- Joyita: distinción manual para los libros demasiado buenos.
ALTER TABLE books ADD COLUMN IF NOT EXISTS gem BOOLEAN NOT NULL DEFAULT false;

-- La fecha exacta no aportaba: alcanza con el año.
ALTER TABLE books ADD COLUMN IF NOT EXISTS finished_year INT;
UPDATE books SET finished_year = EXTRACT(YEAR FROM finished_at)::int
  WHERE finished_at IS NOT NULL AND finished_year IS NULL;

ALTER TABLE books DROP CONSTRAINT IF EXISTS books_finished_year_check;
ALTER TABLE books ADD CONSTRAINT books_finished_year_check
  CHECK (finished_year IS NULL OR finished_year BETWEEN 1900 AND 2200);

ALTER TABLE books DROP CONSTRAINT IF EXISTS pendiente_sin_lectura;
ALTER TABLE books ADD CONSTRAINT pendiente_sin_lectura CHECK (
  status <> 'pendiente' OR (rating IS NULL AND finished_year IS NULL)
);

-- Una joyita es una distinción entre libros ya puntuados.
ALTER TABLE books DROP CONSTRAINT IF EXISTS joyita_con_nota;
ALTER TABLE books ADD CONSTRAINT joyita_con_nota CHECK (
  gem = false OR rating IS NOT NULL
);

-- Orden de la app: primero los puntuados, después por año descendente.
DROP INDEX IF EXISTS books_finished_at_idx;
CREATE INDEX IF NOT EXISTS books_orden_idx
  ON books ((rating IS NULL), finished_year DESC NULLS LAST, created_at DESC);

COMMIT;
