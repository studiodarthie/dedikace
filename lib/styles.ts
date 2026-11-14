// Copie exacte de docs/PROMPTS.md §2 : toute modification se fait là-bas d'abord.
// Retirer d'ici tout style jugé faux à l'écoute (Jour 0).
export const STYLES = [
  { id: "makossa", label: "Makossa", prompt: "Cameroonian makossa, bright clean interlocking electric guitars, melodic bouncing bass lines, crisp congas and hi-hats, warm brass stabs, 118 bpm, joyful {voice} lead vocals, call-and-response backing vocals" },
  { id: "bikutsi", label: "Bikutsi", prompt: "Fast Cameroonian bikutsi, driving 6/8 feel, rapid muted guitar ostinato, plucked balafon-like melodies, punchy kick and shakers, 140 bpm, energetic {voice} vocals, chanted group responses" },
  { id: "rumba", label: "Rumba congolaise", prompt: "Congolese rumba, smooth crooning {voice} lead vocals, interlocking clean guitars, warm round bass, soft congas, lush vocal harmonies, rising sebene guitar finale" },
  { id: "ndombolo", label: "Ndombolo", prompt: "High-energy ndombolo, fast sparkling sebene guitar, tight snare rolls, festive dance shouts, 135 bpm, powerful {voice} vocals" },
  { id: "gospel", label: "Gospel africain", prompt: "African gospel praise, full choir backing, organ and grand piano, groovy bass, joyful hand claps, uplifting {voice} lead vocals" },
  { id: "afrobeats", label: "Afrobeats", prompt: "Modern afrobeats, warm melodic {voice} vocals, syncopated percussion and shakers, plucked guitar riff, deep sub bass, airy synth pads, 105 bpm" },
  { id: "amapiano", label: "Amapiano", prompt: "Amapiano, deep log drum bass, shuffling shakers, jazzy piano chords, airy pads, 112 bpm, smooth {voice} vocals" },
  { id: "afrozouk", label: "Afro-zouk", prompt: "Afro-zouk love song, lush soft synths, gentle guitar licks, swaying groove, 90 bpm, romantic {voice} vocals, tender harmonies" },
  { id: "coupe-decale", label: "Coupé-décalé", prompt: "Coupé-décalé, fast driving percussion, bright synth leads, festive call-and-response chants, 128 bpm, hype {voice} vocals" },
  { id: "afrosoul", label: "Afro-soul inspirant", prompt: "Inspirational afro-soul, cinematic grand piano, swelling string orchestra, warm bass, soulful gospel harmonies, slow build to an anthemic chorus, 78 bpm, powerful emotional {voice} vocals" },
  { id: "epique", label: "Afro-pop épique", prompt: "Epic afro-pop anthem, big stadium drums, bright electric guitars, orchestral hits and strings, huge sing-along chorus, 100 bpm, triumphant {voice} vocals" },
  { id: "hommage", label: "Hommage acoustique", prompt: "Gentle acoustic guitar ballad, soft piano and warm strings, solemn and peaceful, intimate {voice} vocals, subtle choir in the chorus" },
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
  afrosoul: "Piano et cordes, des frissons garantis",
  epique: "Grand et puissant, comme au cinéma",
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
