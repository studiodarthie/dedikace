// Dictionnaire de prononciation (docs/PROMPTS.md §3), appliqué aux paroles juste avant
// l'envoi au moteur musical, jamais à l'affichage. Ajouter ici chaque prénom signalé comme mal prononcé.
export const PHONETICS: Record<string, string> = {
  Mbarga: "Em-bar-ga",
  Nkongsamba: "N-kong-samba",
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const entries = Object.entries(PHONETICS).map(
  ([word, spoken]) => [new RegExp(`(?<![\\p{L}])${escapeRegExp(word)}(?![\\p{L}])`, "giu"), spoken] as const,
);

/** Remplace les mots du dictionnaire (mot entier, sans tenir compte de la casse). */
export function applyPhonetics(text: string): string {
  return entries.reduce((acc, [re, spoken]) => acc.replace(re, spoken), text);
}
