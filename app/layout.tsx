import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans-app" });
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif-app",
});

export const metadata: Metadata = {
  title: "Lauri Books",
  description: "Mis libros, mis reseñas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen">
        <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
