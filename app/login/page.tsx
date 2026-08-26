"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="mx-auto max-w-xs space-y-4 py-16">
      <h1 className="text-lg font-semibold">Entrar</h1>
      <input
        type="password"
        name="password"
        autoFocus
        required
        placeholder="Contraseña"
        className="w-full rounded-sm border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-accent px-3 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
