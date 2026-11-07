// Meta Pixel (PRD §9). Code navigateur : n'importe aucun module serveur.
// L'identifiant (META_PIXEL_ID) est lu par app/layout.tsx et passé à <Pixels>, chargé après consentement.

type PixelWindow = Window & {
  fbq?: (...args: unknown[]) => void;
};

/**
 * « Début de création » et « paiement réussi ». On utilise les événements standard
 * (InitiateCheckout, Purchase) pour que Meta puisse optimiser les pubs dessus.
 */
export function trackPixel(event: "start" | "purchase", data?: { valueXaf: number; orderId: string }) {
  const w = window as PixelWindow;
  try {
    if (event === "start") {
      w.fbq?.("track", "InitiateCheckout");
      return;
    }
    if (!data) return;
    const params = { value: data.valueXaf, currency: "XAF", content_type: "product", content_id: "chanson" };
    // eventID : évite qu'un même paiement soit compté deux fois par Meta.
    w.fbq?.("track", "Purchase", params, { eventID: data.orderId });
  } catch {
    // Un bloqueur de pub ne doit jamais casser la page.
  }
}

/** Une seule fois par commande, même si la page d'attente est rouverte. */
export function trackPurchaseOnce(orderId: string, valueXaf: number) {
  const key = `dedikace:purchase:${orderId}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {}
  trackPixel("purchase", { valueXaf, orderId });
}
