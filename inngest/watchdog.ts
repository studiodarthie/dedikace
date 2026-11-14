import { sendAdminAlert } from "@/lib/email";
import { env } from "@/lib/env";
import { findStuckOrders, markStuckAlerted } from "@/lib/notifications";
import { inngest, orderPaid } from "./client";

/**
 * Surveillance toutes les 5 minutes : une commande payée doit toujours finir livrée.
 * - payée sans chanson depuis 10 min (lancement perdu) : on relance la création et on prévient l'équipe ;
 * - en création depuis 20 min : on prévient l'équipe (relance possible depuis le back-office).
 * Une planification Inngest tourne même si l'envoi d'événements depuis le site est cassé (cas du 14 novembre 2026).
 */
export const watchdogFunction = inngest.createFunction(
  { id: "watchdog", name: "Surveiller les commandes payées", triggers: [{ cron: "*/5 * * * *" }], retries: 1 },
  async ({ step }) => {
    const stuck = await step.run("chercher les commandes bloquées", async () => {
      const { paid, generating } = await findStuckOrders();
      const short = (o: (typeof paid)[number]) => ({ id: o.id, code: o.publicCode, name: o.recipientName, phone: o.whatsappPhone });
      return { paid: paid.map(short), generating: generating.map(short) };
    });
    if (stuck.paid.length === 0 && stuck.generating.length === 0) return { ok: true };

    if (stuck.paid.length > 0) {
      // Identifiant propre à la surveillance : passe même si l'événement d'origine a été enregistré sans effet.
      await step.sendEvent(
        "relancer les créations",
        stuck.paid.map((o) => orderPaid.create({ orderId: o.id, generation: 1 }, { id: `order-paid-${o.id}-g1-watchdog` })),
      );
    }

    await step.run("prévenir l'équipe", async () => {
      const url = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
      const lines = [
        ...stuck.paid.map((o) => `• ${o.code} (${o.name}, ${o.phone}) : payée, création jamais lancée → relancée automatiquement. ${url}/admin/commandes/${o.id}`),
        ...stuck.generating.map((o) => `• ${o.code} (${o.name}, ${o.phone}) : en création depuis plus de 20 min → à vérifier / relancer. ${url}/admin/commandes/${o.id}`),
      ];
      await sendAdminAlert(
        `⚠️ ${lines.length} commande(s) payée(s) bloquée(s)`,
        [...lines, "", "Pense à prévenir le client sur WhatsApp s'il attend."].join("\n"),
      );
      await markStuckAlerted([...stuck.paid, ...stuck.generating].map((o) => o.id));
    });
    return { relaunched: stuck.paid.length, slow: stuck.generating.length };
  },
);
