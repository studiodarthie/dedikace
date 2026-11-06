// Essai du moteur musical : npm run test:music [-- --full]
// Par défaut, ~30 s (un couplet court + refrain) pour économiser les crédits ElevenLabs ; --full = 3 min.
// Le MP3 est copié dans scripts/out/ et envoyé sur R2 sous _test/ (lien d'écoute valable 1 h).
import { mkdirSync, writeFileSync } from "node:fs";
import { generateSong } from "@/lib/elevenlabs";
import { getSignedSongUrl, uploadSong } from "@/lib/storage";
import { stylePromptFor } from "@/lib/styles";

const full = process.argv.includes("--full");

const SHORT = `[Couplet 1]
À Douala, le matin se lève,
Ton ndolé parfume la maison.

[Refrain]
Joyeux anniversaire, Mireille,
Maman, tu brilles comme le soleil.
On danse, on chante pour toi ce soir,
Mireille, tu es notre espoir.`;

const FULL = `[Couplet 1]
À Douala, le matin se lève,
Ton ndolé parfume la maison.
Tes mains font chanter la cuisine,
Toute la rue connaît ton nom.
Le meilleur ndolé de la ville,
C'est toi qui le fais avec amour.
Partout on vient à ta table,
Et l'on sourit jusqu'au retour.

[Refrain]
Joyeux anniversaire, Mireille,
Maman, tu brilles comme le soleil.
On danse, on chante pour toi ce soir,
Mireille, tu es notre espoir.

[Couplet 2]
Cinq enfants, tu les as portés,
Seule debout dans la tempête.
Tu as donné sans te plaindre,
Ton courage est notre fête.
Chaque pas que nous faisons,
Vient de ta force et de ta voix.
Junior te dit du fond du cœur,
Merci pour tout ce que tu es, toi.

[Refrain]
Joyeux anniversaire, Mireille,
Maman, tu brilles comme le soleil.
On danse, on chante pour toi ce soir,
Mireille, tu es notre espoir.

[Pont]
Le makossa résonne pour toi,
Bats des mains, maman, danse avec moi.
La famille entière est là,
Et tout l'amour est dans nos voix.

[Refrain]
Joyeux anniversaire, Mireille,
Maman, tu brilles comme le soleil.
On danse, on chante pour toi ce soir,
Mireille, tu es notre espoir.`;

async function main() {
  const start = performance.now();
  const song = await generateSong({
    stylePrompt: stylePromptFor("makossa", "female"),
    lyrics: full ? FULL : SHORT,
    songLanguage: "fr",
    chorusLanguage: "fr",
    durationSeconds: full ? 180 : 30,
  });
  const seconds = ((performance.now() - start) / 1000).toFixed(0);
  const name = `test-${full ? "complet" : "court"}-${Date.now()}.mp3`;
  mkdirSync("scripts/out", { recursive: true });
  writeFileSync(`scripts/out/${name}`, song.audio);
  await uploadSong(`_test/${name}`, song.audio);
  const url = await getSignedSongUrl(`_test/${name}`, 3600);
  console.log(`Généré en ${seconds} s — ${(song.audio.length / 1e6).toFixed(1)} Mo — ${song.durationSeconds} s prévues — song-id ${song.songId}`);
  console.log(`Fichier local : scripts/out/${name}`);
  console.log(`Écoute (1 h) : ${url}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
