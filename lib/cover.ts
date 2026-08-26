/**
 * URL de la portada en Open Library. `default=false` hace que la API
 * devuelva 404 en vez de una imagen genérica, para poder mostrar el fallback.
 */
export function coverUrl(
  isbn: string | null | undefined,
  size: "S" | "M" | "L" = "L",
): string | null {
  if (!isbn) return null;
  const clean = isbn.replace(/[\s-]/g, "");
  if (!clean) return null;
  return `https://covers.openlibrary.org/b/isbn/${clean}-${size}.jpg?default=false`;
}
