// Copie exacte de docs/PROMPTS.md §2 : toute modification se fait là-bas d'abord.
// Retirer d'ici tout style jugé faux à l'écoute (Jour 0).
export const STYLES = [
  { id: "makossa", label: "Makossa", prompt: "Cameroonian makossa, bright clean electric guitar, bouncing bass, 118 bpm, joyful {voice} vocals" },
  { id: "bikutsi", label: "Bikutsi", prompt: "Fast Cameroonian bikutsi, 6/8 feel, rapid guitar ostinato, 140 bpm, energetic {voice} vocals" },
  { id: "rumba", label: "Rumba congolaise", prompt: "Congolese rumba, smooth crooning {voice} vocals, interlocking clean guitars, sebene ending" },
  { id: "ndombolo", label: "Ndombolo", prompt: "High-energy ndombolo, fast sebene guitar, festive dance calls, 135 bpm, {voice} vocals" },
  { id: "gospel", label: "Gospel africain", prompt: "African gospel praise, choir backing, keys and bass, uplifting {voice} lead vocals" },
  { id: "afrobeats", label: "Afrobeats", prompt: "Modern afrobeats, warm {voice} vocals, percussive groove, 105 bpm" },
  { id: "amapiano", label: "Amapiano", prompt: "Amapiano, log drum bass, airy pads, 112 bpm, smooth {voice} vocals" },
  { id: "afrozouk", label: "Afro-zouk", prompt: "Afro-zouk love song, soft synths, romantic {voice} vocals, 90 bpm" },
  { id: "coupe-decale", label: "Coupé-décalé", prompt: "Coupé-décalé, fast percussion, festive call-and-response, {voice} vocals" },
  { id: "hommage", label: "Hommage acoustique", prompt: "Gentle acoustic guitar ballad, solemn and peaceful, soft {voice} vocals" },
] as const;

// Phrase courte affichée dans le formulaire (jamais envoyée au moteur musical).
export const STYLE_TAGLINES: Record<(typeof STYLES)[number]["id"], string> = {
  makossa: "Guitare joyeuse, ambiance Douala",
  bikutsi: "Rapide et dansant, rythme du Centre",
  rumba: "Douce et élégante, guitares qui chantent",
  ndombolo: "Pour faire danser toute la famille",
  gospel: "Chœur et louange, plein d'espoir",
  afrobeats: "Moderne et groovy",
  amapiano: "Tendance, basses profondes",
  afrozouk: "Romantique, pour les amoureux",
  "coupe-decale": "Festif, ambiance boîte",
  hommage: "Guitare acoustique, calme et digne",
};

export type Style = (typeof STYLES)[number];
export type StyleId = Style["id"];
export type Voice = "male" | "female";

export const STYLE_IDS = STYLES.map((s) => s.id) as [StyleId, ...StyleId[]];

export function getStyle(id: string): Style | undefined {
  return STYLES.find((s) => s.id === id);
}

/** Description envoyée au moteur musical, avec la voix choisie. */
export function stylePromptFor(id: StyleId, voice: Voice): string {
  const style = getStyle(id);
  if (!style) throw new Error(`Style inconnu : ${id}`);
  return style.prompt.replaceAll("{voice}", voice);
}
