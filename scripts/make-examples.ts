// Crée les 4 exemples audio de l'accueil (public/examples/) avec le même circuit qu'une vraie commande :
// paroles Claude → modération → ElevenLabs. Consomme ~12 min de crédit ElevenLabs.
// npm run make:examples [-- nom-du-fichier.mp3]   (sans argument : les 4)
// La chanson complète est gardée dans scripts/out/examples/ ; l'accueil reçoit un extrait de 80 s (ffmpeg).
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const EXAMPLES = [
  {
    file: "anniversaire-makossa.mp3",
    styleId: "makossa",
    voice: "female",
    brief: {
      occasion: "anniversaire",
      recipientName: "Mireille",
      relation: "maman",
      senderName: "Junior",
      anecdotes: ["Elle prépare le meilleur ndolé du quartier", "Elle chante toujours en faisant le ménage"],
      chorusLanguage: "fr",
    },
  },
  {
    file: "dot-bikutsi.mp3",
    styleId: "bikutsi",
    voice: "male",
    brief: {
      occasion: "dot",
      recipientName: "Ngono",
      relation: "future épouse",
      senderName: "Paul",
      anecdotes: ["On s'est rencontrés à l'université de Yaoundé", "Son rire illumine toute la famille"],
      chorusLanguage: "fr",
    },
  },
  {
    file: "bac-afrobeats.mp3",
    styleId: "afrobeats",
    voice: "female",
    brief: {
      occasion: "reussite",
      recipientName: "Brenda",
      relation: "petite sœur",
      senderName: "Steve",
      anecdotes: ["Elle a eu son Bac avec mention", "Elle veut devenir médecin", "Elle révisait tard le soir à la lampe"],
      chorusLanguage: "pidgin",
    },
  },
  {
    file: "hommage-acoustique.mp3",
    styleId: "hommage",
    voice: "male",
    brief: {
      occasion: "deuil",
      recipientName: "Emmanuel",
      relation: "papa",
      senderName: "ses enfants",
      anecdotes: ["Il se levait à 5 h pour aller au champ", "Il disait toujours : le travail paie"],
      chorusLanguage: "fr",
    },
  },
] as const;

const EXTRACT_SECONDS = 80;

async function main() {
  const { generateLyrics } = await import("@/lib/claude");
  const { generateSong } = await import("@/lib/elevenlabs");
  const { moderateText } = await import("@/lib/moderation");
  const { stylePromptFor } = await import("@/lib/styles");

  const only = process.argv[2];
  const outDir = path.join("scripts", "out", "examples");
  const publicDir = path.join("public", "examples");
  mkdirSync(outDir, { recursive: true });
  mkdirSync(publicDir, { recursive: true });

  const todo = EXAMPLES.filter((e) => !only || e.file === only);
  // 2 créations à la fois.
  for (let i = 0; i < todo.length; i += 2) {
    await Promise.all(
      todo.slice(i, i + 2).map(async (ex) => {
        const lyrics = await generateLyrics({ ...ex.brief, anecdotes: [...ex.brief.anecdotes], styleId: ex.styleId });
        if (!lyrics.ok) throw new Error(`${ex.file} : paroles refusées (${lyrics.note})`);
        const check = moderateText(lyrics.title, lyrics.lyrics);
        if (!check.ok) throw new Error(`${ex.file} : modération (${check.matches.join(", ")})`);
        const started = Date.now();
        const song = await generateSong({
          stylePrompt: stylePromptFor(ex.styleId, ex.voice),
          lyrics: lyrics.lyrics,
          chorusLanguage: ex.brief.chorusLanguage,
          durationSeconds: 180,
        });
        const full = path.join(outDir, ex.file);
        writeFileSync(full, song.audio);
        writeFileSync(full.replace(/\.mp3$/, ".txt"), `${lyrics.title}\n\n${lyrics.lyrics}\n`);
        // Extrait léger pour la 3G : 80 s, fondu final de 4 s, 96 kb/s.
        execFileSync("ffmpeg", [
          "-y", "-loglevel", "error", "-i", full, "-t", String(EXTRACT_SECONDS),
          "-af", `afade=t=out:st=${EXTRACT_SECONDS - 4}:d=4`, "-b:a", "96k", path.join(publicDir, ex.file),
        ]);
        console.log(`✓ ${ex.file} — « ${lyrics.title} » — créée en ${Math.round((Date.now() - started) / 1000)} s`);
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
