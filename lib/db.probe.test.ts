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
      finishedYear: 2026,
      gem: false,
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
      finishedYear: 2026,
      gem: true,
    });
    expect(actualizado.rating).toBe(10);
    expect(actualizado.isbn).toBeNull();
  });

  it("guarda el año de lectura como número", async () => {
    const libro = await createBook({
      title: "Prueba de fecha",
      author: "X",
      isbn: null,
      rating: 5,
      review: null,
      status: "leido",
      finishedYear: 2026,
      gem: false,
    });
    ids.push(libro.id);

    expect(libro.finished_year).toBe(2026);

    const releido = await getBookById(libro.id);
    expect(releido?.finished_year).toBe(2026);
  });

  it("desambigua slugs repetidos", async () => {
    const a = await createBook({
      title: "Libro De Prueba Dos",
      author: "Borges",
      isbn: null,
      rating: null,
      review: null,
      status: "pendiente",
      finishedYear: null,
      gem: false,
    });
    const b = await createBook({
      title: "Libro De Prueba Dos",
      author: "Otro",
      isbn: null,
      rating: null,
      review: null,
      status: "pendiente",
      finishedYear: null,
      gem: false,
    });
    ids.push(a.id, b.id);

    expect(a.slug).toBe("libro-de-prueba-dos");
    expect(b.slug).toBe("libro-de-prueba-dos-2");
  });

  it("filtra por estado", async () => {
    const pendientes = await getBooks("pendiente");
    expect(pendientes.every((b) => b.status === "pendiente")).toBe(true);
  });

  it("ordena los libros con nota antes que los que no la tienen", async () => {
    const sinNota = await createBook({
      title: "Sin Puntuar Todavia",
      author: "X",
      isbn: null,
      rating: null,
      review: null,
      status: "leido",
      // Año reciente: sin el orden nuevo, este libro se iría al tope.
      finishedYear: 2026,
      gem: false,
    });
    const conNota = await createBook({
      title: "Puntuado Viejo",
      author: "X",
      isbn: null,
      rating: 6,
      review: null,
      status: "leido",
      finishedYear: 1990,
      gem: false,
    });
    ids.push(sinNota.id, conNota.id);

    const libros = await getBooks();
    const posSinNota = libros.findIndex((b) => b.id === sinNota.id);
    const posConNota = libros.findIndex((b) => b.id === conNota.id);
    expect(posConNota).toBeLessThan(posSinNota);

    // Y todos los puntuados van antes que cualquiera sin puntuar.
    const primerSinNota = libros.findIndex((b) => b.rating === null);
    if (primerSinNota !== -1) {
      expect(libros.slice(primerSinNota).every((b) => b.rating === null)).toBe(
        true,
      );
    }
  });

  it("filtra por joyitas", async () => {
    const joya = await createBook({
      title: "Una Joyita De Prueba",
      author: "X",
      isbn: null,
      rating: 10,
      review: null,
      status: "leido",
      finishedYear: 2026,
      gem: true,
    });
    ids.push(joya.id);

    const joyitas = await getBooks("joyitas");
    expect(joyitas.every((b) => b.gem)).toBe(true);
    expect(joyitas.some((b) => b.id === joya.id)).toBe(true);
  });

  it("la base rechaza una joyita sin nota", async () => {
    await expect(
      createBook({
        title: "Joyita Invalida",
        author: "X",
        isbn: null,
        rating: null,
        review: null,
        status: "leido",
        finishedYear: null,
        gem: true,
      }),
    ).rejects.toThrow();
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
        finishedYear: null,
      gem: false,
      }),
    ).rejects.toThrow();
  });
});
