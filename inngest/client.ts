import { eventType, Inngest } from "inngest";
import { z } from "zod";

// En local, INNGEST_DEV=1 (dans .env.local) envoie les événements au serveur `npx inngest-cli dev`.
export const inngest = new Inngest({ id: "dedikace" });

/** Commande payée (ou régénération gratuite) : déclenche la création des 2 versions. */
export const orderPaid = eventType("order/paid", {
  schema: z.object({
    orderId: z.uuid(),
    /** 1 = première création, 2 = régénération gratuite. */
    generation: z.number().int().min(1).max(2),
  }),
});

/**
 * Envoie l'événement avec un identifiant fixe par commande et par génération :
 * Inngest ignore un doublon reçu dans les 24 h (CLAUDE.md règle 2).
 */
export async function sendOrderPaid(orderId: string, generation: 1 | 2) {
  await inngest.send(orderPaid.create({ orderId, generation }, { id: `order-paid-${orderId}-g${generation}` }));
}
