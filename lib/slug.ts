/** Convierte un título en un slug apto para URL. */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/ß/g, "ss")
    .replace(/[\u0300-\u036f]/g, "") // quita los acentos que dejó NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "libro";
}

/** Devuelve un slug libre, agregando un sufijo numérico ante colisiones. */
export function uniqueSlug(title: string, taken: string[]): string {
  const base = slugify(title);
  if (!taken.includes(base)) return base;

  let n = 2;
  while (taken.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
