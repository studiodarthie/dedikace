// Vérification du Prompt 2 (docs/PLAN_DEV.md) : npm run test:orders
// Crée une commande de test, vérifie les transitions de statut, puis la supprime.
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import {
  createDraftOrder,
  getOrderByPublicCode,
  MAX_REWRITES,
  OrderError,
  setStatus,
  trackEvent,
  updateLyrics,
} from "@/lib/orders";

let failures = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failures++;
}

async function expectOrderError(label: string, fn: () => Promise<unknown>, code: OrderError["code"]) {
  try {
    await fn();
    check(label, false);
  } catch (e) {
    check(label, e instanceof OrderError && e.code === code);
  }
}

async function main() {
  const order = await createDraftOrder({
    whatsappPhone: "+237600000000",
    occasion: "anniversaire",
    recipientName: "Test",
    relation: "ami",
    anecdotes: "Commande créée par scripts/test-orders.ts",
    styleId: "makossa",
    chorusLanguage: "fr",
    voice: "female",
  });

  try {
    check("commande créée en draft", order.status === "draft");
    check("code public de 8 caractères sans 0/o/1/l/i", /^[2-9a-hjkmnp-z]{8}$/.test(order.publicCode));

    await expectOrderError("draft → paid refusé", () => setStatus(order.id, "paid"), "invalid_transition");

    const ready = await updateLyrics(order.id, { title: "Joyeux anniversaire", lyrics: "[Refrain] ...", kind: "first" });
    check("draft → lyrics_ready", ready.status === "lyrics_ready");

    for (let i = 0; i < MAX_REWRITES; i++) {
      await updateLyrics(order.id, { title: "v", lyrics: "...", kind: "rewrite" });
    }
    await expectOrderError(
      "4e réécriture refusée",
      () => updateLyrics(order.id, { title: "v", lyrics: "...", kind: "rewrite" }),
      "rewrite_limit",
    );
    const edited = await updateLyrics(order.id, { title: "v", lyrics: "modif manuelle", kind: "edited" });
    check("modification manuelle toujours possible", edited.lyrics === "modif manuelle");

    await setStatus(order.id, "pending_payment");
    // Deux confirmations simultanées : une seule doit réussir (idempotence).
    const results = await Promise.allSettled([setStatus(order.id, "paid"), setStatus(order.id, "paid")]);
    check("double confirmation : une seule réussit", results.filter((r) => r.status === "fulfilled").length === 1);

    const found = await getOrderByPublicCode(order.publicCode.toUpperCase());
    check("recherche par code public", found?.id === order.id);

    await trackEvent("form_started", order.id);
    check("événement enregistré", true);
  } finally {
    await db.delete(orders).where(eq(orders.id, order.id));
  }

  console.log(failures === 0 ? "\nTout est OK." : `\n${failures} vérification(s) en échec.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
