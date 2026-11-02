// Vérification du Prompt 7 sans serveur Inngest : npm run test:generate
// Exécute la tâche generate-song dans le projet (@inngest/test) sur de vraies commandes de test.
//  1. commande non payée → refus (CLAUDE.md règle 1), aucune chanson créée ;
//  2. commande payée → appel réel à ElevenLabs. Sans offre payante : échec définitif attendu,
//     puis gestion d'échec (statut generation_failed, versions en échec, e-mail d'alerte) ;
//     avec une offre payante : 2 MP3 sur R2 et commande livrée.
import { InngestTestEngine } from "@inngest/test";
import { eq, inArray } from "drizzle-orm";
import { generateSongFunction, handleGenerationFailure } from "@/inngest/generate-song";
import { db } from "@/lib/db";
import { orders, songs } from "@/lib/db/schema";
import { createDraftOrder, getOrderById, setStatus, updateLyrics } from "@/lib/orders";

const LYRICS = `[Couplet 1]
À Douala, le matin se lève,
Ton ndolé parfume la maison.

[Refrain]
Joyeux anniversaire, Mireille,
Maman, tu brilles comme le soleil.`;

const created: string[] = [];
let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function makeOrder(paid: boolean) {
  const order = await createDraftOrder({
    whatsappPhone: "+237600000000",
    occasion: "anniversaire",
    recipientName: "Mireille",
    anecdotes: "Commande créée par scripts/test-generate.ts",
    styleId: "makossa",
    chorusLanguage: "fr",
    voice: "female",
  });
  created.push(order.id);
  await updateLyrics(order.id, { title: "Test", lyrics: LYRICS, kind: "first" });
  await setStatus(order.id, "pending_payment");
  if (paid) await setStatus(order.id, "paid");
  return order.id;
}

const songsOf = (orderId: string) => db.select().from(songs).where(eq(songs.orderId, orderId));

async function run(orderId: string) {
  const t = new InngestTestEngine({ function: generateSongFunction });
  return t.execute({ events: [{ name: "order/paid", data: { orderId, generation: 1 } }] });
}

async function main() {
  console.log("1. Commande non payée");
  const unpaid = await makeOrder(false);
  const r1 = await run(unpaid);
  check("génération refusée", !!r1.error, String((r1.error as Error | undefined)?.message ?? "aucune erreur"));
  check("aucune chanson créée", (await songsOf(unpaid)).length === 0);
  check("statut inchangé", (await getOrderById(unpaid))?.status === "pending_payment");

  console.log("\n2. Commande payée");
  const paid = await makeOrder(true);
  const r2 = await run(paid);
  const rows = await songsOf(paid);
  if (r2.error) {
    const message = (r2.error as Error).message;
    console.log(`  échec de la génération : ${message.slice(0, 160)}`);
    check("2 versions préparées", rows.length === 2);
    check("erreur enregistrée", rows.some((s) => !!s.error));
    // Laisse finir une éventuelle version encore en cours avant la gestion d'échec.
    await new Promise((r) => setTimeout(r, 3000));
    await handleGenerationFailure(paid, 1, message);
    const after = await getOrderById(paid);
    const rowsAfter = await songsOf(paid);
    check("commande en generation_failed", after?.status === "generation_failed", after?.status);
    check("versions en échec", rowsAfter.every((s) => s.status === "failed"));
    console.log("  → e-mail d'alerte envoyé aux adresses ADMIN_EMAILS (vérifie ta boîte)");
  } else {
    const order = await getOrderById(paid);
    check("commande livrée", order?.status === "delivered", order?.status);
    check("2 MP3 prêts", rows.filter((s) => s.status === "ready").length === 2);
    console.log(`  page : http://localhost:3000/s/${order?.publicCode} (commande conservée pour l'écoute)`);
    created.splice(created.indexOf(paid), 1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    failures++;
  })
  .finally(async () => {
    if (created.length) await db.delete(orders).where(inArray(orders.id, created));
    console.log(failures === 0 ? "\nTout est OK." : `\n${failures} vérification(s) en échec.`);
    process.exit(failures === 0 ? 0 : 1);
  });
