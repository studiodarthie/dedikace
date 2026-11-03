// Vérification des Prompts 9 à 11 SANS débiter d'argent : npm run test:payments
// (le serveur local doit tourner : npm run dev)
//  1. décision après vérification : réussi, échec, abandon, mauvais montant, confirmation reçue deux fois
//     ou en même temps → une seule génération (CLAUDE.md règle 2) ;
//  2. webhook : clé absente ou fausse refusée, notification inconnue ignorée ;
//  3. page d'attente : statut renvoyé par /api/commande/[id].
// Les réponses de Tranzak sont simulées ; les e-mails d'alerte et l'envoi à Inngest sont désactivés.
import { loadEnvConfig } from "@next/env";

delete process.env.RESEND_API_KEY;
const APP = "http://localhost:3000";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function main() {
  const { eq, inArray, sql } = await import("drizzle-orm");
  const { inngest } = await import("@/inngest/client");
  const { db } = await import("@/lib/db");
  const { orders, payments, events } = await import("@/lib/db/schema");
  const { createDraftOrder, getOrderById, updateLyrics } = await import("@/lib/orders");
  const { applyVerifiedStatus } = await import("@/lib/payments");

  // Compte les événements « order/paid » au lieu de les envoyer.
  const sent: string[] = [];
  const sentIds: string[] = [];
  (inngest as unknown as { send: (p: { id?: string; data: { orderId: string } }) => Promise<unknown> }).send = async (p) => {
    sent.push(p.data.orderId);
    if (p.id) sentIds.push(p.id);
    return { ids: [] };
  };

  const created: string[] = [];
  async function makeOrder() {
    const order = await createDraftOrder({
      whatsappPhone: "+237600000000",
      occasion: "anniversaire",
      recipientName: "Test",
      anecdotes: "Commande créée par scripts/test-payments.ts",
      styleId: "makossa",
      chorusLanguage: "fr",
      voice: "female",
    });
    created.push(order.id);
    await updateLyrics(order.id, { title: "Test", lyrics: "[Refrain]\nTest", kind: "first" });
    return order;
  }

  // Imite startPayment sans appeler Tranzak.
  async function makePayment(orderId: string, amountXaf = 100) {
    await db.update(orders).set({ status: "pending_payment" }).where(eq(orders.id, orderId));
    const ref = `test${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const [payment] = await db
      .insert(payments)
      .values({ orderId, merchantRef: ref, providerRequestId: `REQ_${ref}`, amountXaf, channel: "mtn" })
      .returning();
    return payment;
  }

  const details = (p: { providerRequestId: string | null; merchantRef: string; amountXaf: number }, status: string, amount = p.amountXaf) => ({
    requestId: p.providerRequestId!,
    mchTransactionRef: p.merchantRef,
    amount,
    currencyCode: "XAF",
    status,
  });

  try {
    console.log("1. Décision après vérification chez Tranzak");

    const o1 = await makeOrder();
    const p1 = await makePayment(o1.id);
    check("en cours → reste en attente", (await applyVerifiedStatus(p1, details(p1, "PAYMENT_IN_PROGRESS"))) === "pending");
    check("réussi → succès", (await applyVerifiedStatus(p1, details(p1, "SUCCESSFUL"))) === "successful");
    check("commande payée", (await getOrderById(o1.id))?.status === "paid");
    check("1 création lancée", sent.filter((id) => id === o1.id).length === 1);
    await applyVerifiedStatus(p1, details(p1, "SUCCESSFUL"));
    check("notification reçue 2 fois → toujours 1 création", sent.filter((id) => id === o1.id).length === 1);
    const succeeded = await db.select().from(events).where(eq(events.orderId, o1.id));
    check("événement payment_succeeded enregistré 1 fois", succeeded.filter((e) => e.type === "payment_succeeded").length === 1);

    const o2 = await makeOrder();
    const p2 = await makePayment(o2.id);
    await Promise.all([1, 2, 3].map(() => applyVerifiedStatus(p2, details(p2, "SUCCESSFUL"))));
    check("3 confirmations simultanées → 1 création", sent.filter((id) => id === o2.id).length === 1);

    // Filet de sécurité : payée depuis plus de 30 s sans création → renvoi avec le MÊME identifiant.
    await db.execute(sql`update orders set updated_at = now() - interval '1 minute' where id = ${o1.id}`);
    await applyVerifiedStatus(p1, details(p1, "SUCCESSFUL"));
    const ids = sentIds.filter((id) => id.includes(o1.id));
    check("création perdue → renvoyée avec le même identifiant (Inngest ignore le doublon)", ids.length === 2 && ids[0] === ids[1], ids.join(", "));

    const o3 = await makeOrder();
    const p3 = await makePayment(o3.id);
    check("échec (solde insuffisant…) → échec", (await applyVerifiedStatus(p3, details(p3, "FAILED"))) === "failed");
    check("commande en payment_failed", (await getOrderById(o3.id))?.status === "payment_failed");

    const o4 = await makeOrder();
    const p4 = await makePayment(o4.id);
    await applyVerifiedStatus(p4, details(p4, "CANCELLED_BY_PAYER"));
    const [p4After] = await db.select().from(payments).where(eq(payments.id, p4.id));
    check("abandon par le client → paiement annulé", p4After.status === "cancelled", p4After.status);

    const o5 = await makeOrder();
    const p5 = await makePayment(o5.id, 3000);
    const r5 = await applyVerifiedStatus(p5, details(p5, "SUCCESSFUL", 100));
    check("montant payé trop faible → refusé", r5 === "failed" && (await getOrderById(o5.id))?.status !== "paid");
    check("aucune création pour ce paiement", !sent.includes(o5.id));

    console.log("\n2. Webhook /api/tranzak/webhook");
    loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
    const key = process.env.TRANZAK_WEBHOOK_AUTH_KEY ?? "";
    const post = (body: unknown) =>
      fetch(`${APP}/api/tranzak/webhook`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const tpn = { name: "Tranzak Payment Notification (TPN)", eventType: "REQUEST.COMPLETED", resourceId: "REQ_INCONNU", resource: { requestId: "REQ_INCONNU", status: "SUCCESSFUL" } };
    check("sans clé → refusé (401)", (await post(tpn)).status === 401);
    check("fausse clé → refusé (401)", (await post({ ...tpn, authKey: "fausse" })).status === 401);
    check("bonne clé, paiement inconnu → ignoré (200)", (await post({ ...tpn, authKey: key })).status === 200);
    check("corps illisible → refusé", (await fetch(`${APP}/api/tranzak/webhook`, { method: "POST", body: "pas du json" })).status === 401);

    console.log("\n3. Page d'attente");
    const status = await fetch(`${APP}/api/commande/${o1.id}`).then((r) => r.json());
    check("/api/commande renvoie le statut", status.status === "paid", status.status);
    check("identifiant invalide → 404", (await fetch(`${APP}/api/commande/pas-un-id`)).status === 404);
    check("page /commande/[id] s'affiche", (await fetch(`${APP}/commande/${o1.id}`)).status === 200);
  } finally {
    // Les événements de test ne doivent pas gonfler les compteurs du jour.
    if (created.length) await db.delete(events).where(inArray(events.orderId, created));
    if (created.length) await db.delete(orders).where(inArray(orders.id, created));
  }
}

main()
  .catch((e) => {
    console.error(e);
    failures++;
  })
  .finally(() => {
    console.log(failures === 0 ? "\nTout est OK." : `\n${failures} vérification(s) en échec.`);
    process.exit(failures === 0 ? 0 : 1);
  });
