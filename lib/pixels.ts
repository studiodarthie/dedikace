// Meta Pixel et TikTok Pixel (PRD §9). Code navigateur : n'importe aucun module serveur.
// Les identifiants (META_PIXEL_ID, TIKTOK_PIXEL_ID) sont lus par app/layout.tsx et passés à <Pixels>.

type PixelWindow = Window & {
  fbq?: (...args: unknown[]) => void;
  ttq?: { track: (event: string, data?: Record<string, unknown>) => void };
};

/**
 * « Début de création » et « paiement réussi ». On utilise les événements standard
 * (InitiateCheckout, Purchase / CompletePayment) pour que Meta et TikTok puissent optimiser les pubs dessus.
 */
export function trackPixel(event: "start" | "purchase", data?: { valueXaf: number; orderId: string }) {
  const w = window as PixelWindow;
  try {
    if (event === "start") {
      w.fbq?.("track", "InitiateCheckout");
      w.ttq?.track("InitiateCheckout");
      return;
    }
    if (!data) return;
    const params = { value: data.valueXaf, currency: "XAF", content_type: "product", content_id: "chanson" };
    // eventID : évite qu'un même paiement soit compté deux fois par Meta.
    w.fbq?.("track", "Purchase", params, { eventID: data.orderId });
    w.ttq?.track("CompletePayment", { ...params, event_id: data.orderId });
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
