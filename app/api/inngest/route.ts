import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generateSongFunction } from "@/inngest/generate-song";
import { remindUnpaidFunction } from "@/inngest/remind-unpaid";
import { renderVideoFunction } from "@/inngest/render-video";

// La génération d'une chanson prend 1 à 3 minutes : chaque étape tourne dans sa propre requête.
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({ client: inngest, functions: [generateSongFunction, remindUnpaidFunction, renderVideoFunction] });
