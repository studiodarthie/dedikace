import "server-only";
import { requireEnv } from "@/lib/env";
import { moderateText } from "@/lib/moderation";
import { sungLanguage } from "@/lib/occasions";
import { applyPhonetics } from "@/lib/phonetics";

// API officielle Eleven Music : POST /v1/music avec un `composition_plan` (modèle music_v2_5).
// Référence : https://elevenlabs.io/docs/api-reference/music/compose
const MUSIC_URL = "https://api.elevenlabs.io/v1/music";
const MODEL_ID = "music_v2_5";
const OUTPUT_FORMAT = "mp3_44100_128"; // ~1 Mo par minute : léger pour la 3G

const MIN_CHUNK_MS = 3_000;
const MAX_CHUNK_MS = 120_000;
const MS_PER_LINE = 4_750; // une ligne de 6 à 10 syllabes chantée posément
const INTRO_MS = 8_000;

export class MusicError extends Error {
  constructor(
    message: string,
    /** true : erreur passagère (quota, serveur), on peut réessayer. */
    readonly retryable: boolean,
    readonly status?: number,
  ) {
    super(message);
    this.name = "MusicError";
  }
}

type Section = { label: string; lines: string[] };

const SECTION_NAMES: Record<string, string> = {
  "couplet 1": "Verse 1",
  "couplet 2": "Verse 2",
  couplet: "Verse",
  refrain: "Chorus",
  pont: "Bridge",
};

/** « [Couplet 1]\nligne\nligne\n\n[Refrain]… » → sections. Les lignes avant toute étiquette sont ignorées. */
export function parseLyrics(lyrics: string): Section[] {
  const sections: Section[] = [];
  for (const raw of lyrics.split("\n")) {
    const line = raw.trim();
    const label = line.match(/^\[(.+)\]$/);
    if (label) sections.push({ label: label[1].trim(), lines: [] });
    else if (line && sections.length) sections[sections.length - 1].lines.push(line.slice(0, 200));
  }
  return sections.filter((s) => s.lines.length > 0);
}

function englishName(label: string) {
  return SECTION_NAMES[label.toLowerCase()] ?? label;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Durées proportionnelles au nombre de lignes, puis ajustées pour viser la durée demandée (après l'intro). */
function sectionDurations(sections: Section[], durationSeconds: number): number[] {
  const raw = sections.map((s) => s.lines.length * MS_PER_LINE);
  const target = durationSeconds * 1000 - INTRO_MS;
  const scale = target / raw.reduce((a, b) => a + b, 0);
  return raw.map((ms) => clamp(Math.round(ms * scale), MIN_CHUNK_MS, MAX_CHUNK_MS));
}

export type TimedSection = { label: string; isChorus: boolean; startMs: number; durationMs: number; lines: string[] };

/**
 * Moment où chaque section est chantée, d'après le plan de composition envoyé à ElevenLabs
 * (les durées des sections y sont imposées). Sert à caler les paroles de la vidéo statut.
 */
export function sectionTimeline(lyrics: string, durationSeconds: number): TimedSection[] {
  const sections = parseLyrics(lyrics);
  if (sections.length === 0) return [];
  const durations = sectionDurations(sections, durationSeconds);
  let start = INTRO_MS;
  return sections.map((s, i) => {
    const item = { label: s.label, isChorus: englishName(s.label) === "Chorus", startMs: start, durationMs: durations[i], lines: s.lines };
    start += durations[i];
    return item;
  });
}

export type SongRequest = {
  /** Description du style (lib/styles.ts → stylePromptFor), en anglais. */
  stylePrompt: string;
  lyrics: string;
  songLanguage: string;
  chorusLanguage: string;
  durationSeconds: number;
};

/** Construit le plan de composition : une intro instrumentale puis un morceau par section des paroles. */
export function buildCompositionPlan({ stylePrompt, lyrics, songLanguage, chorusLanguage, durationSeconds }: SongRequest) {
  const sections = parseLyrics(applyPhonetics(lyrics));
  if (sections.length === 0) throw new MusicError("Paroles vides ou sans sections.", false);

  const baseStyles = [
    ...stylePrompt.split(",").map((s) => s.trim()).filter(Boolean),
    "clear and intelligible lead vocals",
    `verses sung in ${sungLanguage(songLanguage)}`,
    "warm, celebratory African production",
    "great production quality",
  ];

  const durations = sectionDurations(sections, durationSeconds);

  // Refrain dans une autre langue que les couplets : on le précise sur chaque refrain.
  const chorusStyle = chorusLanguage !== songLanguage ? `chorus sung in ${sungLanguage(chorusLanguage)}` : undefined;
  const chunks = [
    { text: "[Intro]", duration_ms: INTRO_MS, positive_styles: baseStyles, negative_styles: [] },
    ...sections.map((s, i) => {
      const name = englishName(s.label);
      const styles = name === "Chorus" && chorusStyle ? [chorusStyle, "catchy sing-along chorus"] : [];
      return {
        text: [`[${name}]`, ...s.lines.slice(0, 30)].join("\n"),
        duration_ms: durations[i],
        positive_styles: styles,
        negative_styles: [],
      };
    }),
  ];
  return { chunks };
}

export type GeneratedSong = { audio: Buffer; songId: string | null; durationSeconds: number };

/** Génère une version de la chanson et renvoie le MP3. */
export async function generateSong(request: SongRequest): Promise<GeneratedSong> {
  // Dernière barrière avant le moteur musical (CLAUDE.md règle 5).
  const check = moderateText(request.lyrics);
  if (!check.ok) throw new MusicError(`Paroles bloquées par la modération : ${check.matches.join(", ")}`, false);

  const plan = buildCompositionPlan(request);
  let res: Response;
  try {
    res = await fetch(`${MUSIC_URL}?output_format=${OUTPUT_FORMAT}`, {
      method: "POST",
      headers: { "xi-api-key": requireEnv("ELEVENLABS_API_KEY"), "content-type": "application/json" },
      body: JSON.stringify({ model_id: MODEL_ID, composition_plan: plan }),
      // Une chanson de 3 min prend ~1 min ; 200 s laisse de la marge sous la limite Vercel de 300 s.
      signal: AbortSignal.timeout(200_000),
    });
  } catch (error) {
    throw new MusicError(`Connexion à ElevenLabs impossible : ${(error as Error).message}`, true);
  }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 500);
    const retryable = res.status === 429 || res.status >= 500;
    throw new MusicError(`ElevenLabs a répondu ${res.status} : ${detail}`, retryable, res.status);
  }

  const audio = Buffer.from(await res.arrayBuffer());
  if (audio.length < 10_000) throw new MusicError("Fichier audio vide ou trop court.", true);
  const durationSeconds = Math.round(plan.chunks.reduce((n, c) => n + c.duration_ms, 0) / 1000);
  return { audio, songId: res.headers.get("song-id"), durationSeconds };
}

