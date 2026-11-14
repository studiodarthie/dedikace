// Traduction Drizzle de db/schema.sql (la référence fonctionnelle). Toute modification se fait d'abord là-bas.
import type { AdapterAccountType } from "next-auth/adapters";
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const orderStatus = pgEnum("order_status", [
  "draft",
  "lyrics_ready",
  "pending_payment",
  "paid",
  "generating",
  "delivered",
  "payment_failed",
  "generation_failed",
  "refunded",
]);
export const paymentChannel = pgEnum("payment_channel", ["mtn", "orange", "card", "manual"]);
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "successful",
  "failed",
  "cancelled",
  "refunded",
]);
export const songStatus = pgEnum("song_status", ["queued", "generating", "ready", "failed"]);
export const videoStatus = pgEnum("video_status", ["queued", "rendering", "ready", "failed"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicCode: text("public_code").notNull().unique(),
    whatsappPhone: text("whatsapp_phone").notNull(),
    occasion: text("occasion").notNull(),
    recipientName: text("recipient_name").notNull(),
    relation: text("relation"),
    senderName: text("sender_name"),
    anecdotes: text("anecdotes"),
    styleId: text("style_id").notNull(),
    songLanguage: text("song_language").notNull().default("fr"),
    chorusLanguage: text("chorus_language").notNull().default("fr"),
    voice: text("voice", { enum: ["male", "female"] }).notNull().default("male"),
    title: text("title"),
    lyrics: text("lyrics"),
    rewriteCount: integer("rewrite_count").notNull().default(0),
    freeRegenUsed: boolean("free_regen_used").notNull().default(false),
    status: orderStatus("status").notNull().default("draft"),
    priceXaf: integer("price_xaf").notNull().default(3000),
    country: text("country").notNull().default("CM"),
    moderationNote: text("moderation_note"),
    // Compte client (facultatif). Compte supprimé : la commande reste, le lien est effacé.
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    // Relance des paroles non payées : WhatsApp envoyé à la main depuis le back-office, e-mail automatique.
    remindedAt: timestamp("reminded_at", { withTimezone: true }),
    reminderEmailedAt: timestamp("reminder_emailed_at", { withTimezone: true }),
    // Surveillance (inngest/watchdog.ts) : alerte « commande payée bloquée » envoyée une seule fois.
    stuckAlertedAt: timestamp("stuck_alerted_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check("orders_voice_check", sql`${t.voice} in ('male', 'female')`),
    index("orders_status_created_at_idx").on(t.status, t.createdAt.desc()),
    index("orders_user_id_idx").on(t.userId, t.createdAt.desc()),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("tranzak"),
    // requestId Tranzak : garantit l'idempotence
    providerRequestId: text("provider_request_id").unique(),
    // mchTransactionRef envoyé à Tranzak
    merchantRef: text("merchant_ref").notNull().unique(),
    amountXaf: integer("amount_xaf").notNull(),
    channel: paymentChannel("channel").notNull(),
    status: paymentStatus("status").notNull().default("pending"),
    rawNotification: jsonb("raw_notification"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("payments_order_id_idx").on(t.orderId)],
);

export const songs = pgTable(
  "songs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    // 2 = régénération gratuite
    generation: integer("generation").notNull().default(1),
    // clé de l'objet dans le bucket R2 `songs`
    storagePath: text("storage_path"),
    durationSeconds: integer("duration_seconds"),
    status: songStatus("status").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => [
    check("songs_version_check", sql`${t.version} in (1, 2)`),
    unique("songs_order_version_generation_key").on(t.orderId, t.version, t.generation),
    index("songs_order_id_idx").on(t.orderId),
  ],
);

// Vidéo statut WhatsApp (docs/PLAN_CROISSANCE.md, étape 4) : une vidéo par commande, refaite si on change de photo.
// Photo et MP4 dans le bucket R2 privé, servis par URL présignées comme les chansons.
export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: videoStatus("status").notNull().default("queued"),
  photoKey: text("photo_key").notNull(),
  videoKey: text("video_key"),
  // Nombre de vidéos créées pour cette commande (limite contre les abus).
  renders: integer("renders").notNull().default(1),
  error: text("error"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const eventTypes = ["form_started", "lyrics_generated", "payment_started", "payment_succeeded"] as const;

// Événements de l'entonnoir pour les compteurs du back-office. Aucune donnée personnelle.
export const events = pgTable(
  "events",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    type: text("type", { enum: eventTypes }).notNull(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "events_type_check",
      sql`${t.type} in ('form_started', 'lyrics_generated', 'payment_started', 'payment_succeeded')`,
    ),
    index("events_type_created_at_idx").on(t.type, t.createdAt.desc()),
  ],
);

// Auth.js (adaptateur Drizzle) : connexion des clients (Google ou lien e-mail) et du back-office.
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true, mode: "date" }),
  image: text("image"),
  phone: text("phone"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderStatus = (typeof orderStatus.enumValues)[number];
export type Payment = typeof payments.$inferSelect;
export type Song = typeof songs.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type EventType = (typeof eventTypes)[number];
