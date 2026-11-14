import { z } from "zod";
import { bodyLocale, translateError } from "@/lib/i18n-errors";
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
  const body: unknown = await request.json().catch(() => null);
  const locale = bodyLocale(body);
  const fail = (message: string, status: number) => Response.json({ error: translateError(message, locale) }, { status });
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.find((i) => i.path[0] === "phone")?.message ?? "Requête invalide.", 400);
  }
  try {
    const data = parsed.data;
    const result = await startPayment({
      orderId: data.orderId,
      channel: data.channel,
      phone: data.channel === "card" ? undefined : data.phone,
      locale,
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof PaymentError) return fail(error.message, error.status);
    console.error("[paiement]", error);
    return fail("Oups, le paiement n'a pas pu démarrer. Réessaie dans un instant.", 500);
  }
}
