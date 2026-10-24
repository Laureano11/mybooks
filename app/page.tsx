import Link from "next/link";
import { getBooks, type BookFilter } from "@/lib/db";
import { Shelf } from "@/components/shelf/Shelf";
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

  const filters = FILTERS.map((f) => ({
    href: f.value ? `/?estado=${f.value}` : "/",
    label: f.label,
    active: (estado ?? "") === f.value,
  }));

  if (books.length === 0) {
    return (
      <>
        <div className="mb-8 flex flex-wrap gap-x-5 gap-y-2">
          {filters.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`text-sm transition-colors ${
                f.active
                  ? "text-foreground underline decoration-accent underline-offset-8"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <p className="py-16 text-center text-muted">
          {estado === "joyitas"
            ? "Todavía no marcaste ninguna joyita."
            : "Todavía no hay libros acá."}
        </p>
      </>
    );
  }

  // El key reinicia la escena (y su animación de entrada) al cambiar de filtro.
  return (
    <Shelf
      key={estado ?? ""}
      filters={filters}
      books={books.map((b) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        author: b.author,
        rating: b.rating,
        review: b.review,
        status: b.status,
        finishedYear: b.finished_year,
        gem: b.gem,
      }))}
    />
  );
}
