export const STATUSES = ["leido", "leyendo", "pendiente"] as const;
export type Status = (typeof STATUSES)[number];

/** Los datos crudos del formulario, todos como texto. */
export type BookInput = {
  title: string;
  author: string;
  isbn: string;
  rating: string;
  review: string;
  status: string;
  finishedYear: string;
  gem: string;
};

/** Los datos ya validados y convertidos, listos para la base. */
export type BookValues = {
  title: string;
  author: string;
  isbn: string | null;
  rating: number | null;
  review: string | null;
  status: Status;
  finishedYear: number | null;
  gem: boolean;
};

export type ValidationResult =
  | { ok: true; value: BookValues }
  | { ok: false; errors: Record<string, string> };

export function validateBook(input: BookInput): ValidationResult {
  const errors: Record<string, string> = {};

  const title = input.title.trim();
  if (!title) errors.title = "El título es obligatorio.";

  const author = input.author.trim();
  if (!author) errors.author = "El autor es obligatorio.";

  const status = input.status.trim();
  if (!STATUSES.includes(status as Status)) {
    errors.status = "Estado desconocido.";
  }

  // ISBN: opcional, pero si viene debe tener 10 o 13 dígitos (el último puede ser X).
  let isbn: string | null = null;
  const rawIsbn = input.isbn.replace(/[\s-]/g, "");
  if (rawIsbn) {
    if (/^(\d{9}[\dX]|\d{13})$/i.test(rawIsbn)) {
      isbn = rawIsbn.toUpperCase();
    } else {
      errors.isbn = "El ISBN debe tener 10 o 13 dígitos.";
    }
  }

  // Nota: opcional, entero de 1 a 10.
  let rating: number | null = null;
  const rawRating = input.rating.trim();
  if (rawRating) {
    if (!/^\d+$/.test(rawRating)) {
      errors.rating = "La nota debe ser un número entero.";
    } else {
      const n = Number(rawRating);
      if (n < 1 || n > 10) {
        errors.rating = "La nota debe estar entre 1 y 10.";
      } else {
        rating = n;
      }
    }
  }

  // Año de lectura: opcional, cuatro dígitos dentro de un rango razonable.
  let finishedYear: number | null = null;
  const rawYear = input.finishedYear.trim();
  if (rawYear) {
    if (!/^\d{4}$/.test(rawYear)) {
      errors.finishedYear = "El año debe tener cuatro dígitos.";
    } else {
      const y = Number(rawYear);
      if (y < 1900 || y > 2200) {
        errors.finishedYear = "El año está fuera de rango.";
      } else {
        finishedYear = y;
      }
    }
  }

  // La joyita distingue entre libros ya puntuados: sin nota no tiene sentido.
  const gem = input.gem.trim() !== "";
  if (gem && rating === null) {
    errors.gem = "Para marcar la joyita el libro necesita una nota.";
  }

  // Un libro pendiente todavía no se leyó: no puede tener nota ni fecha de fin.
  if (status === "pendiente") {
    if (rating !== null) {
      errors.rating = "Un libro pendiente no puede tener nota.";
    }
    if (finishedYear !== null) {
      errors.finishedYear = "Un libro pendiente no puede tener año de lectura.";
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const review = input.review.trim();

  return {
    ok: true,
    value: {
      title,
      author,
      isbn,
      rating,
      review: review || null,
      status: status as Status,
      finishedYear,
      gem,
    },
  };
}
