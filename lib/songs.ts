import "server-only";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { songs, type Song } from "@/lib/db/schema";

export const VERSIONS = [1, 2] as const;

/** Crée les lignes des 2 versions d'une génération (sans effet si elles existent déjà). */
export async function queueSongs(orderId: string, generation: number): Promise<void> {
  await db
    .insert(songs)
    .values(VERSIONS.map((version) => ({ orderId, version, generation })))
    .onConflictDoNothing({ target: [songs.orderId, songs.version, songs.generation] });
}

export async function markSongGenerating(orderId: string, version: number, generation: number) {
  await db
    .update(songs)
    .set({ status: "generating", attempts: sql`${songs.attempts} + 1`, error: null })
    .where(and(eq(songs.orderId, orderId), eq(songs.version, version), eq(songs.generation, generation)));
}

export async function markSongReady(
  orderId: string,
  version: number,
  generation: number,
  data: { storagePath: string; durationSeconds: number },
) {
  await db
    .update(songs)
    .set({ status: "ready", storagePath: data.storagePath, durationSeconds: data.durationSeconds, error: null })
    .where(and(eq(songs.orderId, orderId), eq(songs.version, version), eq(songs.generation, generation)));
}

export async function markSongError(orderId: string, version: number, generation: number, error: string) {
  await db
    .update(songs)
    .set({ error: error.slice(0, 1000) })
    .where(and(eq(songs.orderId, orderId), eq(songs.version, version), eq(songs.generation, generation)));
}

/** Après l'échec définitif : toute version non prête de cette génération passe à `failed`. */
export async function failUnfinishedSongs(orderId: string, generation: number) {
  await db
    .update(songs)
    .set({ status: "failed" })
    .where(and(eq(songs.orderId, orderId), eq(songs.generation, generation), ne(songs.status, "ready")));
}

/** Les versions à afficher : la génération la plus récente dont les 2 versions sont prêtes. */
export async function getDeliveredSongs(orderId: string): Promise<Song[]> {
  const ready = await db
    .select()
    .from(songs)
    .where(and(eq(songs.orderId, orderId), eq(songs.status, "ready")))
    .orderBy(desc(songs.generation), songs.version);
  const complete = [...new Set(ready.map((s) => s.generation))].find(
    (g) => ready.filter((s) => s.generation === g).length === VERSIONS.length,
  );
  return complete === undefined ? [] : ready.filter((s) => s.generation === complete);
}

export async function getReadyVersions(orderId: string, generation: number): Promise<number[]> {
  const rows = await db
    .select({ version: songs.version })
    .from(songs)
    .where(and(eq(songs.orderId, orderId), eq(songs.generation, generation), eq(songs.status, "ready")));
  return rows.map((r) => r.version);
}

export async function getSongsForOrders(orderIds: string[]): Promise<Song[]> {
  if (orderIds.length === 0) return [];
  return db.select().from(songs).where(inArray(songs.orderId, orderIds));
}
