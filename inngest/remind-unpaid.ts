import { emailReminderIfUnpaid, REMIND_AFTER_MS } from "@/lib/reminders";
import { inngest, lyricsReady } from "./client";

/**
 * Relance par e-mail 1 h après les premières paroles, si la commande n'est toujours pas payée
 * et qu'elle est rattachée à un espace client (on n'a l'e-mail que dans ce cas).
 * Les autres clients sont relancés à la main sur WhatsApp, depuis le back-office (« À relancer »).
 */
export const remindUnpaidFunction = inngest.createFunction(
  { id: "remind-unpaid", name: "Relancer les paroles non payées (e-mail)", triggers: [lyricsReady], retries: 2 },
  async ({ event, step }) => {
    await step.sleep("attendre 1 h", REMIND_AFTER_MS);
    return step.run("envoyer la relance", () => emailReminderIfUnpaid(event.data.orderId));
  },
);
