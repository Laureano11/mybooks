# mybooks

Página donde hago reseñas de mis libros. Pública para leer, privada para cargar.

## Cómo correrlo en local

Necesitás Node 20+ y un Postgres corriendo.

```bash
createdb mybooks_dev
psql -d mybooks_dev -f db/schema.sql
cp .env.example .env.local   # completá las tres variables
npm install
npm run dev
```

Para `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Tests (algunos necesitan la base) |
| `npm run build` | Build de producción |
| `npx eslint .` | Lint |

## Cómo funciona

- **Next.js 16** (App Router). Las páginas leen la base directamente; las escrituras van por Server Actions.
- **Postgres**, una sola tabla `books`. En local se usa el driver `pg`; en producción, el de Neon por HTTP. `lib/db.ts` elige según la URL.
- **Las portadas no se guardan**: se derivan del ISBN vía Open Library. Sin ISBN, o si la imagen no existe, se muestra un recuadro con el título.
- **La sesión** es una cookie firmada con HMAC (`lib/session.ts`), sin estado en el servidor. `proxy.ts` filtra la navegación a `/admin`, y además cada Server Action revalida la sesión por su cuenta.

## Deploy

Las variables que hay que configurar en Vercel: `DATABASE_URL`, `ADMIN_PASSWORD` y `SESSION_SECRET`.
Después del primer deploy, aplicar `db/schema.sql` sobre la base de producción.
