// Modération par liste de mots interdits (docs/PROMPTS.md §4), appliquée :
// 1. aux champs du formulaire, avant l'appel à Claude ;
// 2. aux paroles (générées ou modifiées à la main), avant tout envoi au moteur musical.
// Claude applique en plus ses propres règles (champ `refus`).
//
// À FAIRE RELIRE par des locuteurs natifs : les listes pidgin et lingala sont un point de départ.

export const MODERATION_MESSAGE = "On ne peut pas créer cette chanson. Modifie ton message et réessaie.";

const INSULTS_FR = [
  "pute", "putain", "salope", "connard", "connasse", "encule", "enculer", "batard", "nique", "niquer",
  "fils de pute", "ta mere", "pd", "pede", "tapette", "negro", "bougnoule", "trou du cul", "abruti",
  "debile", "cretin", "imbecile", "grosse vache", "chienne",
];
const SEXUAL_FR = ["sexe", "bite", "chatte", "couille", "baise", "sodomie", "porno", "fellation", "branler"];
const INSULTS_PIDGIN = ["ashawo", "mumu", "tif man", "nyash", "kpuff", "wuna mami"];
const INSULTS_EN = ["fuck", "fucking", "bitch", "motherfucker", "asshole", "bastard", "whore", "slut", "dick", "pussy", "nigga", "nigger"];
const INSULTS_LINGALA = ["ndumba", "zoba", "liboma", "nyoko"];
const POLITICS = [
  "biya", "kamto", "rdpc", "mrc", "ambazonie", "ambazonia", "boko haram", "parti politique",
  "election presidentielle", "tshisekedi", "kabila", "sassou",
];
// Artistes réels : pas d'imitation ni de mention (CLAUDE.md règle 5).
const ARTISTS = [
  "fally ipupa", "koffi olomide", "ferre gola", "werrason", "papa wemba", "petit pays", "manu dibango",
  "charlotte dipanda", "locko", "salatiel", "mr leo", "magasco", "aya nakamura",
  "dadju", "gims", "innoss b", "burna boy", "wizkid", "davido", "dj arafat", "serge beynaud",
];

const BLOCKLIST = [...INSULTS_FR, ...SEXUAL_FR, ...INSULTS_PIDGIN, ...INSULTS_EN, ...INSULTS_LINGALA, ...POLITICS, ...ARTISTS];

/** Minuscules, sans accents, ponctuation remplacée par des espaces. */
function normalize(text: string): string {
  return ` ${text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

const NORMALIZED_BLOCKLIST = BLOCKLIST.map((term) => normalize(term));

export type ModerationResult = { ok: true } | { ok: false; matches: string[] };

/** Cherche des mots entiers de la liste (« pute » ne bloque pas « réputé »). */
export function moderateText(...texts: (string | null | undefined)[]): ModerationResult {
  const haystack = normalize(texts.filter(Boolean).join(" \n "));
  const matches = NORMALIZED_BLOCKLIST.filter((term) => haystack.includes(term)).map((t) => t.trim());
  return matches.length === 0 ? { ok: true } : { ok: false, matches: [...new Set(matches)] };
}
