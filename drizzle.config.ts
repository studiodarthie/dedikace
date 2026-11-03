import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

// npm run db:migrate vise la branche Neon « dev » (DATABASE_URL de .env.local) ;
// npm run db:migrate:prod vise la vraie base du site en ligne (PROD_DATABASE_URL).
if (process.env.MIGRATE_TARGET === "prod") {
  if (!process.env.PROD_DATABASE_URL) throw new Error("PROD_DATABASE_URL manquante dans .env.local");
  process.env.DATABASE_URL = process.env.PROD_DATABASE_URL;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL manquante dans .env.local");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
});
