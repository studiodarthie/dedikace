import { trackEvent } from "@/lib/orders";

// Seul l'événement « formulaire commencé » peut venir du navigateur ;
// les autres sont enregistrés côté serveur au moment où ils se produisent.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { type?: unknown } | null;
  if (body?.type !== "form_started") {
    return Response.json({ error: "Événement inconnu." }, { status: 400 });
  }
  await trackEvent("form_started");
  return new Response(null, { status: 204 });
}
