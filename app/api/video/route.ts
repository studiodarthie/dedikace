import { z } from "zod";
import { auth } from "@/lib/auth";
import { translateError } from "@/lib/i18n-errors";
import { getOrderByPublicCode } from "@/lib/orders";
import { isOwner, MAX_PHOTO_BYTES, requestVideo, VideoRequestError } from "@/lib/videos";

export const maxDuration = 30;

/** Photo envoyée par l'acheteur (déjà réduite sur le téléphone) : lance la création de la vidéo statut. */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Photo trop lourde ou envoi coupé. Réessaie." }, { status: 400 });
  }
  const locale = form.get("locale") === "en" ? "en" : "fr";
  const fail = (message: string, status: number) => Response.json({ error: translateError(message, locale) }, { status });
  const code = z.string().regex(/^[a-z0-9]{6,16}$/).safeParse(form.get("code"));
  const ids = z.array(z.uuid()).max(30).safeParse(String(form.get("ids") ?? "").split(",").filter(Boolean));
  const photo = form.get("photo");
  if (!code.success || !ids.success || !(photo instanceof Blob)) {
    return fail("Choisis une photo.", 400);
  }
  if (photo.size > MAX_PHOTO_BYTES) return fail("Photo trop lourde (6 Mo au plus).", 413);

  const order = await getOrderByPublicCode(code.data);
  if (!order) return fail("Chanson introuvable.", 404);
  const session = await auth();
  if (!isOwner(order, ids.data, session?.user?.id)) {
    return fail("Seule la personne qui a commandé la chanson peut créer la vidéo.", 403);
  }

  try {
    const video = await requestVideo(order, Buffer.from(await photo.arrayBuffer()));
    return Response.json({ status: video.status });
  } catch (error) {
    if (error instanceof VideoRequestError) return fail(error.message, 409);
    console.error("[video] demande échouée", error);
    return fail("Ça n'a pas marché. Réessaie dans un instant.", 500);
  }
}
