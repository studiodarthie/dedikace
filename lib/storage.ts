import "server-only";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, requireEnv } from "@/lib/env";

// MP3 dans le bucket R2 privé `songs` ; la page publique sert des URL présignées (CLAUDE.md règle 9).
let client: S3Client | undefined;

function s3() {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
  return client;
}

/** Clé de l'objet : {order_id}/v{version}-g{generation}.mp3 (PLAN_DEV prompt 7). */
export function songKey(orderId: string, version: number, generation: number) {
  return `${orderId}/v${version}-g${generation}.mp3`;
}

export async function uploadSong(key: string, audio: Buffer): Promise<void> {
  await s3().send(
    new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, Body: audio, ContentType: "audio/mpeg" }),
  );
}

/** Lien d'écoute temporaire. `downloadName` force le téléchargement sous ce nom. */
export async function getSignedSongUrl(key: string, expiresInSeconds = 3600, downloadName?: string) {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      ...(downloadName && { ResponseContentDisposition: `attachment; filename="${downloadName}"` }),
    }),
    { expiresIn: expiresInSeconds },
  );
}
