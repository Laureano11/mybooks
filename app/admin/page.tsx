import Link from "next/link";
import { getBooks } from "@/lib/db";
import { logoutAction } from "./actions";
import { DeleteBook } from "@/components/DeleteBook";

export const metadata = { title: "Admin — Lauri Books" };

// Lee la base en cada request: si no, el build congelaría la lista.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const books = await getBooks();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Mis libros ({books.length})</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/nuevo"
            className="rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-background"
          >
            Agregar libro
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-muted hover:text-foreground">
              Salir
            </button>
          </form>
        </div>
      </div>

      {books.length === 0 ? (
        <p className="py-12 text-center text-muted">Todavía no cargaste nada.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {books.map((book) => (
            <li
              key={book.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{book.title}</span>
                <span className="block truncate text-sm text-muted">
                  {book.author}
                </span>
              </span>
              <span className="w-10 text-right text-sm tabular-nums text-muted">
                {book.rating ?? "—"}
              </span>
              <Link
                href={`/admin/libro/${book.id}`}
                className="text-sm text-muted hover:text-foreground"
              >
                Editar
              </Link>
              <DeleteBook id={book.id} title={book.title} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
