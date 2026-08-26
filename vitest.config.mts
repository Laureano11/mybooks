import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import path from "node:path";


config({ path: ".env.local", quiet: true });

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
      // `server-only` sólo existe para fallar en el bundle de cliente;
      // en los tests de Node hay que neutralizarlo.
      "server-only": path.resolve(import.meta.dirname, "lib/test/server-only-stub.ts"),
    },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
