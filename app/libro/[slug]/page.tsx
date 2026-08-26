import { notFound } from "next/navigation";
import { getBookBySlug } from "@/lib/db";
import { Cover } from "@/components/Cover";
import { RatingBadge } from "@/components/RatingBadge";

const STATUS_LABEL: Record<string, string> = {
  leido: "Leído",
  leyendo: "Leyendo",
  pendiente: "Pendiente",
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const book = await getBookBySlug((await params).slug);
  if (!book) return { title: "Libro no encontrado — mybooks" };
  return { title: `${book.title} — mybooks` };
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const book = await getBookBySlug((await params).slug);
  if (!book) notFound();

  return (
    <article className="grid gap-8 sm:grid-cols-[200px_1fr]">
      <div>
        <Cover isbn={book.isbn} title={book.title} author={book.author} />
      </div>

      <div>
        <h1 className="font-serif text-3xl leading-tight">{book.title}</h1>
        <p className="mt-1 text-lg text-muted">{book.author}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <RatingBadge rating={book.rating} large />
          <span className="text-sm uppercase tracking-wide text-muted">
            {STATUS_LABEL[book.status]}
          </span>
          {book.finished_at && (
            <span className="text-sm text-muted">
              Terminado el {formatDate(book.finished_at)}
            </span>
          )}
        </div>

        {book.review ? (
          <div className="mt-7 whitespace-pre-wrap font-serif text-lg leading-relaxed">
            {book.review}
          </div>
        ) : (
          <p className="mt-7 text-muted">Sin reseña todavía.</p>
        )}
      </div>
    </article>
  );
}
