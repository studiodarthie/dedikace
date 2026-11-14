import { z } from "zod";
import { sendOrderPaid } from "@/inngest/client";
import { bodyLocale, translateError } from "@/lib/i18n-errors";
import { claimFreeRegeneration } from "@/lib/orders";

const Input = z.object({ code: z.string().trim().length(8) });

// « La chanson ne me plaît pas » : 1 nouvelle création gratuite par commande (PRD §5).
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const locale = bodyLocale(body);
  const parsed = Input.safeParse(body);
  if (!parsed.success) return Response.json({ error: translateError("Requête invalide.", locale) }, { status: 400 });

  const order = await claimFreeRegeneration(parsed.data.code);
  if (!order) {
    return Response.json(
      { error: translateError("La nouvelle création gratuite a déjà été utilisée. Écris-nous sur WhatsApp.", locale) },
      { status: 409 },
    );
  }
  await sendOrderPaid(order.id, 2);
  return Response.json({ ok: true });
}
