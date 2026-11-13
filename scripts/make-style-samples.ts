// Crée un extrait de 15 s par style pour /creer (public/styles/<style>.mp3), avec le même moteur qu'une commande.
// Chaque création : intro de 8 s + un refrain neutre (~14 s). On garde de 5 s à 20 s, en mono 48 kb/s (~90 Ko, 3G).
// npm run make:style-samples [-- makossa]   (sans argument : les 10)  —  ~10 × 22 s de crédit ElevenLabs.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const FESTIVE = ["[Refrain]", "Aujourd'hui c'est ta fête", "Tout le quartier chante pour toi", "Lève les mains, danse avec nous", "Cette chanson, elle est pour toi"].join("\n");
const GENTLE = ["[Refrain]", "Ta lumière brille encore", "Dans nos cœurs, tu es là", "Ton sourire nous guide", "On ne t'oubliera pas"].join("\n");

async function main() {
  const { generateSong } = await import("@/lib/elevenlabs");
  const { moderateText } = await import("@/lib/moderation");
  const { STYLES, stylePromptFor } = await import("@/lib/styles");

  const only = process.argv[2];
  const outDir = path.join("scripts", "out", "styles");
  const publicDir = path.join("public", "styles");
  mkdirSync(outDir, { recursive: true });
  mkdirSync(publicDir, { recursive: true });

  const todo = STYLES.map((s, i) => ({ ...s, voice: (i % 2 === 0 ? "female" : "male") as "female" | "male" })).filter(
    (s) => !only || s.id === only,
  );
  // 2 créations à la fois.
  for (let i = 0; i < todo.length; i += 2) {
    await Promise.all(
      todo.slice(i, i + 2).map(async (style) => {
        const lyrics = style.id === "hommage" ? GENTLE : FESTIVE;
        if (!moderateText(lyrics).ok) throw new Error("Texte refusé par la modération");
        const song = await generateSong({
          stylePrompt: stylePromptFor(style.id, style.voice),
          lyrics,
          songLanguage: "fr",
          chorusLanguage: "fr",
          durationSeconds: 22,
        });
        const full = path.join(outDir, `${style.id}.mp3`);
        writeFileSync(full, song.audio);
        execFileSync("ffmpeg", [
          "-y", "-loglevel", "error", "-ss", "5", "-t", "15", "-i", full,
          "-af", "afade=t=in:st=0:d=0.4,afade=t=out:st=13.5:d=1.5", "-ac", "1", "-b:a", "48k",
          path.join(publicDir, `${style.id}.mp3`),
        ]);
        console.log(`✓ ${style.id} (${style.voice})`);
      }),
    );
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error("✗", e instanceof Error ? e.message : e);
    process.exit(1);
  },
);
