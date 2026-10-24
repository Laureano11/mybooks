"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { dress, type ShelfBook } from "./books";
import type { HardbackScene, SceneState } from "./scene";
import "./shelf.css";

type Props = {
  books: ShelfBook[];
  filters: { href: string; label: string; active: boolean }[];
};

const TITLE: { text: string; italic: boolean }[] = [
  { text: "Estantería", italic: false },
  { text: " de Lauri", italic: true },
];
const TITLE_LENGTH = TITLE.reduce((n, part) => n + part.text.length, 0);

const STATUS_LABEL: Record<string, string> = {
  leido: "Leído",
  leyendo: "Leyendo",
  pendiente: "Pendiente",
};

// Las texturas en canvas usan estas fuentes: tienen que estar cargadas antes de pintar los libros.
const CANVAS_FONTS = [
  '600 72px "Playfair Display"',
  '700 92px "Playfair Display"',
  'italic 500 40px "Playfair Display"',
];

function TitleLetters() {
  let index = 0;
  return TITLE.map((part) =>
    Array.from(part.text).map((char) => {
      // Las letras suben desde el centro hacia afuera.
      const distance = Math.abs(index - (TITLE_LENGTH - 1) / 2);
      const key = `${index++}`;
      return (
        <span
          key={key}
          className="hb-letter"
          data-italic={part.italic}
          style={{ "--d": distance } as React.CSSProperties}
        >
          {char}
        </span>
      );
    }),
  );
}

/** Estante 3D: cada libro se pasa como en un estante y al abrirlo muestra la nota y la reseña. */
export function Shelf({ books: rawBooks, filters }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HardbackScene | null>(null);
  const books = useMemo(() => rawBooks.map(dress), [rawBooks]);
  const [state, setState] = useState<SceneState>(() => ({
    mode: "entering",
    centerIndex: Math.floor(books.length / 2),
    selectedIndex: -1,
    panelVisible: false,
    pointer: false,
  }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all(CANVAS_FONTS.map((f) => document.fonts.load(f).catch(() => [])));
      const { HardbackScene } = await import("./scene");
      if (cancelled || !canvasRef.current || !rootRef.current) return;
      sceneRef.current = new HardbackScene({
        container: canvasRef.current,
        inputElement: rootRef.current,
        books,
        onChange: setState,
      });
    })();
    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [books]);

  const current = books[state.centerIndex];
  const detail = state.selectedIndex >= 0 ? books[state.selectedIndex] : current;
  const overlayVisible = state.mode === "browsing" || state.mode === "entering";
  const leidos = books.filter((b) => b.status === "leido").length;

  return (
    <section
      ref={rootRef}
      className="hardback-root"
      data-pointer={state.pointer}
      aria-label="Estante 3D de libros"
    >
      <div className="hb-bg" style={{ backgroundImage: "url(/shelf/books-bg.png)" }} />
      <div className="hb-vignette" />
      <div ref={canvasRef} className="hb-canvas" />

      <div className="hb-overlay" data-visible={overlayVisible}>
        <div className="hb-overlay-inner">
          <h1 className="hb-title">
            <TitleLetters />
          </h1>
          <p className="hb-subtitle">
            {leidos === 1 ? "Un libro leído" : `${leidos} libros leídos`}, puntuados del 1 al 10 —
            sacá uno del estante.
          </p>
          <nav className="hb-filters" data-no-drag aria-label="Filtrar libros">
            {filters.map((f) => (
              <Link key={f.href} href={f.href} aria-current={f.active ? "page" : undefined}>
                {f.label}
              </Link>
            ))}
          </nav>
          <div className="hb-current" aria-live="polite">
            <span className="hb-rule" />
            <span>{current.title}</span>
            <span className="hb-dot">·</span>
            <span className="hb-current-author">{current.author}</span>
            {current.rating !== null && (
              <>
                <span className="hb-dot">·</span>
                <span>{current.rating}/10</span>
              </>
            )}
            <span className="hb-rule" />
          </div>
        </div>
      </div>

      <aside
        className="hb-panel"
        data-open={state.panelVisible}
        data-no-drag
        aria-label={`${detail.title} — reseña`}
      >
        <div className="hb-panel-content">
          <div className="hb-panel-top">
            <div className="hb-panel-eyebrow">
              {STATUS_LABEL[detail.status]}
              {detail.finishedYear && ` · ${detail.finishedYear}`}
              {detail.gem && " · 💎 Joyita"}
            </div>
            <button
              type="button"
              className="hb-close"
              onClick={() => sceneRef.current?.close()}
              aria-label="Cerrar libro"
            >
              <span>Cerrar</span>
              <span aria-hidden className="hb-close-x">
                ×
              </span>
            </button>
          </div>
          <h2 className="hb-panel-title">{detail.title}</h2>
          <div className="hb-panel-author">de {detail.author}</div>
          <div className="hb-panel-rating">
            {detail.rating !== null ? (
              <>
                <strong>{detail.rating}</strong>
                <span>/ 10 · mi nota</span>
              </>
            ) : (
              <span>Sin nota todavía</span>
            )}
          </div>
          {detail.review ? (
            <p className="hb-panel-synopsis hb-panel-review">{detail.review}</p>
          ) : (
            <p className="hb-panel-synopsis hb-panel-empty">Sin reseña todavía.</p>
          )}
          <div className="hb-esc">esc para cerrar</div>
        </div>
      </aside>
    </section>
  );
}
