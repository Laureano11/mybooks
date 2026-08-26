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
  finishedAt: string;
};

/** Los datos ya validados y convertidos, listos para la base. */
export type BookValues = {
  title: string;
  author: string;
  isbn: string | null;
  rating: number | null;
  review: string | null;
  status: Status;
  finishedAt: string | null;
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

  // Fecha: opcional, formato ISO.
  let finishedAt: string | null = null;
  const rawDate = input.finishedAt.trim();
  if (rawDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || isNaN(Date.parse(rawDate))) {
      errors.finishedAt = "La fecha debe tener el formato AAAA-MM-DD.";
    } else {
      finishedAt = rawDate;
    }
  }

  // Un libro pendiente todavía no se leyó: no puede tener nota ni fecha de fin.
  if (status === "pendiente") {
    if (rating !== null) {
      errors.rating = "Un libro pendiente no puede tener nota.";
    }
    if (finishedAt !== null) {
      errors.finishedAt = "Un libro pendiente no puede tener fecha de lectura.";
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
      finishedAt,
    },
  };
}
