import "server-only";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { Resvg } from "@resvg/resvg-js";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { sectionTimeline } from "@/lib/elevenlabs";

// Vidéo statut WhatsApp (docs/PLAN_CROISSANCE.md, étape 4) : 30 s verticales, photo qui zoome doucement,
// prénom + titre en haut, paroles du refrain synchronisées en bas, « dedikace.app » pour la pub gratuite.
// Les textes sont dessinés en PNG (resvg + police Outfit embarquée) puis posés par ffmpeg : on ne dépend pas
// des polices ni du filtre drawtext du serveur.

const run = promisify(execFile);

export const VIDEO_SECONDS = 30;
const W = 720;
const H = 1280;
const FPS = 24;
const FONT_DIR = path.join(process.cwd(), "assets", "fonts");
const FONTS = [path.join(FONT_DIR, "Outfit-Bold.ttf"), path.join(FONT_DIR, "Outfit-ExtraBold.ttf")];

export class VideoError extends Error {}

/** Logo blanc (assets/brand), posé en bas de la vidéo : son contenu est inséré tel quel dans le calque SVG. */
let logoCache: { viewBox: string; body: string } | undefined;
async function whiteLogo() {
  if (!logoCache) {
    const svg = await readFile(path.join(process.cwd(), "assets", "brand", "logo-blanc.svg"), "utf8");
    const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 4398 1019";
    const body = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    logoCache = { viewBox, body };
  }
  return logoCache;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

/** Coupe un texte en lignes d'au plus `max` caractères (sans couper les mots). */
function wrap(text: string, max: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > max) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S*$/, "") + "…";
    return kept;
  }
  return lines;
}

/** Retire les emojis : la police Outfit ne les contient pas (ils sortiraient en carrés). */
const noEmoji = (s: string) => s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim();

function png(svg: string): Buffer {
  return new Resvg(svg, {
    fitTo: { mode: "original" },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: "Outfit" },
  })
    .render()
    .asPng();
}

