import { z } from "zod";
import { generateLyrics, LyricsError, type LyricsBrief } from "@/lib/claude";
import type { Order } from "@/lib/db/schema";
import { MODERATION_MESSAGE, moderateText } from "@/lib/moderation";
import { LANGUAGE_IDS, OCCASION_IDS } from "@/lib/occasions";
import {
  addModerationNote,
  createDraftOrder,
  getOrderById,
  MAX_REWRITES,
  OrderError,
  trackEvent,
  updateLyrics,
} from "@/lib/orders";
import { STYLE_IDS } from "@/lib/styles";

export const maxDuration = 60;

const shortText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

// PRD §4, étapes 1 à 5.
const CreateInput = z.object({
  action: z.literal("create"),
  occasion: z.enum(OCCASION_IDS),
  recipientName: shortText(40),
  relation: optionalText(40),
  senderName: optionalText(40),
  anecdotes: z
    .array(z.string().trim().max(500))
    .transform((list) => list.filter(Boolean))
    .pipe(z.array(z.string()).min(1).max(3))
    .refine((list) => list.join("").length <= 500, "500 caractères maximum au total"),
  styleId: z.enum(STYLE_IDS),
  // Valeur par défaut : brouillons ouverts avant l'ajout du choix de langue.
  songLanguage: z.enum(LANGUAGE_IDS).default("fr"),
  chorusLanguage: z.enum(LANGUAGE_IDS),
  voice: z.enum(["male", "female"]),
  whatsappPhone: z
    .string()
    .transform((v) => v.replace(/[\s.\-()]/g, ""))
    .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Numéro au format international, par exemple +237 6XX XX XX XX")),
});

const RewriteInput = z.object({ action: z.literal("rewrite"), orderId: z.uuid() });

const EditInput = z.object({
  action: z.literal("edit"),
  orderId: z.uuid(),
  title: shortText(120),
  lyrics: shortText(4000),
});

const Input = z.discriminatedUnion("action", [CreateInput, RewriteInput, EditInput]);

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status });
}

function refused(orderId: string) {
  return json(422, { error: MODERATION_MESSAGE, orderId });
}

function success(order: Order) {
  return json(200, {
    orderId: order.id,
    title: order.title,
    lyrics: order.lyrics,
    rewritesLeft: Math.max(0, MAX_REWRITES - order.rewriteCount),
  });
}

function briefFromOrder(order: Order): LyricsBrief {
  return {
    occasion: order.occasion,
    recipientName: order.recipientName,
    relation: order.relation,
    senderName: order.senderName,
    anecdotes: (order.anecdotes ?? "").split("\n"),
    styleId: order.styleId,
    songLanguage: order.songLanguage,
    chorusLanguage: order.chorusLanguage,
  };
}

/** Génère les paroles, journalise un éventuel refus et les enregistre. */
async function generateAndSave(order: Order, kind: "first" | "rewrite") {
  const result = await generateLyrics(briefFromOrder(order));
  if (!result.ok) {
    await addModerationNote(order.id, result.note);
    return refused(order.id);
  }
  // Les paroles produites passent aussi par la liste de mots interdits.
  const check = moderateText(result.title, result.lyrics);
  if (!check.ok) {
    await addModerationNote(order.id, `Paroles générées bloquées : ${check.matches.join(", ")}`);
    return refused(order.id);
  }
  const saved = await updateLyrics(order.id, { title: result.title, lyrics: result.lyrics, kind });
  await trackEvent("lyrics_generated", order.id);
  return success(saved);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Requête invalide." });
  }

  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return json(400, {
      error: "Vérifie les informations du formulaire.",
      fields: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  const input = parsed.data;

  try {
    if (input.action === "create") {
      const order = await createDraftOrder({
        occasion: input.occasion,
        recipientName: input.recipientName,
        relation: input.relation,
        senderName: input.senderName,
        anecdotes: input.anecdotes.join("\n"),
        styleId: input.styleId,
        songLanguage: input.songLanguage,
        chorusLanguage: input.chorusLanguage,
        voice: input.voice,
        whatsappPhone: input.whatsappPhone,
      });
      const check = moderateText(input.recipientName, input.relation, input.senderName, ...input.anecdotes);
      if (!check.ok) {
        await addModerationNote(order.id, `Formulaire bloqué : ${check.matches.join(", ")}`);
        return refused(order.id);
      }
      return await generateAndSave(order, "first");
    }

    const order = await getOrderById(input.orderId);
    if (!order) return json(404, { error: "Commande introuvable." });

    if (input.action === "rewrite") {
      if (order.rewriteCount >= MAX_REWRITES) {
        return json(409, { error: "Tu as déjà utilisé tes 3 réécritures. Tu peux encore modifier le texte à la main." });
      }
      return await generateAndSave(order, "rewrite");
    }

    // Modification manuelle des paroles.
    const check = moderateText(input.title, input.lyrics);
    if (!check.ok) {
      await addModerationNote(order.id, `Modification manuelle bloquée : ${check.matches.join(", ")}`);
      return refused(order.id);
    }
    return success(await updateLyrics(order.id, { title: input.title, lyrics: input.lyrics, kind: "edited" }));
  } catch (error) {
    if (error instanceof LyricsError) return json(503, { error: error.message });
    if (error instanceof OrderError) {
      if (error.code === "not_found") return json(404, { error: "Commande introuvable." });
      if (error.code === "rewrite_limit") return json(409, { error: error.message });
      return json(409, { error: "Ces paroles ne peuvent plus être modifiées." });
    }
    console.error("[api/lyrics]", error);
    return json(500, { error: "Une erreur est survenue. Réessaie dans un instant." });
  }
}
