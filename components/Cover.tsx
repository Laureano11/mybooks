"use client";

import { useState } from "react";
import { coverUrl } from "@/lib/cover";

type Props = {
  isbn: string | null;
  title: string;
  author: string;
  size?: "M" | "L";
  gem?: boolean;
};

/**
 * Portada de Open Library. Si no hay ISBN, o la imagen no existe,
 * cae en un recuadro tipográfico — un estado previsto, no un error.
 */
export function Cover({ isbn, title, author, size = "L", gem = false }: Props) {
  const [failed, setFailed] = useState(false);
  const url = coverUrl(isbn, size);
  // La joyita se marca con borde dorado y un 💎 en la esquina.
  const marco = gem ? "border-accent" : "border-border";

  if (!url || failed) {
    return (
      <div className="relative">
        <div
          className={`flex aspect-[2/3] flex-col justify-between rounded-sm border bg-surface p-3 ${marco}`}
        >
          <span className="font-serif text-sm leading-snug text-foreground">
            {title}
          </span>
          <span className="text-xs text-muted">{author}</span>
        </div>
        {gem && <GemMark />}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Open Library no está en next.config.images, y no necesitamos optimización acá. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`Portada de ${title}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`aspect-[2/3] w-full rounded-sm border object-cover ${marco}`}
      />
      {gem && <GemMark />}
    </div>
  );
}

function GemMark() {
  return (
    <span
      title="Joyita"
      className="absolute right-1 top-1 rounded-sm bg-background/85 px-1 py-0.5 text-sm leading-none"
    >
      💎
    </span>
  );
}
