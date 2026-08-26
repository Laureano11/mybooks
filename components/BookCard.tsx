import Link from "next/link";
import { Cover } from "./Cover";
import { RatingBadge } from "./RatingBadge";
import type { Book } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
  leyendo: "Leyendo",
  pendiente: "Pendiente",
};

export function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/libro/${book.slug}`} className="group block">
      <div className="transition-opacity group-hover:opacity-80">
        <Cover isbn={book.isbn} title={book.title} author={book.author} />
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <h2 className="truncate text-sm font-medium" title={book.title}>
          {book.title}
        </h2>
        <RatingBadge rating={book.rating} />
      </div>
      <p className="truncate text-xs text-muted" title={book.author}>
        {book.author}
      </p>
      {STATUS_LABEL[book.status] && (
        <p className="mt-1 text-xs uppercase tracking-wide text-muted">
          {STATUS_LABEL[book.status]}
        </p>
      )}
    </Link>
  );
}
