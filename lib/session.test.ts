import { describe, it, expect } from "vitest";
import { signSession, verifySession, SESSION_MAX_AGE } from "./session";

const SECRET = "un-secreto-de-prueba-suficientemente-largo";
const NOW = 1_772_000_000_000; // fecha fija para no depender del reloj

describe("sesión", () => {
  it("verifica un token que acaba de firmarse", async () => {
    const token = await signSession(SECRET, NOW);
    expect(await verifySession(token, SECRET, NOW)).toBe(true);
  });

  it("sigue siendo válido justo antes de expirar", async () => {
    const token = await signSession(SECRET, NOW);
    const casiVencido = NOW + SESSION_MAX_AGE * 1000 - 1000;
    expect(await verifySession(token, SECRET, casiVencido)).toBe(true);
  });

  it("rechaza un token vencido", async () => {
    const token = await signSession(SECRET, NOW);
    const vencido = NOW + SESSION_MAX_AGE * 1000 + 1000;
    expect(await verifySession(token, SECRET, vencido)).toBe(false);
  });

  it("rechaza un token con la firma alterada", async () => {
    const token = await signSession(SECRET, NOW);
    const [payload] = token.split(".");
    expect(await verifySession(`${payload}.firmafalsa`, SECRET, NOW)).toBe(
      false,
    );
  });

  it("rechaza un token con el payload alterado", async () => {
    const token = await signSession(SECRET, NOW);
    const [, sig] = token.split(".");
    const otroPayload = Buffer.from(
      JSON.stringify({ exp: NOW + 999_999_999 }),
    ).toString("base64url");
    expect(await verifySession(`${otroPayload}.${sig}`, SECRET, NOW)).toBe(
      false,
    );
  });

  it("rechaza un token firmado con otro secreto", async () => {
    const token = await signSession("otro-secreto-distinto", NOW);
    expect(await verifySession(token, SECRET, NOW)).toBe(false);
  });

  it("rechaza entradas malformadas", async () => {
    expect(await verifySession("", SECRET, NOW)).toBe(false);
    expect(await verifySession("sin-punto", SECRET, NOW)).toBe(false);
    expect(await verifySession(undefined, SECRET, NOW)).toBe(false);
  });
});
