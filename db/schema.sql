CREATE TABLE IF NOT EXISTS books (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  author        TEXT NOT NULL,
  isbn          TEXT,
  rating        INT CHECK (rating BETWEEN 1 AND 10),
  review        TEXT,
  status        TEXT NOT NULL DEFAULT 'leido'
                CHECK (status IN ('leido', 'leyendo', 'pendiente')),
  finished_year INT CHECK (finished_year BETWEEN 1900 AND 2200),
  gem           BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Un libro pendiente todavía no se leyó: sin nota ni año.
  CONSTRAINT pendiente_sin_lectura CHECK (
    status <> 'pendiente' OR (rating IS NULL AND finished_year IS NULL)
  ),

  -- Una joyita es una distinción entre libros ya puntuados.
  CONSTRAINT joyita_con_nota CHECK (gem = false OR rating IS NOT NULL)
);

-- Orden de la app: primero los puntuados, después por año descendente.
CREATE INDEX IF NOT EXISTS books_orden_idx
  ON books ((rating IS NULL), finished_year DESC NULLS LAST, created_at DESC);
