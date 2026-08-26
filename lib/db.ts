import "server-only";
import { neon } from "@neondatabase/serverless";
import { Pool, types } from "pg";
import { uniqueSlug } from "./slug";
import type { BookValues, Status } from "./validation";

export type Book = {
  id: number;
  slug: string;
  title: string;
  author: string;
  isbn: string | null;
  rating: number | null;
  review: string | null;
  status: Status;
  finished_at: string | null;
  created_at: string;
};

/**
 * Neon habla por HTTP y solo sirve contra neon.tech; en local usamos el
 * driver pg común. Ambos exponen la misma etiqueta sql de template.
 */
type SqlTag = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Record<string, unknown>[]>;

function makeSql(): SqlTag {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta la variable de entorno DATABASE_URL");

  if (url.includes("neon.tech")) {
    return neon(url) as unknown as SqlTag;
  }

  // pg convierte DATE a un objeto Date en zona local; Neon devuelve el string
  // tal cual. Se desactiva el parseo para que ambos entreguen "AAAA-MM-DD".
  types.setTypeParser(types.builtins.DATE, (v) => v);

  // El pool se guarda en globalThis para que el hot reload no abra uno por recarga.
  const g = globalThis as { _pgPool?: Pool };
  const pool = (g._pgPool ??= new Pool({ connectionString: url }));

  return async (strings, ...values) => {
    // Convierte la template en SQL parametrizado: los valores pasan a ser $1, $2, ...
    const text = strings.reduce(
      (acc, part, i) => acc + part + (i < values.length ? "$" + (i + 1) : ""),
      "",
    );
    const result = await pool.query(text, values);
    return result.rows;
  };
}

const sql = makeSql();

export async function getBooks(status?: Status): Promise<Book[]> {
  const rows = status
    ? await sql`SELECT * FROM books WHERE status = ${status}
                ORDER BY finished_at DESC NULLS LAST, created_at DESC`
    : await sql`SELECT * FROM books
                ORDER BY finished_at DESC NULLS LAST, created_at DESC`;
  return rows as Book[];
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  const rows = await sql`SELECT * FROM books WHERE slug = ${slug} LIMIT 1`;
  return (rows[0] as Book) ?? null;
}

export async function getBookById(id: number): Promise<Book | null> {
  const rows = await sql`SELECT * FROM books WHERE id = ${id} LIMIT 1`;
  return (rows[0] as Book) ?? null;
}

export async function createBook(values: BookValues): Promise<Book> {
  const slug = await freeSlug(values.title);
  const rows = await sql`
    INSERT INTO books (slug, title, author, isbn, rating, review, status, finished_at)
    VALUES (${slug}, ${values.title}, ${values.author}, ${values.isbn},
            ${values.rating}, ${values.review}, ${values.status}, ${values.finishedAt})
    RETURNING *`;
  return rows[0] as Book;
}

export async function updateBook(
  id: number,
  values: BookValues,
): Promise<Book> {
  const rows = await sql`
    UPDATE books SET
      title = ${values.title},
      author = ${values.author},
      isbn = ${values.isbn},
      rating = ${values.rating},
      review = ${values.review},
      status = ${values.status},
      finished_at = ${values.finishedAt}
    WHERE id = ${id}
    RETURNING *`;
  return rows[0] as Book;
}

export async function deleteBook(id: number): Promise<void> {
  await sql`DELETE FROM books WHERE id = ${id}`;
}

/** Busca un slug libre consultando solo los que empiezan igual. */
async function freeSlug(title: string): Promise<string> {
  const rows = await sql`SELECT slug FROM books`;
  return uniqueSlug(
    title,
    (rows as { slug: string }[]).map((r) => r.slug),
  );
}

export type Stats = {
  total: number;
  leidos: number;
  leyendo: number;
  pendientes: number;
  promedio: number | null;
  porAnio: { anio: number; cantidad: number }[];
  histograma: { rating: number; cantidad: number }[];
};

export async function getStats(): Promise<Stats> {
  const [totales] = (await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'leido')::int AS leidos,
      COUNT(*) FILTER (WHERE status = 'leyendo')::int AS leyendo,
      COUNT(*) FILTER (WHERE status = 'pendiente')::int AS pendientes,
      ROUND(AVG(rating)::numeric, 1) AS promedio
    FROM books`) as {
    total: number;
    leidos: number;
    leyendo: number;
    pendientes: number;
    promedio: string | null;
  }[];

  const porAnio = (await sql`
    SELECT EXTRACT(YEAR FROM finished_at)::int AS anio, COUNT(*)::int AS cantidad
    FROM books WHERE finished_at IS NOT NULL
    GROUP BY anio ORDER BY anio DESC`) as { anio: number; cantidad: number }[];

  const conteos = (await sql`
    SELECT rating, COUNT(*)::int AS cantidad
    FROM books WHERE rating IS NOT NULL
    GROUP BY rating`) as { rating: number; cantidad: number }[];

  // El histograma siempre muestra las 10 notas, incluso las que están en cero.
  const histograma = Array.from({ length: 10 }, (_, i) => ({
    rating: i + 1,
    cantidad: conteos.find((c) => c.rating === i + 1)?.cantidad ?? 0,
  }));

  return {
    total: totales.total,
    leidos: totales.leidos,
    leyendo: totales.leyendo,
    pendientes: totales.pendientes,
    promedio: totales.promedio === null ? null : Number(totales.promedio),
    porAnio,
    histograma,
  };
}
