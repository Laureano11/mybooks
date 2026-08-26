"use client";

import { useState } from "react";
import { coverUrl } from "@/lib/cover";

type Props = {
  isbn: string | null;
  title: string;
  author: string;
  size?: "M" | "L";
};

/**
 * Portada de Open Library. Si no hay ISBN, o la imagen no existe,
 * cae en un recuadro tipográfico — un estado previsto, no un error.
 */
export function Cover({ isbn, title, author, size = "L" }: Props) {
  const [failed, setFailed] = useState(false);
  const url = coverUrl(isbn, size);

  if (!url || failed) {
    return (
      <div className="flex aspect-[2/3] flex-col justify-between rounded-sm border border-border bg-surface p-3">
        <span className="font-serif text-sm leading-snug text-foreground">
          {title}
        </span>
        <span className="text-xs text-muted">{author}</span>
      </div>
    );
  }

  return (
    // Open Library no está en next.config.images, y no necesitamos optimización acá.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Portada de ${title}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-[2/3] w-full rounded-sm border border-border object-cover"
    />
  );
}
