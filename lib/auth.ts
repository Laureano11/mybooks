import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
} from "./session";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Falta la variable de entorno SESSION_SECRET");
  return s;
}

export async function isLoggedIn(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token, secret());
}

/**
 * Corta la ejecución si no hay sesión.
 * Cada Server Action debe llamarla: el proxy filtra la navegación,
 * pero las Server Actions son endpoints invocables directamente.
 */
export async function requireLogin(): Promise<void> {
  if (!(await isLoggedIn())) redirect("/login");
}

export async function login(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("Falta la variable de entorno ADMIN_PASSWORD");
  if (password !== expected) return false;

  (await cookies()).set(SESSION_COOKIE, await signSession(secret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return true;
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
