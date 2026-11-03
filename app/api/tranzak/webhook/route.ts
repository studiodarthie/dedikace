import { timingSafeEqual } from "node:crypto";
import { sendAdminAlert } from "@/lib/email";
import { env } from "@/lib/env";
import { getPaymentByRequestId, saveNotification, syncPayment } from "@/lib/payments";

export const maxDuration = 30;

function sameKey(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Prompt 10 : notification Tranzak (TPN). Elle sert seulement de signal :
 * le statut est toujours relu auprès de l'API Tranzak avant de lancer la création (CLAUDE.md règle 1).
 */
export async function POST(request: Request) {
  const expectedKey = env.TRANZAK_WEBHOOK_AUTH_KEY;
  if (!expectedKey) {
    console.error("[tpn] TRANZAK_WEBHOOK_AUTH_KEY manquante : notification refusée");
    return Response.json({ error: "not configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as {
    authKey?: unknown;
    eventType?: unknown;
    resourceId?: unknown;
    resource?: { requestId?: unknown };
  } | null;
  if (!body || typeof body.authKey !== "string" || !sameKey(body.authKey, expectedKey)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  // Seules les demandes de paiement nous concernent ; on accuse réception du reste.
  if (body.eventType !== "REQUEST.COMPLETED") return Response.json({ ok: true });

  const requestId = typeof body.resourceId === "string" ? body.resourceId : body.resource?.requestId;
  if (typeof requestId !== "string") return Response.json({ ok: true });

  const payment = await getPaymentByRequestId(requestId);
  if (!payment) {
    console.warn(`[tpn] paiement inconnu ${requestId}`);
    return Response.json({ ok: true });
  }

  // On garde la notification pour le back-office, sans la clé secrète.
  await saveNotification(payment.id, { ...body, authKey: undefined });
  try {
    const result = await syncPayment(payment);
    return Response.json({ ok: true, result });
  } catch (error) {
    // Erreur passagère (API Tranzak, base) : on répond 500 pour que Tranzak renvoie la notification.
    console.error("[tpn] vérification impossible", error);
    await sendAdminAlert(
      `Notification Tranzak non traitée — ${requestId}`,
      `La vérification du paiement ${payment.merchantRef} a échoué : ${error instanceof Error ? error.message : error}.\nLa page d'attente du client réessaie automatiquement.`,
    );
    return Response.json({ error: "retry" }, { status: 500 });
  }
}
