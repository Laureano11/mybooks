import { describe, it, expect } from "vitest";
import { computeStats, parseBooks, sortBooks, type Book } from "./books";

const book = (over: Partial<Book> = {}): Book => ({
  slug: "rayuela",
  title: "Rayuela",
  author: "Julio Cortázar",
  isbn: null,
  rating: 8,
  review: null,
  status: "leido",
  finished_year: 2024,
  gem: false,
  ...over,
});

describe("parseBooks", () => {
  it("acepta libros válidos", () => {
    expect(parseBooks([book()])).toEqual([book()]);
  });

  it("rechaza lo que no es una lista", () => {
    expect(() => parseBooks({})).toThrow(/lista/);
  });

  it.each([
    ["slug repetido", [book(), book()], /slug/],
    ["slug inválido", [book({ slug: "Con Espacios" })], /slug/],
    ["título vacío", [book({ title: " " })], /title/],
    ["nota fuera de rango", [book({ rating: 11 })], /rating/],
    ["año fuera de rango", [book({ finished_year: 1800 })], /finished_year/],
    ["estado desconocido", [book({ status: "x" as Book["status"] })], /status/],
    ["pendiente con nota", [book({ status: "pendiente", finished_year: null })], /pendiente/],
    ["joyita sin nota", [book({ rating: null, gem: true })], /joyita/],
  ])("rechaza %s", (_name, data, error) => {
    expect(() => parseBooks(data)).toThrow(error);
  });

  it("nombra al libro con problemas", () => {
    expect(() => parseBooks([book({ rating: 0 })])).toThrow(/rayuela/);
  });
});

describe("sortBooks", () => {
  it("pone primero los puntuados, por año descendente, y respeta el orden del archivo", () => {
    const sorted = sortBooks([
      book({ slug: "sin-nota", rating: null, finished_year: 2030 }),
      book({ slug: "sin-anio", finished_year: null }),
      book({ slug: "viejo", finished_year: 2010 }),
      book({ slug: "nuevo-a" }),
      book({ slug: "nuevo-b" }),
    ]);
    expect(sorted.map((b) => b.slug)).toEqual(["nuevo-a", "nuevo-b", "viejo", "sin-anio", "sin-nota"]);
  });
});

describe("computeStats", () => {
  it("calcula totales, promedio, años e histograma", () => {
    const stats = computeStats([
      book({ slug: "a", rating: 8, gem: true }),
      book({ slug: "b", rating: 9, finished_year: 2023 }),
      book({ slug: "c", rating: 9, status: "leyendo", finished_year: null }),
      book({ slug: "d", rating: null, status: "pendiente", finished_year: null }),
    ]);
    expect(stats).toMatchObject({ total: 4, leidos: 2, leyendo: 1, pendientes: 1, joyitas: 1, promedio: 8.7 });
    expect(stats.porAnio).toEqual([
      { anio: 2024, cantidad: 1 },
      { anio: 2023, cantidad: 1 },
    ]);
    expect(stats.histograma).toHaveLength(10);
    expect(stats.histograma[8]).toEqual({ rating: 9, cantidad: 2 });
    expect(stats.histograma[0]).toEqual({ rating: 1, cantidad: 0 });
  });

  it("sin notas el promedio es null", () => {
    expect(computeStats([]).promedio).toBeNull();
  });
});
