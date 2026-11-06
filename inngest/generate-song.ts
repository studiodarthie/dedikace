import { NonRetriableError } from "inngest";
import { sendAdminAlert } from "@/lib/email";
import { generateSong, MusicError } from "@/lib/elevenlabs";
import { getOrderById, setStatus } from "@/lib/orders";
import {
  failUnfinishedSongs,
  getReadyVersions,
  markSongError,
  markSongGenerating,
  markSongReady,
  queueSongs,
  VERSIONS,
} from "@/lib/songs";
import { songKey, uploadSong } from "@/lib/storage";
import { stylePromptFor, type StyleId } from "@/lib/styles";
import { inngest, orderPaid } from "./client";

const SONG_SECONDS = 180;

// Statuts depuis lesquels une génération peut démarrer (PRD §6) :
// paid (première création), delivered (régénération gratuite), generation_failed (relance admin).
// generating : l'étape a déjà tourné une fois (reprise après une erreur passagère).
const STARTABLE = new Set(["paid", "delivered", "generation_failed", "generating"]);

/** Échec définitif après les 3 tentatives : statut generation_failed + alerte admin. */
export async function handleGenerationFailure(orderId: string, generation: number, message: string) {
  await failUnfinishedSongs(orderId, generation);
  await setStatus(orderId, "generation_failed").catch(() => {});
  const order = await getOrderById(orderId);
  await sendAdminAlert(
    `Échec de création — commande ${order?.publicCode ?? orderId}`,
    [
      `Commande : ${orderId} (code ${order?.publicCode ?? "?"})`,
      `Génération : ${generation}`,
      `Client : ${order?.whatsappPhone ?? "?"}`,
      `Erreur : ${message}`,
      "",
      "Relancer depuis le back-office une fois le problème réglé.",
    ].join("\n"),
  );
}

export const generateSongFunction = inngest.createFunction(
  {
    id: "generate-song",
    name: "Créer les 2 versions d'une chanson",
    triggers: [orderPaid],
    // Chaque étape est tentée 1 + 2 fois (3 tentatives), avec un délai croissant entre deux essais.
    retries: 2,
    // Une seule génération à la fois par commande.
    concurrency: { key: "event.data.orderId", limit: 1 },
    onFailure: async ({ event, error }) => {
      const { orderId, generation } = event.data.event.data;
      await handleGenerationFailure(orderId, generation, error.message);
    },
  },
  async ({ event, step }) => {
    const { orderId, generation } = event.data;

    const order = await step.run("préparer la commande", async () => {
      const current = await getOrderById(orderId);
      if (!current) throw new NonRetriableError(`Commande introuvable : ${orderId}`);
      // Règle 1 : seule une commande payée (ou déjà livrée) peut produire de la musique.
      if (!STARTABLE.has(current.status)) {
        throw new NonRetriableError(`Statut ${current.status} : génération refusée.`);
      }
      if (!current.lyrics) throw new NonRetriableError("Pas de paroles enregistrées.");
      if (current.status !== "generating") await setStatus(orderId, "generating");
      await queueSongs(orderId, generation);
      // Relance : les versions déjà prêtes ne sont pas recréées (pas de crédit ElevenLabs gaspillé).
      const ready = await getReadyVersions(orderId, generation);
      return {
        readyVersions: ready,
        lyrics: current.lyrics,
        styleId: current.styleId as StyleId,
        voice: current.voice,
        songLanguage: current.songLanguage,
        chorusLanguage: current.chorusLanguage,
      };
    });

    // Les 2 versions en parallèle, chacune dans sa propre étape (réessayée indépendamment).
    await Promise.all(
      VERSIONS.filter((version) => !order.readyVersions.includes(version)).map((version) =>
        step.run(`créer la version ${version}`, async () => {
          await markSongGenerating(orderId, version, generation);
          try {
            const song = await generateSong({
              stylePrompt: stylePromptFor(order.styleId, order.voice),
              lyrics: order.lyrics,
              songLanguage: order.songLanguage,
              chorusLanguage: order.chorusLanguage,
              durationSeconds: SONG_SECONDS,
            });
            const key = songKey(orderId, version, generation);
            await uploadSong(key, song.audio);
            await markSongReady(orderId, version, generation, { storagePath: key, durationSeconds: song.durationSeconds });
            return { key, songId: song.songId };
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await markSongError(orderId, version, generation, message);
            if (error instanceof MusicError && !error.retryable) throw new NonRetriableError(message, { cause: error });
            throw error;
          }
        }),
      ),
    );

    await step.run("livrer", async () => {
      await setStatus(orderId, "delivered");
    });

    return { orderId, generation, status: "delivered" };
  },
);
