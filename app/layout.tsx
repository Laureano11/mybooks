import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans-app" });
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif-app",
});

export const metadata: Metadata = {
  title: "mybooks",
  description: "Mis libros, mis reseñas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen">
        <header className="border-b border-border">
          <nav className="mx-auto flex max-w-5xl items-baseline gap-6 px-5 py-5">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight hover:text-accent"
            >
              mybooks
            </Link>
            <Link href="/" className="text-sm text-muted hover:text-foreground">
              Libros
            </Link>
            <Link
              href="/stats"
              className="text-sm text-muted hover:text-foreground"
            >
              Estadísticas
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
