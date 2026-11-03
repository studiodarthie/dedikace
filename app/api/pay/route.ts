import { z } from "zod";
import { PaymentError, startPayment } from "@/lib/payments";

export const maxDuration = 30;

// Numéro Mobile Money camerounais : 6XX XX XX XX, avec ou sans +237.
const CameroonPhone = z
  .string()
  .transform((v) => v.replace(/[\s.\-()]/g, "").replace(/^(\+|00)?237/, ""))
  .pipe(z.string().regex(/^6\d{8}$/, "Numéro Mobile Money camerounais attendu, par exemple 6XX XX XX XX"))
  .transform((v) => `237${v}`);

const Input = z.discriminatedUnion("channel", [
  z.object({ orderId: z.uuid(), channel: z.enum(["mtn", "orange"]), phone: CameroonPhone }),
  z.object({ orderId: z.uuid(), channel: z.literal("card") }),
]);

export async function POST(request: Request) {
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const message = parsed.error.issues.find((i) => i.path[0] === "phone")?.message ?? "Requête invalide.";
    return Response.json({ error: message }, { status: 400 });
  }
  try {
    const data = parsed.data;
    const result = await startPayment({
      orderId: data.orderId,
      channel: data.channel,
      phone: data.channel === "card" ? undefined : data.phone,
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof PaymentError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[paiement]", error);
    return Response.json({ error: "Oups, le paiement n'a pas pu démarrer. Réessaie dans un instant." }, { status: 500 });
  }
}
