CREATE TABLE IF NOT EXISTS books (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  author      TEXT NOT NULL,
  isbn        TEXT,
  rating      INT CHECK (rating BETWEEN 1 AND 10),
  review      TEXT,
  status      TEXT NOT NULL DEFAULT 'leido'
              CHECK (status IN ('leido', 'leyendo', 'pendiente')),
  finished_at DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Un libro pendiente todavía no se leyó: sin nota ni fecha de fin.
  CONSTRAINT pendiente_sin_lectura CHECK (
    status <> 'pendiente' OR (rating IS NULL AND finished_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS books_finished_at_idx
  ON books (finished_at DESC NULLS LAST, created_at DESC);
