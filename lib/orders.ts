import "server-only";
import { randomInt } from "node:crypto";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, orders, type EventType, type NewOrder, type Order, type OrderStatus } from "@/lib/db/schema";

export const MAX_REWRITES = 3;

// PRD §6 : pour chaque statut cible, les statuts depuis lesquels on a le droit d'y arriver.
const ALLOWED_FROM: Record<OrderStatus, readonly OrderStatus[]> = {
  draft: [],
  lyrics_ready: ["draft"],
  pending_payment: ["lyrics_ready", "payment_failed"],
  // payment_failed → paid : confirmation tardive de Tranzak ou validation manuelle par l'admin
  paid: ["pending_payment", "payment_failed"],
  payment_failed: ["pending_payment"],
  // delivered → generating : régénération gratuite ; generation_failed → generating : relance admin
  generating: ["paid", "delivered", "generation_failed"],
  delivered: ["generating"],
  generation_failed: ["generating"],
  refunded: ["paid", "generating", "delivered", "generation_failed"],
};

export class OrderError extends Error {
  constructor(
    message: string,
    readonly code: "not_found" | "invalid_transition" | "rewrite_limit" | "code_collision",
  ) {
    super(message);
    this.name = "OrderError";
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_FROM[to].includes(from);
}

// PRD §5 : 8 caractères, non devinable, sans caractères ambigus (0/o, 1/l/i).
const CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const CODE_LENGTH = 8;

export function generatePublicCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

type DraftInput = Pick<
  NewOrder,
  | "whatsappPhone"
  | "occasion"
  | "recipientName"
  | "relation"
  | "senderName"
  | "anecdotes"
  | "styleId"
  | "songLanguage"
  | "chorusLanguage"
  | "voice"
>;

export async function createDraftOrder(input: DraftInput): Promise<Order> {
  // 31^8 ≈ 850 milliards de codes : une collision est rarissime, on réessaie quand même.
  for (let attempt = 0; attempt < 5; attempt++) {
    const [order] = await db
      .insert(orders)
      .values({ ...input, publicCode: generatePublicCode() })
      .onConflictDoNothing({ target: orders.publicCode })
      .returning();
    if (order) return order;
  }
  throw new OrderError("Impossible de générer un code public unique.", "code_collision");
}

/**
 * Enregistre des paroles. Première génération : draft → lyrics_ready.
 * Réécriture : reste en lyrics_ready et consomme une des 3 réécritures.
 * Modification manuelle (edited = true) : ne consomme pas de réécriture.
 */
export async function updateLyrics(
  orderId: string,
  data: { title: string; lyrics: string; kind: "first" | "rewrite" | "edited" },
): Promise<Order> {
  const isRewrite = data.kind === "rewrite";
  const [order] = await db
    .update(orders)
    .set({
      title: data.title,
      lyrics: data.lyrics,
      status: "lyrics_ready",
      ...(isRewrite && { rewriteCount: sql`${orders.rewriteCount} + 1` }),
    })
    .where(
      and(
        eq(orders.id, orderId),
        inArray(orders.status, ["draft", "lyrics_ready"]),
        isRewrite ? lt(orders.rewriteCount, MAX_REWRITES) : undefined,
      ),
    )
    .returning();

  if (order) return order;

  const current = await getOrderById(orderId);
  if (!current) throw new OrderError("Commande introuvable.", "not_found");
  if (isRewrite && current.rewriteCount >= MAX_REWRITES) {
    throw new OrderError("Tu as déjà utilisé tes 3 réécritures.", "rewrite_limit");
  }
  throw new OrderError(
    `Les paroles ne peuvent plus être modifiées (statut ${current.status}).`,
    "invalid_transition",
  );
}

/**
 * Change le statut de façon atomique : la mise à jour n'a lieu que si le statut actuel
 * fait partie des prédécesseurs autorisés. Deux appels simultanés ne peuvent donc pas
 * réussir tous les deux (base de l'idempotence, CLAUDE.md règle 2).
 */
export async function setStatus(orderId: string, to: OrderStatus): Promise<Order> {
  const from = ALLOWED_FROM[to];
  if (from.length > 0) {
    const [order] = await db
      .update(orders)
      .set({ status: to })
      .where(and(eq(orders.id, orderId), inArray(orders.status, [...from])))
      .returning();
    if (order) return order;
  }

  const current = await getOrderById(orderId);
  if (!current) throw new OrderError("Commande introuvable.", "not_found");
  throw new OrderError(`Transition interdite : ${current.status} → ${to}.`, "invalid_transition");
}

export async function getOrderById(orderId: string): Promise<Order | undefined> {
  return db.query.orders.findFirst({ where: eq(orders.id, orderId) });
}

export async function getOrderByPublicCode(code: string): Promise<Order | undefined> {
  const normalized = code.trim().toLowerCase();
  if (normalized.length !== CODE_LENGTH) return undefined;
  return db.query.orders.findFirst({ where: eq(orders.publicCode, normalized) });
}

/**
 * Réserve la régénération gratuite (PRD §5 : 1 par commande). Atomique : deux clics
 * simultanés ne peuvent pas la consommer deux fois. Renvoie la commande, ou undefined si refusé.
 */
export async function claimFreeRegeneration(publicCode: string): Promise<Order | undefined> {
  const [order] = await db
    .update(orders)
    .set({ freeRegenUsed: true })
    .where(
      and(
        eq(orders.publicCode, publicCode.trim().toLowerCase()),
        eq(orders.status, "delivered"),
        eq(orders.freeRegenUsed, false),
      ),
    )
    .returning();
  return order;
}

/** Journalise un refus de modération (docs/PROMPTS.md §4.3). Les refus précédents sont conservés. */
export async function addModerationNote(orderId: string, note: string): Promise<void> {
  const line = `${new Date().toISOString()} ${note}`;
  await db
    .update(orders)
    .set({ moderationNote: sql`coalesce(${orders.moderationNote} || E'\\n', '') || ${line}` })
    .where(eq(orders.id, orderId));
}

export async function trackEvent(type: EventType, orderId?: string): Promise<void> {
  await db.insert(events).values({ type, orderId });
}