/** Calque fixe : dégradés sombres haut et bas, « Pour Marie », titre, logo et « dedikace.app ». */
function frameSvg(recipientName: string, title: string, logo: { viewBox: string; body: string }): string {
  const titleLines = wrap(noEmoji(title), 24, 2);
  const titleText = titleLines
    .map((l, i) => `<text x="${W / 2}" y="${200 + i * 62}" font-size="54" font-weight="800" text-anchor="middle" fill="#fff">${esc(l)}</text>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.65"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.8"/></linearGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="420" fill="url(#top)"/>
  <rect x="0" y="${H - 560}" width="${W}" height="560" fill="url(#bot)"/>
  <text x="${W / 2}" y="120" font-size="34" font-weight="700" text-anchor="middle" fill="#ffcf5a" letter-spacing="2">POUR ${esc(noEmoji(recipientName).toUpperCase())}</text>
  ${titleText}
  <svg x="${W / 2 - 95}" y="${H - 108}" width="190" height="44" viewBox="${logo.viewBox}">${logo.body}</svg>
  <text x="${W / 2}" y="${H - 34}" font-size="24" font-weight="700" text-anchor="middle" fill="#ffcf5a" letter-spacing="1">dedikace.app</text>
</svg>`;
}

/** Une ligne de refrain, en gros, au-dessus de « dedikace.app ». */
function lyricSvg(line: string): string {
  const lines = wrap(noEmoji(line), 22, 2);
  const y0 = H - 170 - (lines.length - 1) * 64;
  const text = lines
    .map(
      (l, i) =>
        `<text x="${W / 2}" y="${y0 + i * 64}" font-size="56" font-weight="800" text-anchor="middle" fill="#fff" stroke="#000" stroke-opacity="0.35" stroke-width="6" paint-order="stroke">${esc(l)}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${text}</svg>`;
}

/**
 * Choisit les 30 s de la vidéo : à partir de 1,5 s avant le premier refrain,
 * et les lignes de paroles à afficher pendant ce temps (réparties sur la durée de chaque section).
 */
export function videoWindow(lyrics: string, songSeconds: number) {
  const timeline = sectionTimeline(lyrics, songSeconds);
  const chorus = timeline.find((s) => s.isChorus) ?? timeline[0];
  const startMs = Math.max(0, Math.min((chorus?.startMs ?? 0) - 1_500, songSeconds * 1000 - VIDEO_SECONDS * 1000));
  const endMs = startMs + VIDEO_SECONDS * 1000;
  const cues: { text: string; from: number; to: number }[] = [];
  for (const s of timeline) {
    const per = s.durationMs / s.lines.length;
    s.lines.forEach((text, i) => {
      const a = s.startMs + i * per;
      const b = a + per;
      if (b <= startMs || a >= endMs) return;
      cues.push({ text, from: Math.max(0, (a - startMs) / 1000), to: Math.min(VIDEO_SECONDS, (b - startMs) / 1000) });
    });
  }
  return { startSeconds: startMs / 1000, cues };
}

export type VideoInput = {
  photo: Buffer;
  audio: Buffer;
  recipientName: string;
  title: string;
  lyrics: string;
  songSeconds: number;
};

/** Fabrique le MP4 (H.264 + AAC, 720×1280, 24 i/s) : le format accepté par les statuts WhatsApp. */
export async function renderStatusVideo(input: VideoInput): Promise<Buffer> {
  if (!ffmpegPath) throw new VideoError("ffmpeg introuvable sur ce serveur.");
  const dir = await mkdtemp(path.join(tmpdir(), "dedikace-video-"));
  try {
    // Photo : remise droite (EXIF), recadrée en 9:16 un peu plus grande que la vidéo pour le zoom.
    await sharp(input.photo)
      .rotate()
      .resize(Math.round(W * 1.15), Math.round(H * 1.15), { fit: "cover", position: "attention" })
      .jpeg({ quality: 88 })
      .toFile(path.join(dir, "photo.jpg"));
    await writeFile(path.join(dir, "song.mp3"), input.audio);
    await writeFile(path.join(dir, "frame.png"), png(frameSvg(input.recipientName, input.title, await whiteLogo())));

    const { startSeconds, cues } = videoWindow(input.lyrics, input.songSeconds);
    await Promise.all(cues.map((c, i) => writeFile(path.join(dir, `l${i}.png`), png(lyricSvg(c.text)))));

    const frames = VIDEO_SECONDS * FPS;
    // Zoom lent de 1 à 1,12 sur la durée, centré.
    const filters = [
      `[0:v]zoompan=z='1+0.12*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=${FPS},setsar=1[bg]`,
      `[bg][1:v]overlay=0:0[v0]`,
      ...cues.map(
        (c, i) =>
          `[v${i}][${i + 2}:v]overlay=0:0:enable='between(t,${c.from.toFixed(2)},${(c.to - 0.05).toFixed(2)})'[v${i + 1}]`,
      ),
      `[v${cues.length}]format=yuv420p[out]`,
    ];
    const audioIndex = cues.length + 2;
    const args = [
      "-y", "-loglevel", "error",
      "-loop", "1", "-framerate", String(FPS), "-t", String(VIDEO_SECONDS), "-i", path.join(dir, "photo.jpg"),
      "-loop", "1", "-framerate", String(FPS), "-t", String(VIDEO_SECONDS), "-i", path.join(dir, "frame.png"),
      ...cues.flatMap((_, i) => ["-loop", "1", "-framerate", String(FPS), "-t", String(VIDEO_SECONDS), "-i", path.join(dir, `l${i}.png`)]),
      "-ss", startSeconds.toFixed(2), "-t", String(VIDEO_SECONDS), "-i", path.join(dir, "song.mp3"),
      "-filter_complex", filters.join(";"),
      "-map", "[out]", "-map", `${audioIndex}:a`,
      "-af", `afade=t=in:st=0:d=0.8,afade=t=out:st=${VIDEO_SECONDS - 2}:d=2`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-r", String(FPS),
      "-c:a", "aac", "-b:a", "128k",
      "-t", String(VIDEO_SECONDS), "-movflags", "+faststart",
      path.join(dir, "out.mp4"),
    ];
    try {
      await run(ffmpegPath, args, { maxBuffer: 10 * 1024 * 1024, timeout: 180_000 });
    } catch (error) {
      throw new VideoError(`Création de la vidéo échouée : ${(error as { stderr?: string }).stderr?.slice(0, 300) ?? (error as Error).message}`);
    }
    return await readFile(path.join(dir, "out.mp4"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
