import Link from "next/link";
import { getBooks, type BookFilter } from "@/lib/db";
import { BookCard } from "@/components/BookCard";
import { STATUSES, type Status } from "@/lib/validation";

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "joyitas", label: "Joyitas" },
  { value: "leido", label: "Leídos" },
  { value: "leyendo", label: "Leyendo" },
  { value: "pendiente", label: "Pendientes" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const filter: BookFilter | undefined =
    estado === "joyitas"
      ? "joyitas"
      : STATUSES.includes(estado as Status)
        ? (estado as Status)
        : undefined;
  const books = await getBooks(filter);

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-x-5 gap-y-2">
        {FILTERS.map((f) => {
          const active = (estado ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/?estado=${f.value}` : "/"}
              className={`text-sm transition-colors ${
                active
                  ? "text-foreground underline decoration-accent underline-offset-8"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {books.length === 0 ? (
        <p className="py-16 text-center text-muted">
          {estado === "joyitas"
            ? "Todavía no marcaste ninguna joyita."
            : "Todavía no hay libros acá."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </>
  );
}
