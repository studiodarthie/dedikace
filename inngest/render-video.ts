import { NonRetriableError } from "inngest";
import { getOrderById } from "@/lib/orders";
import { getDeliveredSongs, SONG_SECONDS } from "@/lib/songs";
import { deleteObject, downloadObject, uploadObject, videoKeys } from "@/lib/storage";
import { renderStatusVideo } from "@/lib/video";
import { claimVideo, getVideo, markVideo } from "@/lib/videos";
import { inngest, videoRequested } from "./client";

/** Fabrique la vidéo statut (30 s, ~30 à 60 s de calcul) à partir de la photo et de la version 1 de la chanson. */
export const renderVideoFunction = inngest.createFunction(
  {
    id: "render-video",
    name: "Créer la vidéo statut WhatsApp",
    triggers: [videoRequested],
    retries: 1,
    // Le calcul vidéo est lourd : 2 à la fois au plus (claimVideo empêche un double calcul).
    concurrency: [{ limit: 2 }],
    onFailure: async ({ event, error }) => {
      await markVideo(event.data.event.data.videoId, { status: "failed", error: error.message.slice(0, 500) });
    },
  },
  async ({ event, step }) => {
    const { videoId } = event.data;
    return step.run("fabriquer la vidéo", async () => {
      const video = await claimVideo(videoId);
      if (!video) throw new NonRetriableError(`Vidéo ${videoId} introuvable ou déjà terminée.`);
      const order = await getOrderById(video.orderId);
      if (!order?.lyrics) throw new NonRetriableError("Commande ou paroles introuvables.");
      const song = (await getDeliveredSongs(order.id)).find((s) => s.version === 1);
      if (!song?.storagePath) throw new NonRetriableError("Chanson pas encore prête.");

      const [photo, audio] = await Promise.all([downloadObject(video.photoKey), downloadObject(song.storagePath)]);
      const mp4 = await renderStatusVideo({
        photo,
        audio,
        recipientName: order.recipientName,
        title: order.title ?? `Pour ${order.recipientName}`,
        lyrics: order.lyrics,
        songSeconds: song.durationSeconds ?? SONG_SECONDS,
      });
      const key = videoKeys(order.id, `${video.id.slice(0, 8)}-${video.renders}`).video;
      await uploadObject(key, mp4, "video/mp4");

      // La photo a pu changer pendant le calcul : on ne publie que si c'est toujours la même demande.
      const latest = await getVideo(order.id);
      if (latest?.photoKey !== video.photoKey) {
        await deleteObject(key).catch(() => {});
        return { skipped: true };
      }
      await markVideo(video.id, { status: "ready", videoKey: key, error: null });
      if (video.videoKey && video.videoKey !== key) await deleteObject(video.videoKey).catch(() => {});
      return { bytes: mp4.length };
    });
  },
);
