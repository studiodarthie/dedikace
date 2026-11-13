import { z } from "zod";
import { auth } from "@/lib/auth";
import { getOrderByPublicCode } from "@/lib/orders";
import { getVideo, isOwner, MAX_RENDERS, videoUrls } from "@/lib/videos";

const Input = z.object({
  code: z.string().regex(/^[a-z0-9]{6,16}$/),
  ids: z.array(z.uuid()).max(30).default([]),
});

/** État de la vidéo statut d'une chanson, et si ce téléphone peut la créer (acheteur). */
export async function POST(request: Request) {
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Requête invalide." }, { status: 400 });
  const order = await getOrderByPublicCode(parsed.data.code);
  if (!order) return Response.json({ error: "Chanson introuvable." }, { status: 404 });

  const session = await auth();
  const owner = isOwner(order, parsed.data.ids, session?.user?.id);
  const video = await getVideo(order.id);
  const urls = video ? await videoUrls(video, order.recipientName) : null;
  return Response.json(
    {
      owner,
      status: video?.status ?? null,
      rendersLeft: owner ? MAX_RENDERS - (video?.renders ?? 0) : 0,
      ...(urls && { play: urls.play, download: urls.download }),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
