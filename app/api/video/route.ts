import { z } from "zod";
import { auth } from "@/lib/auth";
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
  const code = z.string().regex(/^[a-z0-9]{6,16}$/).safeParse(form.get("code"));
  const ids = z.array(z.uuid()).max(30).safeParse(String(form.get("ids") ?? "").split(",").filter(Boolean));
  const photo = form.get("photo");
  if (!code.success || !ids.success || !(photo instanceof Blob)) {
    return Response.json({ error: "Choisis une photo." }, { status: 400 });
  }
  if (photo.size > MAX_PHOTO_BYTES) return Response.json({ error: "Photo trop lourde (6 Mo au plus)." }, { status: 413 });

  const order = await getOrderByPublicCode(code.data);
  if (!order) return Response.json({ error: "Chanson introuvable." }, { status: 404 });
  const session = await auth();
  if (!isOwner(order, ids.data, session?.user?.id)) {
    return Response.json({ error: "Seule la personne qui a commandé la chanson peut créer la vidéo." }, { status: 403 });
  }

  try {
    const video = await requestVideo(order, Buffer.from(await photo.arrayBuffer()));
    return Response.json({ status: video.status });
  } catch (error) {
    if (error instanceof VideoRequestError) return Response.json({ error: error.message }, { status: 409 });
    console.error("[video] demande échouée", error);
    return Response.json({ error: "Ça n'a pas marché. Réessaie dans un instant." }, { status: 500 });
  }
}
