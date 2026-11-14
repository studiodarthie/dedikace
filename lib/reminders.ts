import "server-only";
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { sendPaymentReminder } from "@/lib/email";
import { env } from "@/lib/env";
import { pricesAt } from "@/lib/pricing";
import { formatXaf } from "@/lib/format";

// Relance des paroles non payées (docs/PLAN_CROISSANCE.md, étape 1).
// WhatsApp : envoyé à la main depuis le back-office (pas d'API WhatsApp). E-mail : automatique, via Inngest.

/** Garde la date de dernière modification : noter une relance ne doit pas « rajeunir » la commande. */
const keepUpdatedAt = { updatedAt: sql`${orders.updatedAt}` };

/** On relance une commande dont les paroles attendent depuis au moins 1 h, et au plus 7 jours. */
export const REMIND_AFTER_MS = 60 * 60_000;
const REMIND_UNTIL_MS = 7 * 24 * 60 * 60_000;
const UNPAID = ["lyrics_ready", "payment_failed"] as const;

export type ReminderRow = {
  id: string;
  publicCode: string;
  status: (typeof UNPAID)[number];
  recipientName: string;
  senderName: string | null;
  occasion: string;
  whatsappPhone: string;
  locale: "fr" | "en";
  updatedAt: Date;
  remindedAt: Date | null;
};

/** Lien privé vers la page de la commande, où le client relit ses paroles et paie. */
export function orderUrl(orderId: string, locale: "fr" | "en" = "fr"): string {
  return `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${locale === "en" ? "/en" : ""}/commande/${orderId}`;
}

/** Message WhatsApp tout prêt, au ton du site (tutoiement, phrases courtes). */
export function reminderMessage(o: Pick<ReminderRow, "id" | "status" | "recipientName" | "senderName" | "locale">): string {
  if (o.locale === "en") return reminderMessageEn(o);
  const hello = o.senderName ? `Salut ${o.senderName} 👋` : "Salut 👋";
  const line =
    o.status === "payment_failed"
      ? `Ton paiement pour la chanson de ${o.recipientName} n'est pas passé, mais tes paroles sont bien gardées ✍🏾`
      : `Les paroles de ta chanson pour ${o.recipientName} sont prêtes et elles t'attendent ✍🏾🎶`;
  const prices = pricesAt(new Date());
  return [
    `${hello} C'est Dédikace.`,
    line,
    "",
    `Tu peux les relire et lancer ta chanson ici : ${orderUrl(o.id)}`,
    "",
    `${formatXaf(prices.momo)} pour 2 versions, par MTN MoMo ou Orange Money${prices.launchEnds ? ` (prix de lancement jusqu'au ${prices.launchEnds})` : ""}. Une question ? Réponds ici 🙂`,
  ].join("\n");
}

function reminderMessageEn(o: Pick<ReminderRow, "id" | "status" | "recipientName" | "senderName">): string {
  const hello = o.senderName ? `Hi ${o.senderName} 👋` : "Hi 👋";
  const line =
    o.status === "payment_failed"
      ? `Your payment for ${o.recipientName}’s song didn’t go through, but your lyrics are safely kept ✍🏾`
      : `The lyrics of your song for ${o.recipientName} are ready and waiting for you ✍🏾🎶`;
  const prices = pricesAt(new Date());
  return [
    `${hello} It’s Dédikace.`,
    line,
    "",
    `You can read them again and start your song here: ${orderUrl(o.id, "en")}`,
    "",
    `${formatXaf(prices.momo, "en")} for 2 versions, with MTN MoMo or Orange Money${prices.launchEndsEn ? ` (launch price until ${prices.launchEndsEn})` : ""}. A question? Reply here 🙂`,
  ].join("\n");
}

/** À relancer d'abord (jamais relancées), puis celles déjà relancées sur les 7 derniers jours. */
export async function listToRemind(): Promise<{ todo: ReminderRow[]; done: ReminderRow[] }> {
  const now = Date.now();
  const rows = await db
    .select({
      id: orders.id,
      publicCode: orders.publicCode,
      status: orders.status,
      recipientName: orders.recipientName,
      senderName: orders.senderName,
      occasion: orders.occasion,
      whatsappPhone: orders.whatsappPhone,
      locale: orders.locale,
      updatedAt: orders.updatedAt,
      remindedAt: orders.remindedAt,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.status, [...UNPAID]),
        isNotNull(orders.lyrics),
        lt(orders.updatedAt, new Date(now - REMIND_AFTER_MS)),
        gte(orders.updatedAt, new Date(now - REMIND_UNTIL_MS)),
      ),
    )
    .orderBy(desc(orders.updatedAt))
    .limit(100);
  const typed = rows as ReminderRow[];
  return { todo: typed.filter((r) => !r.remindedAt), done: typed.filter((r) => r.remindedAt) };
}

/** Marque la relance WhatsApp (une seule fois : la première date est gardée). */
export async function markReminded(orderId: string): Promise<void> {
  await db
    .update(orders)
    .set({ remindedAt: new Date(), ...keepUpdatedAt })
    .where(and(eq(orders.id, orderId), isNull(orders.remindedAt)));
}

/** Sur 30 jours : commandes relancées (WhatsApp ou e-mail) et combien ont payé ensuite. */
export async function getReminderStats(): Promise<{ reminded: number; paidAfter: number }> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60_000);
  // Relancée par WhatsApp ou par e-mail.
  const relanced = and(gte(orders.createdAt, since), or(isNotNull(orders.remindedAt), isNotNull(orders.reminderEmailedAt)));
  const [[all], [paid]] = await Promise.all([
    db.select({ n: count() }).from(orders).where(relanced),
    db
      .select({ n: count() })
      .from(orders)
      .where(and(relanced, inArray(orders.status, ["paid", "generating", "delivered", "generation_failed"]))),
  ]);
  return { reminded: all.n, paidAfter: paid.n };
}

/**
 * Relance par e-mail, appelée par Inngest 1 h après les premières paroles.
 * Ne fait rien si la commande est payée, n'a pas d'espace client ou a déjà reçu l'e-mail.
 */
export async function emailReminderIfUnpaid(orderId: string): Promise<"sent" | "skipped"> {
  const [row] = await db
    .select({
      id: orders.id,
      status: orders.status,
      recipientName: orders.recipientName,
      locale: orders.locale,
      emailedAt: orders.reminderEmailedAt,
      email: users.email,
      name: users.name,
    })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.userId))
    .where(eq(orders.id, orderId));
  if (!row || row.emailedAt || !row.email) return "skipped";
  if (row.status !== "lyrics_ready" && row.status !== "payment_failed") return "skipped";

  // On réserve l'envoi d'abord : deux exécutions en même temps n'envoient qu'un e-mail.
  const [claimed] = await db
    .update(orders)
    .set({ reminderEmailedAt: new Date(), ...keepUpdatedAt })
    .where(and(eq(orders.id, orderId), isNull(orders.reminderEmailedAt)))
    .returning({ id: orders.id });
  if (!claimed) return "skipped";

  try {
    await sendPaymentReminder(row.email, {
      firstName: row.name?.trim().split(/\s+/)[0] || null,
      recipientName: row.recipientName,
      url: orderUrl(row.id, row.locale),
      failed: row.status === "payment_failed",
      locale: row.locale,
    });
  } catch (error) {
    // Envoi raté : on libère la réservation pour que la nouvelle tentative d'Inngest puisse renvoyer.
    await db.update(orders).set({ reminderEmailedAt: null, ...keepUpdatedAt }).where(eq(orders.id, orderId));
    throw error;
  }
  return "sent";
}
