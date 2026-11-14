import { MusicError, transcribeVoice } from "@/lib/elevenlabs";
import type { Locale } from "@/lib/i18n";
import { translateError } from "@/lib/i18n-errors";

// Vocal « Raconte tes souvenirs » (docs/PLAN_ONBOARDING.md, phase 2) → texte modifiable dans le formulaire.
// La clé ElevenLabs reste côté serveur. Limite anti-abus : règle du pare-feu Vercel sur /api/transcribe.

export const maxDuration = 60;

const MAX_BYTES = 3 * 1024 * 1024; // ~60 s de vocal, même en mp4 sur iPhone ; sous la limite Vercel de 4,5 Mo
const MAX_TEXT = 500;

export async function POST(req: Request) {
  let audio: FormDataEntryValue | null;
  let locale: Locale = "fr";
  const fail = (error: string, status: number) => Response.json({ error: translateError(error, locale) }, { status });
  try {
    const form = await req.formData();
    audio = form.get("audio");
    if (form.get("locale") === "en") locale = "en";
  } catch {
    return fail("Le vocal n'a pas pu être envoyé. Réessaie.", 400);
  }
  if (!(audio instanceof Blob) || audio.size < 1_000) {
    return fail("Ton vocal est trop court. Parle quelques secondes puis réessaie.", 400);
  }
  if (audio.size > MAX_BYTES) return fail("Ton vocal est trop long : 1 minute au maximum.", 413);
  if (!/^(audio|video)\//.test(audio.type)) return fail("Ce format de vocal n'est pas reconnu.", 415);

  try {
    const ext = audio.type.includes("mp4") ? "m4a" : audio.type.includes("ogg") ? "ogg" : "webm";
    const text = await transcribeVoice(audio, `vocal.${ext}`);
    if (!text) return fail("On n'a rien entendu. Parle plus près du téléphone et réessaie.", 422);
    return Response.json({ text: text.slice(0, MAX_TEXT) });
  } catch (error) {
    console.error("[transcribe]", error);
    const busy = error instanceof MusicError && error.retryable;
    return fail(busy ? "Le service est occupé. Réessaie dans un instant ou écris ton souvenir." : "On n'a pas pu lire ton vocal. Écris ton souvenir à la place.", 502);
  }
}
