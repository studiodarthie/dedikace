// Crée une commande de démonstration « livrée » avec 2 MP3 de test, pour voir la page /s/[code]
// sans dépenser de crédits ElevenLabs : npm run seed:song -- chemin/vers/un.mp3
// Supprimer ensuite : npm run seed:song -- --supprimer <code>
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { createDraftOrder, getOrderByPublicCode, setStatus, updateLyrics } from "@/lib/orders";
import { markSongReady, queueSongs, VERSIONS } from "@/lib/songs";
import { songKey, uploadSong } from "@/lib/storage";

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--supprimer") {
    const order = await getOrderByPublicCode(args[1] ?? "");
    if (!order) throw new Error("Code introuvable.");
    await db.delete(orders).where(eq(orders.id, order.id));
    console.log(`Commande ${order.publicCode} supprimée (les MP3 de test restent sur R2 sous ${order.id}/).`);
    return;
  }
  if (!args[0]) throw new Error("Donne le chemin d'un MP3 de test.");
  const audio = readFileSync(args[0]);

  const order = await createDraftOrder({
    whatsappPhone: "+237600000000",
    occasion: "anniversaire",
    recipientName: "Mireille",
    relation: "mère",
    senderName: "Junior",
    anecdotes: "Démonstration créée par scripts/seed-song.ts",
    styleId: "makossa",
    chorusLanguage: "fr",
    voice: "female",
  });
  await updateLyrics(order.id, { title: "Maman Mireille", lyrics: "[Refrain]\nJoyeux anniversaire, Mireille", kind: "first" });
  for (const status of ["pending_payment", "paid", "generating"] as const) await setStatus(order.id, status);
  await queueSongs(order.id, 1);
  for (const version of VERSIONS) {
    const key = songKey(order.id, version, 1);
    await uploadSong(key, audio);
    await markSongReady(order.id, version, 1, { storagePath: key, durationSeconds: 5 });
  }
  await setStatus(order.id, "delivered");
  console.log(`CODE=${order.publicCode}`);
  console.log(`Page : http://localhost:3000/s/${order.publicCode}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
