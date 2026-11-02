// Vérifie que les clés R2, Resend et ElevenLabs de .env.local fonctionnent : npm run check:services
// N'affiche jamais les clés. Le test R2 écrit puis supprime un petit fichier.
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const e = process.env;

async function r2() {
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${e.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: e.R2_ACCESS_KEY_ID!, secretAccessKey: e.R2_SECRET_ACCESS_KEY! },
  });
  const Bucket = e.R2_BUCKET ?? "songs";
  const Key = `_test/check-${Date.now()}.txt`;
  await s3.send(new PutObjectCommand({ Bucket, Key, Body: "dedikace", ContentType: "text/plain" }));
  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket, Key }), { expiresIn: 60 });
  const viaSigned = await fetch(url).then((r) => r.text());
  const publicTry = await fetch(`https://${e.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${Bucket}/${Key}`);
  await s3.send(new DeleteObjectCommand({ Bucket, Key }));
  return `écriture OK, lecture par lien signé ${viaSigned === "dedikace" ? "OK" : "ÉCHEC"}, accès sans signature refusé : ${publicTry.status >= 400 ? "oui" : "NON"}`;
}

async function resend() {
  const res = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${e.RESEND_API_KEY}` } });
  const body = (await res.json().catch(() => ({}))) as { data?: { name: string; status: string }[]; name?: string };
  if (res.ok) return `clé valide, domaines : ${body.data?.map((d) => `${d.name} (${d.status})`).join(", ") || "aucun"}`;
  return `HTTP ${res.status} ${body.name ?? ""}`;
}

async function elevenlabs() {
  // Une clé limitée à « Music » ne peut pas lire /v1/user : un refus 401 « missing permission » prouve qu'elle est reconnue.
  const res = await fetch("https://api.elevenlabs.io/v1/user", { headers: { "xi-api-key": e.ELEVENLABS_API_KEY! } });
  const text = await res.text();
  if (res.ok) return "clé valide (accès complet)";
  if (/permission/i.test(text)) return "clé reconnue, limitée comme prévu (pas d'accès au compte)";
  return `HTTP ${res.status} ${text.slice(0, 160)}`;
}

async function main() {
  for (const [name, fn] of [["R2", r2], ["Resend", resend], ["ElevenLabs", elevenlabs]] as const) {
    try {
      console.log(`${name} : ${await fn()}`);
    } catch (err) {
      console.log(`${name} : ERREUR ${(err as Error).name} ${(err as Error).message}`);
    }
  }
}

void main();
