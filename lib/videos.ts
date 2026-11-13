import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { sendVideoRequested } from "@/inngest/client";
import { db } from "@/lib/db";
import { videos, type Order, type Video } from "@/lib/db/schema";
import { deleteObject, getSignedSongUrl, uploadObject, videoKeys } from "@/lib/storage";

// Vidéo statut (docs/PLAN_CROISSANCE.md, étape 4) : données et règles. La fabrication est dans lib/video.ts.

/** Une commande peut créer 5 vidéos au plus (changements de photo compris). */
export const MAX_RENDERS = 5;
export const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

export class VideoRequestError extends Error {}

/**
 * Seul l'acheteur crée la vidéo : il a l'identifiant privé de la commande sur son téléphone
 * (lib/my-orders.ts), ou il est connecté à l'espace qui possède la commande.
 */
export function isOwner(order: Order, rememberedIds: string[], userId: string | null | undefined): boolean {
  return rememberedIds.includes(order.id) || (!!userId && order.userId === userId);
}

export async function getVideo(orderId: string): Promise<Video | undefined> {
  const [video] = await db.select().from(videos).where(eq(videos.orderId, orderId));
  return video;
}

/** Lien temporaire (1 h) vers le MP4, en lecture ou en téléchargement. */
export async function videoUrls(video: Video, recipientName: string) {
  if (video.status !== "ready" || !video.videoKey) return null;
  const safe = recipientName.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    play: await getSignedSongUrl(video.videoKey, 3600),
    download: await getSignedSongUrl(video.videoKey, 3600, `Dedikace-${safe || "chanson"}-statut.mp4`),
  };
}

/** Photo reçue : vérifiée, remise droite, réduite (1080 px), enregistrée, puis la création est lancée. */
export async function requestVideo(order: Order, photo: Buffer): Promise<Video> {
  if (order.status !== "delivered") throw new VideoRequestError("La vidéo se crée une fois la chanson prête.");
  const current = await getVideo(order.id);
  if (current && (current.status === "queued" || current.status === "rendering")) {
    throw new VideoRequestError("Ta vidéo est déjà en préparation. Patiente une petite minute.");
  }
  if (current && current.renders >= MAX_RENDERS) {
    throw new VideoRequestError("Tu as déjà créé 5 vidéos pour cette chanson. Écris-nous sur WhatsApp si besoin.");
  }

  let jpeg: Buffer;
  try {
    const meta = await sharp(photo).metadata();
    if (!meta.width || !meta.height || meta.width < 300 || meta.height < 300) {
      throw new VideoRequestError("Cette photo est trop petite. Choisis-en une plus grande.");
    }
    jpeg = await sharp(photo).rotate().resize(1080, 1920, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
  } catch (error) {
    if (error instanceof VideoRequestError) throw error;
    throw new VideoRequestError("On n'arrive pas à lire cette photo. Essaie avec une autre (JPG ou PNG).");
  }

  const keys = videoKeys(order.id, randomBytes(6).toString("hex"));
  await uploadObject(keys.photo, jpeg, "image/jpeg");

  const [video] = await db
    .insert(videos)
    .values({ orderId: order.id, photoKey: keys.photo, status: "queued" })
    .onConflictDoUpdate({
      target: videos.orderId,
      set: { photoKey: keys.photo, status: "queued", error: null, renders: sql`${videos.renders} + 1` },
    })
    .returning();
  // Ancienne photo : plus utile.
  if (current && current.photoKey !== keys.photo) await deleteObject(current.photoKey).catch(() => {});

  await sendVideoRequested(video.id, video.renders);
  return video;
}

export async function markVideo(videoId: string, data: Partial<Pick<Video, "status" | "videoKey" | "error">>) {
  await db.update(videos).set(data).where(eq(videos.id, videoId));
}

/** Passe en « rendering » seulement depuis « queued » (une 2ᵉ exécution simultanée ne refait pas le travail). */
export async function claimVideo(videoId: string): Promise<Video | undefined> {
  const [video] = await db
    .update(videos)
    .set({ status: "rendering" })
    .where(and(eq(videos.id, videoId), sql`${videos.status} in ('queued', 'rendering')`))
    .returning();
  return video;
}
