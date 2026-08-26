import { describe, it, expect } from "vitest";
import { validateBook } from "./validation";

const base = {
  title: "Rayuela",
  author: "Julio Cortázar",
  isbn: "",
  rating: "8",
  review: "Una reseña.",
  status: "leido",
  finishedYear: "2026",
  gem: "",
};

function build(overrides: Partial<typeof base> = {}) {
  return { ...base, ...overrides };
}

describe("validateBook", () => {
  it("acepta un libro leído completo", () => {
    const result = validateBook(build());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rating).toBe(8);
      expect(result.value.finishedYear).toBe(2026);
    }
  });

  it("exige título", () => {
    const result = validateBook(build({ title: "   " }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.title).toBeDefined();
  });

  it("exige autor", () => {
    const result = validateBook(build({ author: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.author).toBeDefined();
  });

  it("rechaza una nota fuera del rango 1-10", () => {
    expect(validateBook(build({ rating: "0" })).ok).toBe(false);
    expect(validateBook(build({ rating: "11" })).ok).toBe(false);
    expect(validateBook(build({ rating: "-3" })).ok).toBe(false);
  });

  it("rechaza una nota no entera", () => {
    expect(validateBook(build({ rating: "7.5" })).ok).toBe(false);
    expect(validateBook(build({ rating: "ocho" })).ok).toBe(false);
  });

  it("acepta los extremos del rango", () => {
    expect(validateBook(build({ rating: "1" })).ok).toBe(true);
    expect(validateBook(build({ rating: "10" })).ok).toBe(true);
  });

  it("rechaza nota en un libro pendiente", () => {
    const result = validateBook(
      build({ status: "pendiente", rating: "8", finishedYear: "" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.rating).toBeDefined();
  });

  it("rechaza fecha de lectura en un libro pendiente", () => {
    const result = validateBook(
      build({ status: "pendiente", rating: "", finishedYear: "2026" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.finishedYear).toBeDefined();
  });

  it("acepta un libro pendiente sin nota ni fecha", () => {
    const result = validateBook(
      build({ status: "pendiente", rating: "", finishedYear: "", review: "" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rating).toBeNull();
      expect(result.value.finishedYear).toBeNull();
    }
  });

  it("acepta un libro leído sin nota todavía", () => {
    const result = validateBook(build({ rating: "" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.rating).toBeNull();
  });

  it("rechaza un estado desconocido", () => {
    const result = validateBook(build({ status: "abandonado" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.status).toBeDefined();
  });

  it("normaliza el ISBN quitando guiones y espacios", () => {
    const result = validateBook(build({ isbn: "978-84-376-0494-7" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.isbn).toBe("9788437604947");
  });

  it("rechaza un ISBN con largo inválido", () => {
    const result = validateBook(build({ isbn: "12345" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.isbn).toBeDefined();
  });

  it("deja el ISBN nulo cuando viene vacío", () => {
    const result = validateBook(build({ isbn: "  " }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.isbn).toBeNull();
  });

  it("rechaza un año con formato inválido", () => {
    expect(validateBook(build({ finishedYear: "14/03/2026" })).ok).toBe(false);
    expect(validateBook(build({ finishedYear: "dos mil" })).ok).toBe(false);
    expect(validateBook(build({ finishedYear: "26" })).ok).toBe(false);
  });

  it("rechaza un año fuera de rango razonable", () => {
    expect(validateBook(build({ finishedYear: "1200" })).ok).toBe(false);
    expect(validateBook(build({ finishedYear: "3000" })).ok).toBe(false);
  });

  it("acepta la joyita marcada", () => {
    const result = validateBook(build({ gem: "on" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.gem).toBe(true);
  });

  it("deja la joyita en false cuando la casilla viene vacía", () => {
    const result = validateBook(build({ gem: "" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.gem).toBe(false);
  });

  it("rechaza la joyita en un libro sin nota", () => {
    // La joyita es una distinción entre libros ya leídos y puntuados.
    const result = validateBook(build({ rating: "", gem: "on" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.gem).toBeDefined();
  });

  it("recorta los espacios de título y autor", () => {
    const result = validateBook(build({ title: "  Rayuela  " }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.title).toBe("Rayuela");
  });
});
