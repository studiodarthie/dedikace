import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { sendOrderPaid } from "@/inngest/client";
import { db } from "@/lib/db";
import { events, orders, payments, songs, type OrderStatus } from "@/lib/db/schema";
import { getOrderById, setStatus, trackEvent } from "@/lib/orders";

// Fonctions du back-office (PRD §7). Chaque appelant vérifie d'abord la session (requireAdmin).

export class AdminError extends Error {}

/** Les 100 dernières commandes, sans les brouillons sauf si on les demande. `q` : prénom, numéro ou code. */
export async function listOrders(status?: OrderStatus, q?: string) {
  const term = q?.trim().slice(0, 60).replace(/[%_\\]/g, (c) => `\\${c}`);
  const search = term
    ? or(
        ilike(orders.recipientName, `%${term}%`),
        ilike(orders.senderName, `%${term}%`),
        ilike(orders.publicCode, `%${term}%`),
        ilike(sql`regexp_replace(${orders.whatsappPhone}, '\\s', '', 'g')`, `%${term.replace(/\s/g, "")}%`),
      )
    : undefined;
  const rows = await db
    .select({
      id: orders.id,
      publicCode: orders.publicCode,
      status: orders.status,
      recipientName: orders.recipientName,
      whatsappPhone: orders.whatsappPhone,
      priceXaf: orders.priceXaf,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(status ? eq(orders.status, status) : ne(orders.status, "draft"), search))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  const channels = new Map<string, string>();
  if (rows.length > 0) {
    const pays = await db
      .select({ orderId: payments.orderId, channel: payments.channel })
      .from(payments)
      .where(inArray(payments.orderId, rows.map((r) => r.id)))
      .orderBy(payments.createdAt);
    for (const p of pays) channels.set(p.orderId, p.channel); // le dernier paiement l'emporte
  }
  return rows.map((r) => ({ ...r, channel: channels.get(r.id) }));
}

export async function getOrderDetail(orderId: string) {
  const order = await getOrderById(orderId);
  if (!order) return undefined;
  const [orderPayments, orderSongs, orderEvents] = await Promise.all([
    db.select().from(payments).where(eq(payments.orderId, orderId)).orderBy(desc(payments.createdAt)),
    db.select().from(songs).where(eq(songs.orderId, orderId)).orderBy(desc(songs.generation), songs.version),
    db.select().from(events).where(eq(events.orderId, orderId)).orderBy(events.createdAt),
  ]);
  return { order, payments: orderPayments, songs: orderSongs, events: orderEvents };
}

// Une création « paid » ou « generating » depuis plus longtemps que ça est considérée comme bloquée.
const STUCK_AFTER_MS = 10 * 60_000;

export function canRelaunch(order: { status: OrderStatus; updatedAt: Date }): boolean {
  if (order.status === "generation_failed") return true;
  return (order.status === "paid" || order.status === "generating") && Date.now() - order.updatedAt.getTime() > STUCK_AFTER_MS;
}

/** Relance la création de la dernière génération (les versions déjà prêtes sont gardées). */
export async function relaunchGeneration(orderId: string, adminEmail: string): Promise<void> {
  const order = await getOrderById(orderId);
  if (!order) throw new AdminError("Commande introuvable.");
  if (!canRelaunch(order)) {
    throw new AdminError("On ne peut relancer qu'une création en échec, ou bloquée depuis plus de 10 minutes.");
  }
  const [last] = await db
    .select({ generation: sql<number>`max(${songs.generation})` })
    .from(songs)
    .where(eq(songs.orderId, orderId));
  const generation = last?.generation === 2 ? 2 : 1;
  await sendOrderPaid(orderId, generation, Date.now().toString(36));
  console.info(`[admin] ${adminEmail} relance la création ${generation} de ${order.publicCode}`);
}

/**
 * Marque la commande remboursée. Le remboursement lui-même se fait à la main chez Tranzak
 * ou par Mobile Money : ce bouton ne fait que l'enregistrer.
 */
export async function markRefunded(orderId: string, adminEmail: string): Promise<void> {
  try {
    await setStatus(orderId, "refunded");
  } catch {
    throw new AdminError("Seule une commande payée peut être marquée remboursée.");
  }
  await db
    .update(payments)
    .set({ status: "refunded" })
    .where(and(eq(payments.orderId, orderId), eq(payments.status, "successful")));
  console.info(`[admin] ${adminEmail} marque la commande ${orderId} remboursée`);
}

/**
 * Secours (PRD §7) : le client a payé mais la confirmation n'est jamais arrivée.
 * À utiliser seulement après avoir vu le paiement réussi dans le tableau de bord Tranzak.
 */
export async function validateManualPayment(
  orderId: string,
  input: { amountXaf: number; reference: string },
  adminEmail: string,
): Promise<void> {
  const order = await getOrderById(orderId);
  if (!order) throw new AdminError("Commande introuvable.");
  if (!order.lyrics) throw new AdminError("Cette commande n'a pas de paroles validées.");
  if (!["lyrics_ready", "pending_payment", "payment_failed"].includes(order.status)) {
    throw new AdminError("Cette commande est déjà payée.");
  }

  await db.insert(payments).values({
    orderId,
    merchantRef: `manuel${randomBytes(8).toString("hex")}`,
    amountXaf: input.amountXaf,
    channel: "manual",
    status: "successful",
    verifiedAt: new Date(),
    rawNotification: { manual: true, reference: input.reference, validatedBy: adminEmail, at: new Date().toISOString() },
  });
  if (order.status === "lyrics_ready") await setStatus(orderId, "pending_payment");
  await db.update(orders).set({ priceXaf: input.amountXaf }).where(eq(orders.id, orderId));
  await setStatus(orderId, "paid");
  await trackEvent("payment_succeeded", orderId);
  await sendOrderPaid(orderId, 1);
  console.info(`[admin] ${adminEmail} valide un paiement manuel pour ${order.publicCode} (${input.reference})`);
}