// ---------- Transcription des vocaux (Scribe) ----------
// Référence : https://elevenlabs.io/docs/api-reference/speech-to-text/convert
const STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";

/** Transcrit un vocal (souvenirs racontés à l'oral). Langue détectée automatiquement : français, anglais, pidgin… */
/**
 * Mots d'ici que la transcription doit reconnaître (paramètre `keyterms`, +20 % sur un coût déjà minime).
 * Moins de 100 termes : au-delà, ElevenLabs facture 20 s minimum par vocal. Testé le 7 novembre 2026 :
 * sans la liste, « ndolè » devenait « dolet » et « Mvog-Ada » « Bogada ».
 */
const CAMEROON_KEYTERMS = [
  // Plats
  "ndolè", "eru", "koki", "mbongo tchobi", "okok", "sanga", "kondrè", "taro", "achu", "water fufu",
  "couscous maïs", "miondo", "bâton de manioc", "beignet haricot", "bobolo", "soya", "poisson braisé", "plantain",
  "pistache", "folong", "kwacoco", "nkui",
  // Villes et quartiers
  "Douala", "Yaoundé", "Bafoussam", "Bamenda", "Garoua", "Maroua", "Ngaoundéré", "Kribi", "Limbé", "Buea",
  "Ebolowa", "Bertoua", "Dschang", "Edéa", "Nkongsamba", "Bonamoussadi", "Bonapriso", "Akwa", "Deïdo",
  "Makepe", "Logbessou", "Ndokoti", "Bépanda", "New-Bell", "Mvog-Ada", "Mvog-Mbi", "Bastos", "Essos",
  "Mokolo", "Biyem-Assi", "Nkolbisson", "Emana", "Ekounou", "Mimboman", "Etoudi", "Ngoa-Ekellé", "Mendong",
  // Musique, fêtes, mots courants
  "makossa", "bikutsi", "ndombolo", "mangambeu", "assiko", "bend skin", "njangi", "tontine", "mbombo",
  "mami", "tata", "ma reine", "ma go", "mon gars", "le pater", "la mater", "wuna", "na so",
];

export async function transcribeVoice(audio: Blob, filename: string): Promise<string> {
  const body = new FormData();
  body.append("model_id", "scribe_v2");
  body.append("file", audio, filename);
  body.append("tag_audio_events", "false"); // pas de « (rires) » dans le texte
  body.append("no_verbatim", "true"); // sans « euh », faux départs ni bruits
  body.append("timestamps_granularity", "none");
  for (const term of CAMEROON_KEYTERMS) body.append("keyterms", term);

  let res: Response;
  try {
    res = await fetch(STT_URL, {
      method: "POST",
      headers: { "xi-api-key": requireEnv("ELEVENLABS_API_KEY") },
      body,
      signal: AbortSignal.timeout(45_000),
    });
  } catch (error) {
    throw new MusicError(`Connexion à ElevenLabs impossible : ${(error as Error).message}`, true);
  }
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new MusicError(`Transcription : ElevenLabs a répondu ${res.status} : ${detail}`, res.status >= 500 || res.status === 429, res.status);
  }
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").replace(/\s+/g, " ").trim();
}
