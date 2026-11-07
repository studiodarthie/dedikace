// Choix « cookies de mesure » (pixels Meta / TikTok). Code navigateur : n'importe aucun module serveur.
// Gardé 6 mois sur le téléphone, puis on redemande (recommandation CNIL).

export type Consent = "yes" | "no" | "unset";

const KEY = "dedikace:cookies:v1";
const EVENT = "dedikace:consent";
const MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000;

export function getConsent(): Consent {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { v?: string; at?: number } | null;
    if (!saved || (saved.v !== "yes" && saved.v !== "no")) return "unset";
    if (typeof saved.at !== "number" || Date.now() - saved.at > MAX_AGE_MS) return "unset";
    return saved.v;
  } catch {
    return "unset";
  }
}

export function setConsent(value: "yes" | "no") {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: value, at: Date.now() }));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/** « Cookies » en pied de page : efface le choix pour que le bandeau revienne. */
export function resetConsent() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeConsent(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
