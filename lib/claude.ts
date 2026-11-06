import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { env } from "@/lib/env";
import { languageLabel, occasionLabel } from "@/lib/occasions";
import { getStyle } from "@/lib/styles";

// Prompt système exact de docs/PROMPTS.md §1 : toute modification se fait là-bas d'abord.
const SYSTEM_PROMPT = `Tu es le parolier de Dédikace, spécialiste des musiques d'Afrique centrale.
Tu écris une chanson personnalisée qui sera chantée par une voix IA.

Règles de forme :
- Structure exacte, une section par bloc, avec ces étiquettes :
  [Couplet 1] [Refrain] [Couplet 2] [Refrain] [Pont] [Refrain]
- 160 à 220 mots au total.
- Couplets de 8 lignes, pont de 4 lignes.
- Refrain de 4 lignes, simple, facile à chanter en chœur, qui contient le prénom du destinataire.
- Lignes de 6 à 10 syllabes, rimes simples.
- Écris les couplets et le pont dans la langue de la chanson, et le refrain dans la langue du refrain.
  Le titre est dans la langue de la chanson.
- Les étiquettes de section restent toujours en français, exactement comme ci-dessus, quelle que soit la langue.
- En anglais, en pidgin ou en lingala, utilise uniquement des mots très courants.

Règles de fond :
- Intègre naturellement les anecdotes fournies, sans en inventer d'autres.
- Ton : joyeux pour une fête, tendre pour l'amour, fier pour une réussite,
  solennel et apaisé pour un deuil (jamais triste au point d'être lourd).
- Interdit : vulgarité, contenu sexuel, politique, religion polémique, personnalités publiques,
  noms d'artistes réels, marques.
- Si les informations fournies contiennent un contenu interdit ou insultant envers le destinataire,
  refuse : mets "refus" à true, et "title" et "lyrics" vides.

Format de réponse : un objet JSON {"refus": false, "title": "...", "lyrics": "..."}.
Dans "lyrics", chaque étiquette de section est seule sur sa ligne, suivie des lignes chantées,
avec une ligne vide entre deux sections.`;

const LyricsOutput = z.object({
  refus: z.boolean(),
  title: z.string(),
  lyrics: z.string(),
});

export type LyricsBrief = {
  occasion: string;
  recipientName: string;
  relation?: string | null;
  senderName?: string | null;
  anecdotes: string[];
  styleId: string;
  songLanguage: string;
  chorusLanguage: string;
};

export type LyricsResult =
  | { ok: true; title: string; lyrics: string }
  | { ok: false; reason: "refused"; note: string };

export class LyricsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LyricsError";
  }
}

const client = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
  // Objectif < 15 s (PRD §4) : on coupe à 25 s et on réessaie une seule fois.
  timeout: 25_000,
  maxRetries: 1,
});

function buildUserMessage(brief: LyricsBrief): string {
  const relation = brief.relation?.trim() ? ` (${brief.relation.trim()})` : "";
  const anecdotes = brief.anecdotes.map((a) => a.trim()).filter(Boolean);
  return [
    `Occasion : ${occasionLabel(brief.occasion)}`,
    `Destinataire : ${brief.recipientName.trim()}${relation}`,
    `Expéditeur : ${brief.senderName?.trim() || "non précisé"}`,
    `Anecdotes : ${anecdotes.length ? anecdotes.map((a) => `- ${a}`).join("\n") : "aucune"}`,
    `Style musical : ${getStyle(brief.styleId)?.label ?? brief.styleId}`,
    `Langue de la chanson : ${languageLabel(brief.songLanguage)}`,
    `Langue du refrain : ${languageLabel(brief.chorusLanguage)}`,
  ].join("\n");
}

export async function generateLyrics(brief: LyricsBrief): Promise<LyricsResult> {
  let response;
  try {
    response = await client.beta.messages.parse({
      model: env.CLAUDE_MODEL,
      max_tokens: 8000,
      // Effort bas : paroles courtes et rapides ; la qualité reste à valider sur les 10 cas du jour 2.
      output_config: { effort: "low", format: betaZodOutputFormat(LyricsOutput) },
      // Si un filtre de sécurité refuse à tort, l'API réessaie sur le modèle de secours par défaut.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(brief) }],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      throw new LyricsError("Trop de demandes en ce moment. Réessaie dans une minute.");
    }
    if (error instanceof Anthropic.APIConnectionTimeoutError || error instanceof Anthropic.APIConnectionError) {
      throw new LyricsError("La création des paroles prend trop de temps. Réessaie.");
    }
    if (error instanceof Anthropic.APIError) {
      console.error("[claude] erreur API", error.status, error.message);
      throw new LyricsError("Impossible de créer les paroles pour le moment. Réessaie dans un instant.");
    }
    throw error;
  }

  if (response.stop_reason === "refusal") {
    const category = response.stop_details?.category ?? "inconnue";
    return { ok: false, reason: "refused", note: `Refus de l'API (catégorie ${category})` };
  }
  if (response.stop_reason === "max_tokens" || !response.parsed_output) {
    console.error("[claude] réponse incomplète", response.stop_reason);
    throw new LyricsError("Les paroles n'ont pas pu être terminées. Réessaie.");
  }

  const { refus, title, lyrics } = response.parsed_output;
  if (refus || !lyrics.trim()) {
    return { ok: false, reason: "refused", note: "Refus du parolier (contenu interdit dans le formulaire)" };
  }
  return { ok: true, title: title.trim(), lyrics: lyrics.trim() };
}
