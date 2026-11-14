// Vérification du Prompt 12 (back-office) : npm run test:admin (le serveur local doit tourner : npm run dev)
//  1. sans session : aucune donnée visible ; session d'une adresse hors liste : refusée ;
//  2. avec une session admin : tableau de bord et fiche commande s'affichent ;
//  3. actions : paiement manuel, relance, remboursement (envoi à Inngest simulé).
import { randomBytes } from "node:crypto";

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
  const { events, orders, payments, sessions, users } = await import("@/lib/db/schema");
  const { env } = await import("@/lib/env");
  const { createDraftOrder, getOrderById, updateLyrics } = await import("@/lib/orders");
  const admin = await import("@/lib/admin");

  const sentIds: string[] = [];
  (inngest as unknown as { send: (p: { id?: string }) => Promise<unknown> }).send = async (p) => {
    sentIds.push(p.id ?? "");
    return { ids: [] };
  };

  const created: string[] = [];
  const userIds: string[] = [];
  const tokens: string[] = [];
  async function makeOrder() {
    const order = await createDraftOrder({
      whatsappPhone: "+237600000000",
      occasion: "anniversaire",
      recipientName: "TestAdmin",
      anecdotes: "Commande créée par scripts/test-admin.ts",
      styleId: "makossa",
      chorusLanguage: "fr",
      voice: "female",
    });
    created.push(order.id);
    await updateLyrics(order.id, { title: "Test admin", lyrics: "[Refrain]\nTest", kind: "first" });
    return order;
  }
  async function sessionFor(email: string) {
    const [user] = await db.insert(users).values({ email }).returning();
    userIds.push(user.id);
    return addSession(user.id);
  }
  async function addSession(userId: string) {
    const token = randomBytes(32).toString("hex");
    tokens.push(token);
    await db.insert(sessions).values({ sessionToken: token, userId, expires: new Date(Date.now() + 3600_000) });
    return `authjs.session-token=${token}`;
  }
  const page = (path: string, cookie?: string) =>
    fetch(`${APP}${path}`, { headers: cookie ? { cookie } : {} }).then(async (r) => ({ status: r.status, html: await r.text() }));

  try {
    const order = await makeOrder();

    console.log("1. Accès refusé");
    const anon = await page("/admin");
    check("sans session : pas de données", !anon.html.includes("Formulaires commencés"));
    const intruder = await sessionFor(`intrus-${Date.now()}@exemple.com`);
    const asIntruder = await page("/admin", intruder);
    check("session hors liste : pas de données", !asIntruder.html.includes("Formulaires commencés"));
    const detailIntruder = await page(`/admin/commandes/${order.id}`, intruder);
    check("fiche commande hors liste : pas de données", !detailIntruder.html.includes("TestAdmin"));

    console.log("\n2. Pages admin");
    const cookie = await sessionFor(env.ADMIN_EMAILS[0]).catch(async () => {
      // L'adresse admin existe peut-être déjà (vraie connexion) : on lui ajoute une session de test.
      const [user] = await db.select().from(users).where(eq(users.email, env.ADMIN_EMAILS[0]));
      return addSession(user.id);
    });
    const dash = await page("/admin", cookie);
    check("tableau de bord", dash.status === 200 && dash.html.includes("Formulaires commencés"));
    check("la commande de test est listée", dash.html.includes("TestAdmin"));
    const filtered = await page("/admin?statut=delivered", cookie);
    check("filtre par statut", filtered.status === 200 && !filtered.html.includes("TestAdmin"));
    const detail = await page(`/admin/commandes/${order.id}`, cookie);
    check("fiche commande", detail.status === 200 && detail.html.includes("Test admin") && detail.html.includes("Valider un paiement manuel"));

    console.log("\n3. Actions");
    await admin.validateManualPayment(order.id, { amountXaf: 3000, reference: "TEST-REF" }, "test@admin");
    const paid = await getOrderById(order.id);
    check("paiement manuel → commande payée", paid?.status === "paid");
    check("paiement manuel → création lancée", sentIds.includes(`order-paid-${order.id}-g1`));
    const [manual] = await db.select().from(payments).where(eq(payments.orderId, order.id));
    check("paiement manuel enregistré", manual?.channel === "manual" && manual.status === "successful" && manual.amountXaf === 3000);
    await admin.validateManualPayment(order.id, { amountXaf: 3000, reference: "X" }, "t").then(
      () => check("2e validation refusée", false),
      (e) => check("2e validation refusée", e instanceof admin.AdminError),
    );

    await admin.relaunchGeneration(order.id, "t").then(
      () => check("relance refusée si la création vient de démarrer", false),
      (e) => check("relance refusée si la création vient de démarrer", e instanceof admin.AdminError),
    );
    await db.update(orders).set({ status: "generation_failed" }).where(eq(orders.id, order.id));
    await admin.relaunchGeneration(order.id, "t");
    const relaunchId = sentIds.at(-1) ?? "";
    check("relance après échec → nouvel identifiant", relaunchId.startsWith(`order-paid-${order.id}-g1-r`), relaunchId);
    await db.execute(sql`update orders set status = 'generating', updated_at = now() - interval '20 minutes' where id = ${order.id}`);
    check("création bloquée 20 min → relançable", admin.canRelaunch((await getOrderById(order.id))!));

    await admin.markRefunded(order.id, "t");
    check("remboursement → statut remboursée", (await getOrderById(order.id))?.status === "refunded");
    const [refunded] = await db.select().from(payments).where(eq(payments.orderId, order.id));
    check("remboursement → paiement remboursé", refunded.status === "refunded");
    const draft = await makeOrder();
    await admin.markRefunded(draft.id, "t").then(
      () => check("remboursement refusé sans paiement", false),
      (e) => check("remboursement refusé sans paiement", e instanceof admin.AdminError),
    );

    const { getDashboard } = await import("@/lib/admin-stats");
    const stats = await getDashboard("jour");
    // Le paiement de test vient d'être remboursé : il sort du chiffre d'affaires mais reste dans le parcours.
    check("compteurs du jour", stats.funnel.paymentSucceeded >= 1 && stats.sales.orders >= 0, JSON.stringify(stats.funnel));
    const found = await admin.listOrders(undefined, order.publicCode);
    check("recherche par code", found.some((o) => o.id === order.id));
  } finally {
    // Les événements de test ne doivent pas gonfler les compteurs du jour.
    if (created.length) await db.delete(events).where(inArray(events.orderId, created));
    if (created.length) await db.delete(orders).where(inArray(orders.id, created));
    if (tokens.length) await db.delete(sessions).where(inArray(sessions.sessionToken, tokens));
    if (userIds.length) await db.delete(users).where(inArray(users.id, userIds));
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
