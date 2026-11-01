import data from "@/data/books.json";

export const STATUSES = ["leido", "leyendo", "pendiente"] as const;
export type Status = (typeof STATUSES)[number];

export type Book = {
  slug: string;
  title: string;
  author: string;
  isbn: string | null;
  rating: number | null;
  review: string | null;
  status: Status;
  finished_year: number | null;
  gem: boolean;
};

/** Filtro de la home: por estado, o solo las joyitas. */
export type BookFilter = Status | "joyitas";

const isInt = (v: unknown, min: number, max: number) =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const isText = (v: unknown) => typeof v === "string" && v.trim() !== "";
const orNull = (v: unknown, check: (v: unknown) => boolean) => v === null || check(v);

/** El archivo se edita a mano: si tiene un error, el build falla en vez de publicarlo. */
export function parseBooks(raw: unknown): Book[] {
  if (!Array.isArray(raw)) throw new Error("books.json tiene que ser una lista de libros");

  const errors: string[] = [];
  const slugs = new Set<unknown>();
  raw.forEach((b: Book, i) => {
    const fail = (problem: string) => errors.push(`${b?.slug ?? `#${i + 1}`}: ${problem}`);

    if (typeof b.slug !== "string" || !/^[a-z0-9-]+$/.test(b.slug)) fail("slug inválido (solo a-z, 0-9 y guiones)");
    if (slugs.has(b.slug)) fail("slug repetido");
    slugs.add(b.slug);
    if (!isText(b.title)) fail("falta title");
    if (!isText(b.author)) fail("falta author");
    if (!orNull(b.isbn, isText)) fail("isbn tiene que ser texto o null");
    if (!orNull(b.rating, (v) => isInt(v, 1, 10))) fail("rating tiene que ser de 1 a 10 o null");
    if (!orNull(b.review, (v) => typeof v === "string")) fail("review tiene que ser texto o null");
    if (!STATUSES.includes(b.status)) fail(`status tiene que ser ${STATUSES.join(", ")}`);
    if (!orNull(b.finished_year, (v) => isInt(v, 1900, 2200))) fail("finished_year tiene que ser un año o null");
    if (typeof b.gem !== "boolean") fail("gem tiene que ser true o false");
    if (b.status === "pendiente" && (b.rating !== null || b.finished_year !== null))
      fail("un libro pendiente no lleva rating ni finished_year");
    if (b.gem && b.rating === null) fail("una joyita tiene que tener rating");
  });

  if (errors.length) throw new Error(`Errores en books.json:\n${errors.join("\n")}`);
  return raw;
}

/** Los libros sin nota van al final; a igual año, manda el orden del archivo. */
export function sortBooks(list: Book[]): Book[] {
  return list.toSorted(
    (a, b) =>
      Number(a.rating === null) - Number(b.rating === null) ||
      (b.finished_year ?? -Infinity) - (a.finished_year ?? -Infinity) || 0,
  );
}

const books = sortBooks(parseBooks(data));

export function getBooks(filter?: BookFilter): Book[] {
  if (filter === "joyitas") return books.filter((b) => b.gem);
  return filter ? books.filter((b) => b.status === filter) : books;
}

export function getBookBySlug(slug: string): Book | null {
  return books.find((b) => b.slug === slug) ?? null;
}

export type Stats = {
  total: number;
  leidos: number;
  leyendo: number;
  pendientes: number;
  joyitas: number;
  promedio: number | null;
  porAnio: { anio: number; cantidad: number }[];
  histograma: { rating: number; cantidad: number }[];
};

export function computeStats(list: Book[]): Stats {
  const count = (test: (b: Book) => boolean) => list.filter(test).length;
  const ratings = list.flatMap((b) => b.rating ?? []);
  const anios = [...new Set(list.flatMap((b) => b.finished_year ?? []))].sort((a, b) => b - a);

  return {
    total: list.length,
    leidos: count((b) => b.status === "leido"),
    leyendo: count((b) => b.status === "leyendo"),
    pendientes: count((b) => b.status === "pendiente"),
    joyitas: count((b) => b.gem),
    promedio: ratings.length
      ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
      : null,
    porAnio: anios.map((anio) => ({ anio, cantidad: count((b) => b.finished_year === anio) })),
    // El histograma siempre muestra las 10 notas, incluso las que están en cero.
    histograma: Array.from({ length: 10 }, (_, i) => ({
      rating: i + 1,
      cantidad: count((b) => b.rating === i + 1),
    })),
  };
}

export function getStats(): Stats {
  return computeStats(books);
}
