import "server-only";
import { and, eq, inArray, isNull, lt, notExists, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, songs, users, type Order, type Payment } from "@/lib/db/schema";
import { sendAdminAlert, sendAdminNotice, sendSongReady } from "@/lib/email";
import { env } from "@/lib/env";
import { formatXaf } from "@/lib/format";
import { occasionLabel } from "@/lib/occasions";

// Notifications de l'équipe et des clients, et surveillance des commandes payées.
// Ajouté après la commande « Jeff » du 14 novembre 2026 : paiement reçu, création jamais lancée
// (INNGEST_EVENT_KEY absente en production), et personne n'était prévenu.

const APP_URL = () => env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
const CHANNELS: Record<string, string> = { mtn: "MTN MoMo", orange: "Orange Money", card: "Carte", manual: "Manuel" };

/** Une payée sans chanson depuis 10 min, ou en création depuis 20 min : on relance et on prévient. */
export const STUCK_PAID_MS = 10 * 60_000;
export const STUCK_GENERATING_MS = 20 * 60_000;

/** E-mail à l'équipe pour chaque vente. */
export async function notifySale(order: Order, payment: Payment): Promise<void> {
  await sendAdminNotice(
    `💰 Vente ${formatXaf(payment.amountXaf)} — chanson pour ${order.recipientName}`,
    [
      `${occasionLabel(order.occasion)} · ${CHANNELS[payment.channel] ?? payment.channel} · ${order.whatsappPhone}`,
      ...(order.senderName ? [`De la part de ${order.senderName}`] : []),
      "",
      `Commande : ${APP_URL()}/admin/commandes/${order.id}`,
      "La création démarre automatiquement. Tu recevras une alerte si elle bloque.",
    ].join("\n"),
  );
}

/** Le lancement de la création a échoué juste après le paiement : alerte immédiate (la surveillance relancera). */
export async function notifyLaunchFailed(order: Order, error: unknown): Promise<void> {
  await sendAdminAlert(
    `⚠️ Création NON lancée — ${order.publicCode} (${order.recipientName})`,
    [
      "Le paiement est reçu mais la création de la chanson n'a pas pu être lancée.",
      `Erreur : ${error instanceof Error ? error.message : String(error)}`,
      "",
      "La surveillance automatique réessaie toutes les 5 minutes. Si ça persiste, relance depuis le back-office :",
      `${APP_URL()}/admin/commandes/${order.id}`,
    ].join("\n"),
  );
}

/** « Ta chanson est prête » pour les clients qui ont un espace. Ne bloque jamais la livraison. */
export async function notifySongReady(orderId: string): Promise<void> {
  try {
    const [row] = await db
      .select({ code: orders.publicCode, recipientName: orders.recipientName, locale: orders.locale, email: users.email, name: users.name })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.userId))
      .where(eq(orders.id, orderId));
    if (!row?.email) return;
    await sendSongReady(row.email, {
      firstName: row.name?.trim().split(/\s+/)[0] || null,
      recipientName: row.recipientName,
      url: `${APP_URL()}${row.locale === "en" ? "/en" : ""}/s/${row.code}`,
      locale: row.locale,
    });
  } catch (error) {
    console.error("[notification] e-mail « chanson prête » échoué", error);
  }
}

/** Commandes payées qui n'avancent pas, pas encore signalées. */
export async function findStuckOrders(now = Date.now()) {
  const noSong = notExists(db.select({ id: songs.id }).from(songs).where(eq(songs.orderId, orders.id)));
  const [paid, generating] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(and(eq(orders.status, "paid"), lt(orders.updatedAt, new Date(now - STUCK_PAID_MS)), noSong, isNull(orders.stuckAlertedAt))),
    db
      .select()
      .from(orders)
      .where(and(eq(orders.status, "generating"), lt(orders.updatedAt, new Date(now - STUCK_GENERATING_MS)), isNull(orders.stuckAlertedAt))),
  ]);
  return { paid, generating };
}

/** Note l'alerte (une seule par commande), sans changer la date de dernière modification. */
export async function markStuckAlerted(orderIds: string[]): Promise<void> {
  if (orderIds.length === 0) return;
  await db
    .update(orders)
    .set({ stuckAlertedAt: new Date(), updatedAt: sql`${orders.updatedAt}` })
    .where(inArray(orders.id, orderIds));
}

/** Réglages indispensables en production : affichés en rouge dans le back-office s'ils manquent. */
export function missingProductionSettings(): string[] {
  if (process.env.VERCEL_ENV !== "production") return [];
  const required = {
    INNGEST_EVENT_KEY: env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: env.INNGEST_SIGNING_KEY,
    RESEND_API_KEY: env.RESEND_API_KEY,
    EMAIL_FROM: env.EMAIL_FROM,
    ELEVENLABS_API_KEY: env.ELEVENLABS_API_KEY,
    ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
    TRANZAK_APP_ID: env.TRANZAK_APP_ID,
    TRANZAK_APP_KEY: env.TRANZAK_APP_KEY,
  };
  return Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);
}
