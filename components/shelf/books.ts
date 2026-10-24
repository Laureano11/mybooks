import type { Status } from "@/lib/validation";

/** Lo que el estante necesita de cada libro de la base. */
export type ShelfBook = {
  id: number;
  slug: string;
  title: string;
  author: string;
  rating: number | null;
  review: string | null;
  status: Status;
  finishedYear: number | null;
  gem: boolean;
};

/** El libro ya vestido para la escena 3D: colores y medidas. */
export type Book3D = ShelfBook & {
  spineColor: string;
  spineTextColor: string;
  coverColor: string;
  coverTextColor: string;
  /** Unidades del mundo. La altura apoya en el estante; el grosor es el lomo. */
  width: number;
  height: number;
  spineThickness: number;
};

// Combinaciones de lomo y tapa tomadas del estante de referencia.
const PALETTE = [
  { spine: "#0d0d0d", spineText: "#f3ecd8", cover: "#0d0d0d", coverText: "#f3ecd8" },
  { spine: "#274034", spineText: "#f3ecd8", cover: "#fbf6e8", coverText: "#1a1a1a" },
  { spine: "#6d1f1f", spineText: "#f3ecd8", cover: "#f5ede0", coverText: "#6d1f1f" },
  { spine: "#1c2a44", spineText: "#cf9b3a", cover: "#f3ecd8", coverText: "#1c2a44" },
  { spine: "#a8501f", spineText: "#1a1a1a", cover: "#fbf6e8", coverText: "#1a1a1a" },
  { spine: "#3a1818", spineText: "#cf9b3a", cover: "#3a1818", coverText: "#cf9b3a" },
  { spine: "#cdb55b", spineText: "#1a1a1a", cover: "#1a1a1a", coverText: "#f3ecd8" },
  { spine: "#3f444a", spineText: "#f3ecd8", cover: "#3f444a", coverText: "#f3ecd8" },
  { spine: "#7a3a2a", spineText: "#f3ecd8", cover: "#7a3a2a", coverText: "#f3ecd8" },
  { spine: "#f0e7d0", spineText: "#1a1a1a", cover: "#f0e7d0", coverText: "#1a1a1a" },
];

/** Hash chico y estable: el mismo libro siempre sale con el mismo color y tamaño. */
function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dress(book: ShelfBook): Book3D {
  const h = hash(book.slug);
  const colors = PALETTE[h % PALETTE.length];
  // Cada medida usa otra porción del hash para que no varíen juntas.
  const pick = (shift: number, min: number, max: number) =>
    min + (((h >>> shift) & 0xff) / 255) * (max - min);
  return {
    ...book,
    spineColor: colors.spine,
    spineTextColor: colors.spineText,
    coverColor: colors.cover,
    coverTextColor: colors.coverText,
    width: pick(4, 1.85, 2.05),
    height: pick(12, 2.85, 3.3),
    spineThickness: pick(20, 0.3, 0.58),
  };
}
