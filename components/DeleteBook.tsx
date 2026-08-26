"use client";

import { useState } from "react";
import { removeBook } from "@/app/admin/actions";

/**
 * Confirmación en dos pasos. Se evita `confirm()` del navegador porque
 * bloquea la página y no combina con el resto de la interfaz.
 */
export function DeleteBook({ id, title }: { id: number; title: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-muted hover:text-red-400"
        aria-label={`Eliminar ${title}`}
      >
        Eliminar
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <form action={removeBook}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="text-sm font-medium text-red-400">
          Confirmar
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm text-muted hover:text-foreground"
      >
        Cancelar
      </button>
    </span>
  );
}
