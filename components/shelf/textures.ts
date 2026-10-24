import * as THREE from "three";
import type { Book3D as Book } from "./books";

export const SERIF = '"Playfair Display", "Cormorant Garamond", Georgia, "Times New Roman", serif';
export const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const INK = "#3a2a14";

function canvas(width: number, height: number) {
  const el = document.createElement("canvas");
  el.width = width;
  el.height = height;
  return [el, el.getContext("2d") as CanvasRenderingContext2D] as const;
}

function toTexture(el: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(el);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Largest font size (stepping down) whose wrapped text fits within maxLines. */
function fitWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: (size: number) => string,
  sizes: { from: number; to: number; step: number },
  maxWidth: number,
  maxLines: number,
) {
  for (let size = sizes.from; size >= sizes.to; size -= sizes.step) {
    ctx.font = font(size);
    const lines = wrapLines(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  ctx.font = font(sizes.to);
  return { size: sizes.to, lines: wrapLines(ctx, text, maxWidth) };
}

function spineTexture(book: Book) {
  const [el, ctx] = canvas(200, 1024);
  ctx.fillStyle = book.spineColor;
  ctx.fillRect(0, 0, 200, 1024);
  // Headband / tailband rules.
  ctx.fillStyle = `${book.spineTextColor}26`;
  ctx.fillRect(0, 26, 200, 2);
  ctx.fillRect(0, 996, 200, 2);

  ctx.save();
  ctx.translate(100, 512);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = book.spineTextColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const title = book.title.toUpperCase();
  let size = 72;
  for (; size > 32; size -= 2) {
    ctx.font = `600 ${size}px ${SERIF}`;
    if (ctx.measureText(title).width <= 824) break;
  }
  ctx.font = `600 ${size}px ${SERIF}`;
  ctx.fillText(title, 0, -10);
  const authorSize = Math.max(18, Math.min(28, size * 0.42));
  ctx.font = `500 ${authorSize}px ${SANS}`;
  ctx.fillText(book.author.toUpperCase(), 0, size * 0.7 + authorSize * 0.6);
  ctx.restore();
  return toTexture(el);
}

function coverTexture(book: Book) {
  const [el, ctx] = canvas(640, 960);
  ctx.fillStyle = book.coverColor;
  ctx.fillRect(0, 0, 640, 960);
  ctx.strokeStyle = `${book.coverTextColor}33`;
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, 584, 904);

  ctx.fillStyle = book.coverTextColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 22px ${SANS}`;
  ctx.globalAlpha = 0.7;
  ctx.fillText(book.gem ? "LAURI BOOKS  ·  JOYITA" : "LAURI BOOKS", 320, 86);
  ctx.globalAlpha = 1;

  const start = book.title.length > 18 ? 72 : 92;
  const { size, lines } = fitWrapped(ctx, book.title, (s) => `700 ${s}px ${SERIF}`, { from: start, to: 36, step: 4 }, 510, 3);
  ctx.font = `700 ${size}px ${SERIF}`;
  const lineHeight = size * 1.08;
  const top = 480 - (lineHeight * lines.length) / 2 + lineHeight / 2;
  lines.forEach((line, i) => ctx.fillText(line, 320, top + i * lineHeight));

  ctx.strokeStyle = book.coverTextColor;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(260, 790);
  ctx.lineTo(380, 790);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.font = `500 26px ${SANS}`;
  ctx.fillText(book.author.toUpperCase(), 320, 830);
  return toTexture(el);
}

/** La primera página muestra la nota: es lo primero que se ve al abrir el libro. */
function firstPageTexture(book: Book) {
  const [el, ctx] = canvas(640, 960);
  ctx.fillStyle = "#f7efd9";
  ctx.fillRect(0, 0, 640, 960);
  // Paper grain.
  ctx.fillStyle = "rgba(20, 14, 4, 0.025)";
  for (let i = 0; i < 280; i++) ctx.fillRect(Math.random() * 640, Math.random() * 960, 1, 1);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK;
  ctx.font = `500 18px ${SANS}`;
  ctx.globalAlpha = 0.7;
  ctx.fillText("MI NOTA", 320, 260);
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#1a1208";
  if (book.rating === null) {
    ctx.font = `italic 500 56px ${SERIF}`;
    ctx.fillText(book.status === "leyendo" ? "Leyendo…" : "Sin nota", 320, 440);
  } else {
    ctx.font = `700 240px ${SERIF}`;
    ctx.fillText(String(book.rating), 320, 430);
    ctx.font = `italic 500 44px ${SERIF}`;
    ctx.globalAlpha = 0.6;
    ctx.fillText("de 10", 320, 590);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = INK;
  ctx.font = `500 60px ${SERIF}`;
  ctx.fillText("—", 320, 680);
  if (book.finishedYear) {
    ctx.font = `italic 500 30px ${SERIF}`;
    ctx.fillText(`Leído en ${book.finishedYear}`, 320, 740);
  }

  ctx.font = `500 18px ${SANS}`;
  ctx.globalAlpha = 0.75;
  ctx.fillText(`${book.title.toUpperCase()}  ·  ${book.author.toUpperCase()}`, 320, 864);
  ctx.font = `500 16px ${SANS}`;
  ctx.globalAlpha = 0.5;
  ctx.fillText("· 1 ·", 320, 904);
  ctx.globalAlpha = 1;
  return toTexture(el);
}

function insideCoverTexture(book: Book) {
  const [el, ctx] = canvas(640, 960);
  ctx.fillStyle = "#f3ead2";
  ctx.fillRect(0, 0, 640, 960);
  ctx.strokeStyle = "rgba(58, 42, 20, 0.32)";
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, 560, 880);

  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 18px ${SANS}`;
  ctx.globalAlpha = 0.7;
  ctx.fillText("DE LA BIBLIOTECA DE", 320, 384);
  ctx.globalAlpha = 1;
  ctx.font = `600 36px ${SERIF}`;
  ctx.fillText("Laureano Enrique", 320, 480);
  ctx.font = `500 22px ${SANS}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(book.title, 320, 544);
  ctx.globalAlpha = 1;
  return toTexture(el);
}

export function createBookTextures(book: Book) {
  return {
    spine: spineTexture(book),
    cover: coverTexture(book),
    firstPage: firstPageTexture(book),
    insideCover: insideCoverTexture(book),
  };
}

/** Soft rectangular shadow used under each standing book (stands in for drei ContactShadows). */
export function createShadowTexture() {
  const [el, ctx] = canvas(256, 256);
  // White shape on transparent: used as an alphaMap (green channel).
  ctx.filter = "blur(22px)";
  ctx.fillStyle = "#fff";
  ctx.fillRect(56, 56, 144, 144);
  const texture = new THREE.CanvasTexture(el);
  return texture;
}
