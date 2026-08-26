import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/session";

/**
 * Chequeo optimista para la navegación: evita renderizar /admin sin sesión.
 * La autorización real vive en cada Server Action (ver lib/auth.ts).
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const ok = await verifySession(token, process.env.SESSION_SECRET ?? "");

  if (!ok) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
