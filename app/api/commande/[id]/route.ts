import { z } from "zod";
import { getOrderById } from "@/lib/orders";
import { getLatestPayment, syncPayment } from "@/lib/payments";

// Au-delà, on demande à Tranzak d'interroger l'opérateur (confirmation lente).
const FORCE_REFRESH_AFTER_MS = 60_000;

/**
 * Prompt 11 : statut lu par la page d'attente toutes les 5 s.
 * Tant que le paiement est en attente, on vérifie aussi chez Tranzak : ça marche sans webhook.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/commande/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "Commande introuvable." }, { status: 404 });

  let order = await getOrderById(id);
  if (!order) return Response.json({ error: "Commande introuvable." }, { status: 404 });

  const payment = await getLatestPayment(order.id);
  if (payment && (order.status === "pending_payment" || order.status === "paid")) {
    const age = Date.now() - payment.createdAt.getTime();
    try {
      await syncPayment(payment, { forceRefresh: payment.status === "pending" && age > FORCE_REFRESH_AFTER_MS });
      order = (await getOrderById(id)) ?? order;
    } catch (error) {
      console.error("[attente] vérification Tranzak impossible", error);
    }
  }

  return Response.json(
    {
      status: order.status,
      publicCode: order.status === "delivered" ? order.publicCode : undefined,
      recipientName: order.recipientName,
      channel: payment?.channel,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
