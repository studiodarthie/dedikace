// Crée les exemples audio de l'accueil (public/examples/) avec le même circuit qu'une vraie commande :
// paroles Claude → modération → ElevenLabs. Consomme ~12 min de crédit ElevenLabs.
// npm run make:examples [-- nom-du-fichier.mp3]   (sans argument : tous)
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
      recipientName: "Marie",
      relation: "maman",
      senderName: "Junior",
      anecdotes: ["Elle prépare le meilleur ndolé du quartier", "Elle chante toujours en faisant le ménage"],
      chorusLanguage: "fr",
    },
  },
  {
    file: "reussite-bikutsi.mp3",
    styleId: "bikutsi",
    voice: "male",
    brief: {
      occasion: "reussite",
      recipientName: "Arielle",
      relation: "petite sœur",
      senderName: "Boris",
      anecdotes: [
        "Elle a eu son Bac D du premier coup",
        "Tout le quartier a dansé devant la maison quand les résultats sont sortis",
        "Elle révisait avec une lampe tempête pendant les coupures de courant",
      ],
      chorusLanguage: "fr",
    },
  },
  {
    file: "anniversaire-coupe-decale.mp3",
    styleId: "coupe-decale",
    voice: "female",
    brief: {
      occasion: "anniversaire",
      recipientName: "Cédric",
      relation: "meilleur ami",
      senderName: "la bande du quartier",
      anecdotes: [
        "Il fête ses 30 ans",
        "C'est toujours le premier sur la piste et le dernier à rentrer",
        "Il fait le meilleur poisson braisé de toute la bande",
      ],
      chorusLanguage: "fr",
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
  const { stylePromptFor, styleAvoidFor } = await import("@/lib/styles");

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
        const lyrics = await generateLyrics({ songLanguage: "fr", ...ex.brief, anecdotes: [...ex.brief.anecdotes], styleId: ex.styleId });
        if (!lyrics.ok) throw new Error(`${ex.file} : paroles refusées (${lyrics.note})`);
        const check = moderateText(lyrics.title, lyrics.lyrics);
        if (!check.ok) throw new Error(`${ex.file} : modération (${check.matches.join(", ")})`);
        const started = Date.now();
        const song = await generateSong({
          stylePrompt: stylePromptFor(ex.styleId, ex.voice),
          styleAvoid: styleAvoidFor(ex.styleId),
          lyrics: lyrics.lyrics,
          songLanguage: "fr",
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
        mkdirSync(path.join(publicDir, "full"), { recursive: true });
        execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", full, "-b:a", "64k", path.join(publicDir, "full", ex.file)]);
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
