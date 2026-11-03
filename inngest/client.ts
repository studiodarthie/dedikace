import { eventType, Inngest } from "inngest";
import { z } from "zod";

// En local, INNGEST_DEV=1 (dans .env.local) envoie les événements au serveur `npx inngest-cli dev`.
// Sur Vercel (maxDuration 300 s) : au-delà de 60 s, on rend la main entre deux étapes,
// pour qu'une étape de création (≤ 200 s) ne dépasse jamais la limite.
export const inngest = new Inngest({ id: "dedikace", checkpointing: { maxRuntime: "60s" } });

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
 * `relaunch` (relance depuis le back-office) donne un identifiant nouveau, sinon la relance serait ignorée.
 */
export async function sendOrderPaid(orderId: string, generation: 1 | 2, relaunch?: string) {
  const id = `order-paid-${orderId}-g${generation}${relaunch ? `-r${relaunch}` : ""}`;
  await inngest.send(orderPaid.create({ orderId, generation }, { id }));
}
