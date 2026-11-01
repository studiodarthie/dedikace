import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Driver WebSocket de Neon : supporte les transactions (indispensables pour le paiement idempotent).
// Node 22+ fournit WebSocket nativement, aucune dépendance supplémentaire n'est nécessaire.
const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle({ client: pool, schema });
export { schema };
