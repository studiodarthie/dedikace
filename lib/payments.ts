import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { sendOrderPaid } from "@/inngest/client";
import { db } from "@/lib/db";
import { orders, payments, songs, type Order, type Payment } from "@/lib/db/schema";
import { sendAdminAlert } from "@/lib/email";
import { env } from "@/lib/env";
import { formatXaf } from "@/lib/format";
import { notifyLaunchFailed, notifySale } from "@/lib/notifications";
import { pricesAt } from "@/lib/pricing";
import { getOrderById, OrderError, setStatus, trackEvent } from "@/lib/orders";
import {
  chargeByWebRedirect,
  chargeMobileMoney,
  getRequestDetails,
  refreshRequestStatus,
  TranzakError,
  type TranzakRequest,
} from "@/lib/tranzak";

export type PayChannel = "mtn" | "orange" | "card";

/** Prix en XAF entiers (CLAUDE.md règle 4), lus côté serveur uniquement. */
export function priceFor(channel: PayChannel): number {
  const prices = pricesAt(new Date());
  return channel === "card" ? prices.card : prices.momo;
}

const PAYABLE = new Set(["lyrics_ready", "pending_payment", "payment_failed"]);
const FAILED_STATUSES = new Set(["FAILED", "CANCELLED", "CANCELLED_BY_PAYER", "EXPIRED"]);
// Délai laissé à Inngest pour démarrer avant de renvoyer l'événement « order/paid ».
const RESEND_AFTER_MS = 30_000;

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

/** Référence marchand unique (≤ 32 caractères, exigé par Tranzak pour le Mobile Money). */
function newMerchantRef(): string {
  return `dk${Date.now().toString(36)}${randomBytes(6).toString("hex")}`;
}

export type StartedPayment = { paymentId: string; redirectUrl?: string };

/**
 * Prompt 9 : crée la ligne `payments` AVANT d'appeler Tranzak, puis lance le débit.
 * Mobile Money : demande envoyée sur le téléphone. Carte : URL de la page de paiement Tranzak.
 */
export async function startPayment(input: {
  orderId: string;
  channel: PayChannel;
  phone?: string;
}): Promise<StartedPayment> {
  const order = await getOrderById(input.orderId);
  if (!order) throw new PaymentError("Commande introuvable.", 404);
  if (!PAYABLE.has(order.status)) {
    throw new PaymentError("Cette commande est déjà payée. Ta chanson arrive !", 409);
  }
  if (!order.lyrics) throw new PaymentError("Valide d'abord tes paroles.", 409);
  if (input.channel !== "card" && !input.phone) throw new PaymentError("Indique ton numéro Mobile Money.", 400);

  const amountXaf = priceFor(input.channel);
  const merchantRef = newMerchantRef();
  const [payment] = await db
    .insert(payments)
    .values({ orderId: order.id, merchantRef, amountXaf, channel: input.channel })
    .returning();

  if (order.status !== "pending_payment") await setStatus(order.id, "pending_payment");
  await db.update(orders).set({ priceXaf: amountXaf }).where(eq(orders.id, order.id));
  await trackEvent("payment_started", order.id);

  const returnUrl = `${env.NEXT_PUBLIC_APP_URL}/commande/${order.id}`;
  const description = `Chanson personnalisée pour ${order.recipientName}`.slice(0, 255);

  let request: TranzakRequest;
  try {
    request =
      input.channel === "card"
        ? await chargeByWebRedirect({ amountXaf, merchantRef, description, returnUrl, cancelUrl: returnUrl })
        : await chargeMobileMoney({ amountXaf, merchantRef, description, returnUrl, phone: input.phone! });
  } catch (error) {
    await db.update(payments).set({ status: "failed" }).where(eq(payments.id, payment.id));
    await setStatus(order.id, "payment_failed").catch(() => {});
    console.error("[paiement] création refusée", error);
    throw new PaymentError(
      error instanceof TranzakError && !error.retryable
        ? "Le paiement a été refusé. Vérifie le numéro et réessaie."
        : "Le service de paiement ne répond pas. Réessaie dans un instant.",
      502,
    );
  }

  await db.update(payments).set({ providerRequestId: request.requestId }).where(eq(payments.id, payment.id));

  // Carte, ou Mobile Money avec validation supplémentaire (OTP…) : on envoie le client chez Tranzak.
  const redirectUrl =
    input.channel === "card" || request.status === "PAYER_REDIRECT_REQUIRED" ? request.links?.paymentAuthUrl : undefined;
  if (input.channel === "card" && !redirectUrl) {
    throw new PaymentError("Le paiement par carte est indisponible pour le moment.", 502);
  }
  return { paymentId: payment.id, redirectUrl };
}

export async function getPaymentByRequestId(requestId: string): Promise<Payment | undefined> {
  const [payment] = await db.select().from(payments).where(eq(payments.providerRequestId, requestId)).limit(1);
  return payment;
}

export async function getLatestPayment(orderId: string): Promise<Payment | undefined> {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(desc(payments.createdAt))
    .limit(1);
  return payment;
}

export async function saveNotification(paymentId: string, raw: unknown): Promise<void> {
  await db.update(payments).set({ rawNotification: raw }).where(eq(payments.id, paymentId));
}

export type SyncResult = "successful" | "failed" | "pending";

