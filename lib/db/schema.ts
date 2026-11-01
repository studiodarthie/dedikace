// Traduction Drizzle de db/schema.sql (la référence fonctionnelle). Toute modification se fait d'abord là-bas.
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
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check("orders_voice_check", sql`${t.voice} in ('male', 'female')`),
    index("orders_status_created_at_idx").on(t.status, t.createdAt.desc()),
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

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderStatus = (typeof orderStatus.enumValues)[number];
export type Payment = typeof payments.$inferSelect;
export type Song = typeof songs.$inferSelect;
export type EventType = (typeof eventTypes)[number];
