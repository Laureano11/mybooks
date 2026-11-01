# mybooks

Página donde hago reseñas de mis libros. Los libros viven en `data/books.json`.

## Cómo correrlo en local

Necesitás Node 20+.

```bash
npm install
npm run dev
```

## Cómo cargar un libro

Agregalo en `data/books.json` y hacé `git push`; Vercel publica el cambio.

```json
{
  "slug": "rayuela",
  "title": "Rayuela",
  "author": "Julio Cortázar",
  "isbn": "9788437604572",
  "rating": 9,
  "review": "Mi reseña.\n\nOtro párrafo.",
  "status": "leido",
  "finished_year": 2024,
  "gem": true
}
```

- `slug` es la URL del libro y define su color en el estante: no lo cambies después.
- `status` es `leido`, `leyendo` o `pendiente`. Un pendiente lleva `rating` y `finished_year` en `null`.
- `gem` (joyita) necesita `rating`. `isbn`, `rating`, `review` y `finished_year` pueden ser `null`.
- Entre libros con el mismo año, el que está más arriba en el archivo aparece primero.

Si el archivo tiene un error, `npm run build` falla y dice qué libro corregir.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Tests |
| `npm run build` | Build de producción |
| `npx eslint .` | Lint |

## Cómo funciona

- **Next.js 16** (App Router). Las páginas leen los libros con `lib/books.ts`, que valida `data/books.json`.
- **Las portadas no se guardan**: se derivan del ISBN vía Open Library. Sin ISBN, o si la imagen no existe, se muestra un recuadro con el título.

## Deploy

Vercel, sin variables de entorno.
