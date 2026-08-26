import { describe, it, expect, afterAll } from "vitest";
import {
  createBook,
  getBooks,
  getBookBySlug,
  getBookById,
  updateBook,
  deleteBook,
  getStats,
} from "./db";

const ids: number[] = [];

afterAll(async () => {
  for (const id of ids) await deleteBook(id);
});

describe("capa de datos (contra la base real)", () => {
  it("crea, lee, actualiza y borra", async () => {
    const creado = await createBook({
      title: "Libro De Prueba Uno",
      author: "Julio Cortázar",
      isbn: "9788437604947",
      rating: 9,
      review: "Una reseña de prueba.",
      status: "leido",
      finishedAt: "2026-03-14",
    });
    ids.push(creado.id);

    expect(creado.slug).toBe("libro-de-prueba-uno");
    expect(creado.rating).toBe(9);

    const porSlug = await getBookBySlug("libro-de-prueba-uno");
    expect(porSlug?.id).toBe(creado.id);

    const porId = await getBookById(creado.id);
    expect(porId?.title).toBe("Libro De Prueba Uno");

    const actualizado = await updateBook(creado.id, {
      title: "Libro De Prueba Uno",
      author: "Julio Cortázar",
      isbn: null,
      rating: 10,
      review: "Reseña editada.",
      status: "leido",
      finishedAt: "2026-03-15",
    });
    expect(actualizado.rating).toBe(10);
    expect(actualizado.isbn).toBeNull();
  });

  it("devuelve finished_at como string AAAA-MM-DD, no como Date", async () => {
    const libro = await createBook({
      title: "Prueba de fecha",
      author: "X",
      isbn: null,
      rating: 5,
      review: null,
      status: "leido",
      finishedAt: "2026-03-14",
    });
    ids.push(libro.id);

    // pg parsea DATE a Date en zona local (adelantaría/atrasaría un día);
    // Neon devuelve el string. La app espera siempre el string.
    expect(typeof libro.finished_at).toBe("string");
    expect(libro.finished_at).toBe("2026-03-14");

    const releido = await getBookById(libro.id);
    expect(releido?.finished_at).toBe("2026-03-14");
  });

  it("desambigua slugs repetidos", async () => {
    const a = await createBook({
      title: "Libro De Prueba Dos",
      author: "Borges",
      isbn: null,
      rating: null,
      review: null,
      status: "pendiente",
      finishedAt: null,
    });
    const b = await createBook({
      title: "Libro De Prueba Dos",
      author: "Otro",
      isbn: null,
      rating: null,
      review: null,
      status: "pendiente",
      finishedAt: null,
    });
    ids.push(a.id, b.id);

    expect(a.slug).toBe("libro-de-prueba-dos");
    expect(b.slug).toBe("libro-de-prueba-dos-2");
  });

  it("filtra por estado", async () => {
    const pendientes = await getBooks("pendiente");
    expect(pendientes.every((b) => b.status === "pendiente")).toBe(true);
  });

  it("calcula estadísticas", async () => {
    const stats = await getStats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.histograma).toHaveLength(10);
    expect(stats.histograma.map((h) => h.rating)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it("la base rechaza un pendiente con nota", async () => {
    await expect(
      createBook({
        title: "Inválido",
        author: "X",
        isbn: null,
        rating: 5,
        review: null,
        status: "pendiente",
        finishedAt: null,
      }),
    ).rejects.toThrow();
  });
});