/**
 * Cœur des Prompts 10 et 11 : relit le statut CHEZ TRANZAK (CLAUDE.md règle 1) et applique le résultat.
 * Appelée par le webhook et par la page d'attente ; sûre si elle tourne plusieurs fois (règle 2).
 */
export async function syncPayment(payment: Payment, options: { forceRefresh?: boolean } = {}): Promise<SyncResult> {
  if (payment.status === "successful") {
    await ensureGenerationStarted(payment.orderId);
    return "successful";
  }
  if (payment.status !== "pending") return "failed";
  if (!payment.providerRequestId) return "pending";

  const details = options.forceRefresh
    ? await refreshRequestStatus(payment.providerRequestId)
    : await getRequestDetails(payment.providerRequestId);
  return applyVerifiedStatus(payment, details);
}

/**
 * Applique un statut LU CHEZ TRANZAK. Ne jamais l'appeler avec le contenu d'une notification :
 * seule syncPayment l'utilise (exportée pour les tests, scripts/test-payments.ts).
 */
export async function applyVerifiedStatus(payment: Payment, details: TranzakRequest): Promise<SyncResult> {
  if (details.status === "SUCCESSFUL") {
    return (await confirmPayment(payment, details)) ? "successful" : "failed";
  }
  if (FAILED_STATUSES.has(details.status)) {
    await failPayment(payment, details.status === "FAILED" ? "failed" : "cancelled");
    return "failed";
  }
  return "pending";
}

/** false si le paiement ne correspond pas à celui créé (montant, référence…). */
async function confirmPayment(payment: Payment, details: TranzakRequest): Promise<boolean> {
  // Le paiement vérifié doit correspondre exactement à celui que nous avons créé.
  const mismatch =
    details.requestId !== payment.providerRequestId ||
    details.mchTransactionRef !== payment.merchantRef ||
    details.currencyCode !== "XAF" ||
    !Number.isInteger(details.amount) ||
    details.amount !== payment.amountXaf;
  if (mismatch) {
    await sendAdminAlert(
      `Paiement incohérent — ${payment.merchantRef}`,
      `Attendu ${formatXaf(payment.amountXaf)} (${payment.merchantRef}), Tranzak indique ${details.amount} ${details.currencyCode} (${details.mchTransactionRef}). Génération NON lancée.`,
    );
    // Marqué en échec pour ne pas relancer l'alerte à chaque vérification.
    await failPayment(payment, "failed");
    return false;
  }

  // Une seule ligne passe de pending à successful, même si deux appels arrivent en même temps.
  const [updated] = await db
    .update(payments)
    .set({ status: "successful", verifiedAt: new Date() })
    .where(and(eq(payments.id, payment.id), eq(payments.status, "pending")))
    .returning();
  if (!updated) {
    await ensureGenerationStarted(payment.orderId);
    return true;
  }

  let order: Order;
  try {
    order = await setStatus(payment.orderId, "paid");
  } catch (error) {
    if (!(error instanceof OrderError) || error.code !== "invalid_transition") throw error;
    // Déjà payée par un autre paiement : le client a payé deux fois.
    const current = await getOrderById(payment.orderId);
    await sendAdminAlert(
      `Double paiement — commande ${current?.publicCode ?? payment.orderId}`,
      `Le paiement ${payment.merchantRef} (${formatXaf(payment.amountXaf)}) a réussi alors que la commande était « ${current?.status} ». À rembourser au ${current?.whatsappPhone ?? "?"}.`,
    );
    return true;
  }
  await trackEvent("payment_succeeded", order.id);
  await notifySale(order, updated);
  try {
    await sendOrderPaid(order.id, 1);
  } catch (error) {
    // Le paiement est bien confirmé : on ne fait pas échouer la vérification. Alerte immédiate,
    // puis renvoi automatique (ensureGenerationStarted à chaque passage de la page d'attente, et inngest/watchdog.ts).
    await notifyLaunchFailed(order, error);
  }
  return true;
}

async function failPayment(payment: Payment, status: "failed" | "cancelled"): Promise<void> {
  const [updated] = await db
    .update(payments)
    .set({ status, verifiedAt: new Date() })
    .where(and(eq(payments.id, payment.id), eq(payments.status, "pending")))
    .returning();
  // Seul le dernier paiement en date décide du statut de la commande.
  if (updated && (await getLatestPayment(payment.orderId))?.id === payment.id) {
    await setStatus(payment.orderId, "payment_failed").catch(() => {});
  }
}

/**
 * Commande payée depuis plus de 30 s sans que la création ait démarré (envoi à Inngest perdu) :
 * on renvoie l'événement. Inngest ignore les doublons grâce à l'identifiant d'événement.
 */
async function ensureGenerationStarted(orderId: string): Promise<void> {
  const order = await getOrderById(orderId);
  if (order?.status !== "paid" || Date.now() - order.updatedAt.getTime() < RESEND_AFTER_MS) return;
  const [song] = await db
    .select({ id: songs.id })
    .from(songs)
    .where(and(eq(songs.orderId, orderId), eq(songs.generation, 1)))
    .limit(1);
  if (!song) {
    await sendOrderPaid(orderId, 1).catch((error) => console.error("[paiement] renvoi de la création échoué", error));
  }
}
