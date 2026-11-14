import "server-only";
import { cacheLife } from "next/cache";
import { env } from "@/lib/env";

// Prix de lancement : un vrai prix réduit, avec une vraie date de fin (pas de faux prix barré ni de faux compte à rebours).
// Après la date, les prix normaux (PRICE_MOMO_XAF / PRICE_CARD_XAF) reviennent tout seuls.
export const LAUNCH_OFFER = {
  momoXaf: 2000,
  cardXaf: 3000,
  endsAt: new Date("2026-11-25T23:59:59+01:00"), // heure de Douala
  endLabel: "25 novembre",
  endLabelEn: "25 November",
} as const;

export type Prices = { momo: number; card: number; launchEnds: string | null; launchEndsEn: string | null };

/** Prix à un instant donné. À utiliser pour encaisser et dans les pages propres à chaque client. */
export function pricesAt(now: Date): Prices {
  if (now < LAUNCH_OFFER.endsAt) {
    return {
      momo: Math.min(LAUNCH_OFFER.momoXaf, env.PRICE_MOMO_XAF),
      card: Math.min(LAUNCH_OFFER.cardXaf, env.PRICE_CARD_XAF),
      launchEnds: LAUNCH_OFFER.endLabel,
      launchEndsEn: LAUNCH_OFFER.endLabelEn,
    };
  }
  return { momo: env.PRICE_MOMO_XAF, card: env.PRICE_CARD_XAF, launchEnds: null, launchEndsEn: null };
}

/** Prix des pages vitrine (pré-rendues) : recalculés au plus tard toutes les heures. */
export async function currentPrices(): Promise<Prices> {
  "use cache";
  cacheLife("hours");
  return pricesAt(new Date());
}
