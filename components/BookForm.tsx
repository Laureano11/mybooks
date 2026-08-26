"use client";

import { useActionState, useState } from "react";
import { saveBook, type FormState } from "@/app/admin/actions";
import type { Book } from "@/lib/db";

const FIELD =
  "w-full rounded-sm border border-border bg-surface px-3 py-2 outline-none focus:border-accent";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-muted">{label}</span>
      {children}
      {error && <span className="block text-sm text-red-400">{error}</span>}
    </label>
  );
}

export function BookForm({ book }: { book?: Book }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    saveBook,
    null,
  );
  const errors = state?.errors ?? {};
  // Tras un error de validación se repuebla con lo enviado, para no perder lo escrito.
  const sent = state?.values;
  // Un libro pendiente no lleva nota ni fecha: se ocultan esos campos.
  const [status, setStatus] = useState(sent?.status ?? book?.status ?? "leido");

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {book && <input type="hidden" name="id" value={book.id} />}

      <Field label="Título" error={errors.title}>
        <input
          name="title"
          required
          defaultValue={sent?.title ?? book?.title ?? ""}
          className={FIELD}
        />
      </Field>

      <Field label="Autor" error={errors.author}>
        <input
          name="author"
          required
          defaultValue={sent?.author ?? book?.author ?? ""}
          className={FIELD}
        />
      </Field>

      <Field label="ISBN (opcional, trae la portada)" error={errors.isbn}>
        <input
          name="isbn"
          defaultValue={sent?.isbn ?? book?.isbn ?? ""}
          placeholder="978-84-376-0494-7"
          className={FIELD}
        />
      </Field>

      <Field label="Estado" error={errors.status}>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Book["status"])}
          className={FIELD}
        >
          <option value="leido">Leído</option>
          <option value="leyendo">Leyendo</option>
          <option value="pendiente">Pendiente</option>
        </select>
      </Field>

      {status !== "pendiente" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nota (1-10)" error={errors.rating}>
            <input
              type="number"
              name="rating"
              min={1}
              max={10}
              step={1}
              defaultValue={sent?.rating ?? book?.rating ?? ""}
              className={FIELD}
            />
          </Field>

          <Field label="Año de lectura" error={errors.finishedYear}>
            <input
              type="number"
              name="finishedYear"
              min={1900}
              max={2200}
              step={1}
              inputMode="numeric"
              placeholder="2026"
              defaultValue={sent?.finishedYear ?? book?.finished_year ?? ""}
              className={FIELD}
            />
          </Field>
        </div>
      )}

      {status !== "pendiente" && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="gem"
            defaultChecked={sent ? sent.gem !== "" : (book?.gem ?? false)}
            className="size-4 accent-[var(--accent)]"
          />
          <span className="text-sm">
            💎 Joyita <span className="text-muted">— de los muy buenos</span>
          </span>
        </label>
      )}
      {errors.gem && <p className="text-sm text-red-400">{errors.gem}</p>}

      <Field label="Reseña">
        <textarea
          name="review"
          rows={10}
          defaultValue={sent?.review ?? book?.review ?? ""}
          className={`${FIELD} font-serif leading-relaxed`}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-accent px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
