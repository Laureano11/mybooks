import { describe, it, expect } from "vitest";
import { coverUrl } from "./cover";

describe("coverUrl", () => {
  it("arma la URL de Open Library a partir del ISBN", () => {
    expect(coverUrl("9788437604947")).toBe(
      "https://covers.openlibrary.org/b/isbn/9788437604947-L.jpg?default=false",
    );
  });

  it("acepta un tamaño distinto", () => {
    expect(coverUrl("9788437604947", "M")).toContain("-M.jpg");
  });

  it("devuelve null sin ISBN", () => {
    expect(coverUrl(null)).toBeNull();
    expect(coverUrl("")).toBeNull();
  });

  it("ignora guiones y espacios en el ISBN", () => {
    expect(coverUrl("978-84-3760-494-7")).toContain("9788437604947-L.jpg");
  });
});
