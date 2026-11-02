import { z } from "zod";
import { sendOrderPaid } from "@/inngest/client";
import { claimFreeRegeneration } from "@/lib/orders";

const Input = z.object({ code: z.string().trim().length(8) });

// « La chanson ne me plaît pas » : 1 nouvelle création gratuite par commande (PRD §5).
export async function POST(request: Request) {
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Requête invalide." }, { status: 400 });

  const order = await claimFreeRegeneration(parsed.data.code);
  if (!order) {
    return Response.json(
      { error: "La nouvelle création gratuite a déjà été utilisée. Écris-nous sur WhatsApp." },
      { status: 409 },
    );
  }
  await sendOrderPaid(order.id, 2);
  return Response.json({ ok: true });
}
