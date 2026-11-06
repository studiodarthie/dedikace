import "server-only";
import { z } from "zod";

// Variables obligatoires dès le jour 1. Celles des jours suivants sont optionnelles
// tant que la fonctionnalité correspondante n'est pas branchée (voir docs/PLAN_DEV.md).
const optional = z.string().trim().min(1).optional();
const xaf = z.coerce.number().int().positive();

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPPORT_WHATSAPP: z.string().regex(/^\+\d{8,15}$|^\+237X+$/),
  ADMIN_EMAILS: z
    .string()
    .transform((v) => v.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)),

  DATABASE_URL: z.url(),

  R2_ACCOUNT_ID: optional,
  R2_ACCESS_KEY_ID: optional,
  R2_SECRET_ACCESS_KEY: optional,
  R2_BUCKET: z.string().default("songs"),

  AUTH_SECRET: optional,
  // Connexion « Continuer avec Google » (Google Cloud Console → Identifiants OAuth). Bouton caché si absentes.
  AUTH_GOOGLE_ID: optional,
  AUTH_GOOGLE_SECRET: optional,
  RESEND_API_KEY: optional,
  EMAIL_FROM: optional,

  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-"),
  CLAUDE_MODEL: z.string().default("claude-sonnet-5-5"),
  ELEVENLABS_API_KEY: optional,

  TRANZAK_MODE: z.enum(["sandbox", "production"]).default("sandbox"),
  TRANZAK_APP_ID: optional,
  TRANZAK_APP_KEY: optional,
  TRANZAK_WEBHOOK_AUTH_KEY: optional,

  INNGEST_EVENT_KEY: optional,
  INNGEST_SIGNING_KEY: optional,

  // Identifiants publics des pixels publicitaires (pas des secrets). L'ancien nom NEXT_PUBLIC_* reste accepté.
  META_PIXEL_ID: optional,
  TIKTOK_PIXEL_ID: optional,

  PRICE_MOMO_XAF: xaf.default(3000),
  PRICE_CARD_XAF: xaf.default(4000),
});

// Une variable vide dans .env.local (« CLE= ») est traitée comme absente.
const raw: Record<string, string | undefined> = Object.fromEntries(
  Object.entries(process.env).filter(([, v]) => v !== undefined && v !== ""),
);

// Sur Vercel, l'adresse du site est déduite automatiquement si elle n'est pas renseignée.
if (!raw.NEXT_PUBLIC_APP_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  raw.NEXT_PUBLIC_APP_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
}

raw.META_PIXEL_ID ??= raw.NEXT_PUBLIC_META_PIXEL_ID;
raw.TIKTOK_PIXEL_ID ??= raw.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

const parsed = schema.safeParse(raw);

if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  - ${i.path.join(".")} : ${i.message}`).join("\n");
  throw new Error(`Variables d'environnement invalides :\n${details}`);
}

export const env = parsed.data;

/** Lève une erreur claire si une variable nécessaire à une fonctionnalité manque. */
export function requireEnv<K extends keyof typeof env>(key: K): NonNullable<(typeof env)[K]> {
  const value = env[key];
  if (value === undefined || value === null) {
    throw new Error(`La variable ${String(key)} doit être renseignée dans .env.local pour cette fonctionnalité.`);
  }
  return value as NonNullable<(typeof env)[K]>;
}
