import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("pasa a minúsculas y une con guiones", () => {
    expect(slugify("La Ciudad y los Perros")).toBe("la-ciudad-y-los-perros");
  });

  it("quita acentos y diéresis", () => {
    expect(slugify("Cien años de soledad")).toBe("cien-anos-de-soledad");
    expect(slugify("Der Prozeß über Müller")).toBe("der-prozess-uber-muller");
  });

  it("elimina signos de puntuación", () => {
    expect(slugify("¿Quién mató a Palomino Molero?")).toBe(
      "quien-mato-a-palomino-molero",
    );
  });

  it("colapsa espacios múltiples y recorta los extremos", () => {
    expect(slugify("  Rayuela   ")).toBe("rayuela");
  });

  it("devuelve 'libro' cuando el título no deja caracteres usables", () => {
    expect(slugify("¿?¡!")).toBe("libro");
  });
});

describe("uniqueSlug", () => {
  it("devuelve el slug base si está libre", () => {
    expect(uniqueSlug("Rayuela", [])).toBe("rayuela");
  });

  it("agrega sufijo numérico ante una colisión", () => {
    expect(uniqueSlug("Rayuela", ["rayuela"])).toBe("rayuela-2");
  });

  it("incrementa el sufijo hasta encontrar uno libre", () => {
    expect(uniqueSlug("Rayuela", ["rayuela", "rayuela-2"])).toBe("rayuela-3");
  });
});
